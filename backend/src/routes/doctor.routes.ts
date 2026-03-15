import { Router } from 'express';
import * as DoctorController from '../controllers/doctor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeDoctorSelf, authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  weeklyScheduleSchema,
  dateOverrideSchema,
  breakTimeSchema,
  availableSlotsQuerySchema,
} from '../validators/appointment.validator';

const router = Router();

// ─── Public (still requires auth) ────────────────────────────────────────────

// GET /api/doctors/:doctorId/availability
router.get(
  '/:doctorId/availability',
  authenticate,
  DoctorController.getAvailability
);

// GET /api/doctors/:doctorId/available-slots?date=YYYY-MM-DD
router.get(
  '/:doctorId/available-slots',
  authenticate,
  validate(availableSlotsQuerySchema, 'query'),
  DoctorController.getAvailableSlots
);

// ─── Doctor/Admin Only ────────────────────────────────────────────────────────

// POST /api/doctors/:doctorId/availability/weekly
router.post(
  '/:doctorId/availability/weekly',
  authenticate,
  authorize('doctor', 'admin'),
  authorizeDoctorSelf,
  validate(weeklyScheduleSchema),
  DoctorController.setWeeklySchedule
);

// POST /api/doctors/:doctorId/availability/overrides
router.post(
  '/:doctorId/availability/overrides',
  authenticate,
  authorize('doctor', 'admin'),
  authorizeDoctorSelf,
  validate(dateOverrideSchema),
  DoctorController.setDateOverride
);

// PUT /api/doctors/:doctorId/availability/breaks
router.put(
  '/:doctorId/availability/breaks',
  authenticate,
  authorize('doctor', 'admin'),
  authorizeDoctorSelf,
  validate(breakTimeSchema),
  DoctorController.setBreakTimes
);

export default router;