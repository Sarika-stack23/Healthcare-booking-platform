import { z } from 'zod';

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters'),

    lastName: z
      .string({ required_error: 'Last name is required' })
      .trim()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters'),

    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),

    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password cannot exceed 100 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),

    confirmPassword: z.string({ required_error: 'Please confirm your password' }),

    role: z.enum(['patient', 'doctor'], {
      errorMap: () => ({ message: 'Role must be either patient or doctor' }),
    }),

    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s\-()]{7,15}$/, 'Please provide a valid phone number')
      .optional(),

    // Doctor-specific fields
    specialization: z.string().trim().min(2).max(100).optional(),
    consultationFee: z.number().min(0).optional(),
    qualifications: z.array(z.string().trim()).optional(),
    experienceYears: z.number().min(0).max(60).optional(),
    licenseNumber: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'doctor') {
        return !!data.specialization && data.consultationFee !== undefined;
      }
      return true;
    },
    {
      message: 'Doctors must provide specialization and consultation fee',
      path: ['specialization'],
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),

  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password cannot exceed 100 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),

    confirmPassword: z.string({ required_error: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;