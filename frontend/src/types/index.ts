export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  patientProfile?: { allergies: string[] };
  doctorProfile?: {
    specialization: string;
    consultationFee: number;
    qualifications: string[];
  };
  createdAt: string;
}

export interface Appointment {
  _id: string;
  patientId: User | string;
  doctorId: User | string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  reasonForVisit: string;
  consultationFee: number;
  cancelReason?: string;
  completedAt?: string;
  auditLog: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    details?: string;
  }>;
  createdAt: string;
}

export interface MedicalRecord {
  _id: string;
  patientId: User | string;
  uploadedBy: User | string;
  title: string;
  description?: string;
  recordType: string;
  file: {
    originalName: string;
    mimeType: string;
    size: number;
  };
  tags: string[];
  createdAt: string;
}

export interface TimeSlot {
  date: string;
  slots: string[];
  slotDurationMinutes: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
