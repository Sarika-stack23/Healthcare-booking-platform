import AuditLog from '../models/AuditLog';
import { logger } from './logger';

interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    await AuditLog.create({
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    // Audit log failure should never break the main flow
    logger.error('Failed to create audit log:', error);
  }
};

export const AuditActions = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET: 'PASSWORD_RESET',
  TOKEN_REFRESH: 'TOKEN_REFRESH',

  // Users
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  PROFILE_VIEW: 'PROFILE_VIEW',

  // Appointments
  APPOINTMENT_BOOK: 'APPOINTMENT_BOOK',
  APPOINTMENT_CANCEL: 'APPOINTMENT_CANCEL',
  APPOINTMENT_RESCHEDULE: 'APPOINTMENT_RESCHEDULE',
  APPOINTMENT_COMPLETE: 'APPOINTMENT_COMPLETE',
  APPOINTMENT_VIEW: 'APPOINTMENT_VIEW',

  // Medical Records
  RECORD_UPLOAD: 'RECORD_UPLOAD',
  RECORD_DOWNLOAD: 'RECORD_DOWNLOAD',
  RECORD_DELETE: 'RECORD_DELETE',
  RECORD_VIEW: 'RECORD_VIEW',

  // Availability
  AVAILABILITY_SET: 'AVAILABILITY_SET',
  AVAILABILITY_UPDATE: 'AVAILABILITY_UPDATE',
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];