import { Types } from 'mongoose';

// ─── Enums ─────────────────────────────────────────────────────────────────

export type IUserRole = 'patient' | 'doctor' | 'admin';

export type IAppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type IRecordType =
  | 'lab_report'
  | 'prescription'
  | 'imaging'
  | 'discharge_summary'
  | 'consultation_note'
  | 'other';

export type IDayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// ─── User Interfaces ────────────────────────────────────────────────────────

export interface IPatientProfile {
  dateOfBirth?: Date;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface IDoctorProfile {
  specialization: string;
  qualifications: string[];
  consultationFee: number;
  experienceYears?: number;
  bio?: string;
  licenseNumber?: string;
}

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: IUserRole;
  phone?: string;
  profilePicture?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  tokenVersion: number;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  patientProfile?: IPatientProfile;
  doctorProfile?: IDoctorProfile;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Availability Interfaces ────────────────────────────────────────────────

export interface ITimeSlot {
  start: string; // HH:mm format
  end: string;
}

export interface IWeeklySchedule {
  dayOfWeek: IDayOfWeek;
  isAvailable: boolean;
  slots: ITimeSlot[];
}

export interface IDateOverride {
  date: Date;
  isAvailable: boolean;
  slots: ITimeSlot[];
  reason?: string;
}

export interface IBreakTime {
  dayOfWeek: IDayOfWeek;
  start: string;
  end: string;
  isRecurring: boolean;
}

// ─── Appointment Interfaces ─────────────────────────────────────────────────

export interface IAppointmentNote {
  content: string;
  addedBy: Types.ObjectId;
  addedAt: Date;
}

// ─── Medical Record Interfaces ──────────────────────────────────────────────

export interface IFileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageType: 'local' | 's3';
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── API Response ───────────────────────────────────────────────────────────

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>[];
}