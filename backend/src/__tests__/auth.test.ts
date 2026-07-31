import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// ─── Mock dependencies BEFORE importing the service ──────────────────────────

jest.mock('../models/User');
jest.mock('../utils/auditLog', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
  AuditActions: {
    REGISTER: 'REGISTER',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    TOKEN_REFRESH: 'TOKEN_REFRESH',
    PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
    PASSWORD_RESET: 'PASSWORD_RESET',
  },
}));

import User from '../models/User';
import { ApiError } from '../utils/ApiError';

const MockUser = User as jest.Mocked<typeof User>;

// ─── ApiError ─────────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('creates error with correct status code', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.isOperational).toBe(true);
  });

  it('static .badRequest() returns 400', () => {
    const err = ApiError.badRequest('Bad');
    expect(err.statusCode).toBe(400);
  });

  it('static .unauthorized() returns 401', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
  });

  it('static .forbidden() returns 403', () => {
    const err = ApiError.forbidden();
    expect(err.statusCode).toBe(403);
  });

  it('static .notFound() returns 404', () => {
    const err = ApiError.notFound();
    expect(err.statusCode).toBe(404);
  });

  it('static .conflict() returns 409', () => {
    const err = ApiError.conflict('Conflict');
    expect(err.statusCode).toBe(409);
  });

  it('static .internal() returns 500 and isOperational=false', () => {
    const err = ApiError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it('stores validation errors array', () => {
    const errors = [{ field: 'email', message: 'Invalid' }];
    const err = ApiError.badRequest('Validation failed', errors);
    expect(err.errors).toEqual(errors);
  });

  it('is an instance of Error', () => {
    const err = ApiError.notFound('Missing');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });
});

// ─── JWT helpers ──────────────────────────────────────────────────────────────

describe('JWT utilities', () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env = {
      ...OLD_ENV,
      JWT_ACCESS_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('generates a valid JWT access token', () => {
    // Import after env is set
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { generateAccessToken } = require('../utils/jwt');
    const payload = { userId: 'u1', email: 'a@b.com', role: 'patient' as const };
    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    const decoded = jwt.decode(token) as { userId: string; email: string };
    expect(decoded.userId).toBe('u1');
    expect(decoded.email).toBe('a@b.com');
  });

  it('verifyAccessToken rejects a tampered token', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { verifyAccessToken } = require('../utils/jwt');
    expect(() => verifyAccessToken('bad.token.here')).toThrow();
  });

  it('generateTokenPair returns both tokens', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { generateTokenPair } = require('../utils/jwt');
    const pair = generateTokenPair({ userId: 'u1', email: 'a@b.com', role: 'patient' as const }, 0);
    expect(pair).toHaveProperty('accessToken');
    expect(pair).toHaveProperty('refreshToken');
    expect(typeof pair.accessToken).toBe('string');
    expect(typeof pair.refreshToken).toBe('string');
  });
});

// ─── Password hashing ─────────────────────────────────────────────────────────

describe('bcrypt password hashing', () => {
  it('hashes a password', async () => {
    const hash = await bcrypt.hash('Password123', 12);
    expect(hash).not.toBe('Password123');
    expect(hash.startsWith('$2b$') || hash.startsWith('$2a$')).toBe(true);
  });

  it('compares correct password correctly', async () => {
    const hash = await bcrypt.hash('Password123', 12);
    const result = await bcrypt.compare('Password123', hash);
    expect(result).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await bcrypt.hash('Password123', 12);
    const result = await bcrypt.compare('WrongPass', hash);
    expect(result).toBe(false);
  });
});

// ─── Register validation contract ────────────────────────────────────────────

describe('registerSchema (Zod)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { registerSchema } = require('../validators/auth.validator');

  it('accepts valid patient registration', () => {
    const input = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'patient',
    };
    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const input = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Different123',
      role: 'patient',
    };
    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      firstName: 'John', lastName: 'Doe',
      email: 'not-an-email',
      password: 'Password123', confirmPassword: 'Password123',
      role: 'patient',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({
      firstName: 'John', lastName: 'Doe', email: 'j@e.com',
      password: 'password123', confirmPassword: 'password123',
      role: 'patient',
    });
    expect(result.success).toBe(false);
  });

  it('rejects doctor without specialization', () => {
    const result = registerSchema.safeParse({
      firstName: 'Dr', lastName: 'Smith', email: 'dr@e.com',
      password: 'Password123', confirmPassword: 'Password123',
      role: 'doctor',
      // missing specialization and consultationFee
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid doctor registration', () => {
    const result = registerSchema.safeParse({
      firstName: 'Dr', lastName: 'Smith', email: 'dr@e.com',
      password: 'Password123', confirmPassword: 'Password123',
      role: 'doctor',
      specialization: 'Cardiology',
      consultationFee: 500,
    });
    expect(result.success).toBe(true);
  });
});

// ─── Appointment validator ────────────────────────────────────────────────────

describe('bookAppointmentSchema (Zod)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { bookAppointmentSchema } = require('../validators/appointment.validator');

  const validInput = {
    doctorId: '64f1a2b3c4d5e6f7a8b9c0d1',
    scheduledDate: '2099-12-31',
    scheduledTime: '09:00',
    reasonForVisit: 'Routine checkup',
  };

  it('accepts valid booking input', () => {
    const result = bookAppointmentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects invalid doctorId format', () => {
    const result = bookAppointmentSchema.safeParse({ ...validInput, doctorId: 'bad-id' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const result = bookAppointmentSchema.safeParse({ ...validInput, scheduledTime: '9:00' });
    expect(result.success).toBe(false);
  });

  it('rejects past dates', () => {
    const result = bookAppointmentSchema.safeParse({ ...validInput, scheduledDate: '2000-01-01' });
    expect(result.success).toBe(false);
  });

  it('rejects short reason', () => {
    const result = bookAppointmentSchema.safeParse({ ...validInput, reasonForVisit: 'Hi' });
    expect(result.success).toBe(false);
  });
});

// ─── Notification validator ───────────────────────────────────────────────────

describe('sendNotificationSchema (Zod)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sendNotificationSchema } = require('../validators/notification.validator');

  it('accepts valid notification input', () => {
    const result = sendNotificationSchema.safeParse({
      userId: '64f1a2b3c4d5e6f7a8b9c0d1',
      type: 'email',
      template: 'appointment_booked',
      body: 'Your appointment is confirmed',
      recipient: 'patient@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid notification type', () => {
    const result = sendNotificationSchema.safeParse({
      userId: '64f1a2b3c4d5e6f7a8b9c0d1',
      type: 'fax',
      template: 'appointment_booked',
      body: 'test',
      recipient: 'a@b.com',
    });
    expect(result.success).toBe(false);
  });
});

// ─── Record validator ─────────────────────────────────────────────────────────

describe('uploadRecordSchema (Zod)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { uploadRecordSchema } = require('../validators/record.validator');

  it('accepts valid record input', () => {
    const result = uploadRecordSchema.safeParse({
      title: 'Blood Test',
      recordType: 'lab_report',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid record type', () => {
    const result = uploadRecordSchema.safeParse({
      title: 'Blood Test',
      recordType: 'xray_scan', // not in enum
    });
    expect(result.success).toBe(false);
  });

  it('transforms comma-separated tags to array', () => {
    const result = uploadRecordSchema.safeParse({
      title: 'Blood Test',
      recordType: 'lab_report',
      tags: 'blood,cbc,metabolic',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(['blood', 'cbc', 'metabolic']);
    }
  });
});

// ─── Mock users test ──────────────────────────────────────────────────────────

describe('User model mock sanity', () => {
  it('findOne mock can be configured', async () => {
    (MockUser.findOne as jest.Mock).mockResolvedValue(null);
    const result = await User.findOne({ email: 'x@x.com' });
    expect(result).toBeNull();
  });
});