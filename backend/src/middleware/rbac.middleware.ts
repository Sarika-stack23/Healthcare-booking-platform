import { Request, Response, NextFunction } from 'express';
import { IUserRole } from '../types';
import { ApiError } from '../utils/ApiError';

// ─── Role Guard ───────────────────────────────────────────────────────────────

export const authorize = (...allowedRoles: IUserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

// ─── Resource Ownership Guard ─────────────────────────────────────────────────

// Ensures the requesting user owns the resource OR is admin/doctor
export const authorizeOwnerOrRole = (...allowedRoles: IUserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const resourceUserId = req.params.userId || req.params.patientId;

    // Allow if user owns the resource
    if (resourceUserId && req.user.userId === resourceUserId) {
      return next();
    }

    // Allow if user has one of the allowed roles
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return next(ApiError.forbidden('You do not have permission to access this resource'));
  };
};

// ─── Doctor Self-Only Guard ───────────────────────────────────────────────────

// Ensures a doctor can only modify their own availability/records
export const authorizeDoctorSelf = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  const doctorId = req.params.doctorId;

  if (req.user.role === 'admin') {
    return next(); // Admin can do anything
  }

  if (req.user.role === 'doctor' && req.user.userId === doctorId) {
    return next(); // Doctor modifying own data
  }

  return next(ApiError.forbidden('Doctors can only modify their own data'));
};

// ─── Appointment Access Guard ─────────────────────────────────────────────────

// Used with appointment endpoints — patient, doctor involved, or admin
export const authorizeAppointmentAccess = (
  patientId: string,
  doctorId: string,
  req: Request
): boolean => {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  if (req.user.userId === patientId) return true;
  if (req.user.userId === doctorId) return true;
  return false;
};