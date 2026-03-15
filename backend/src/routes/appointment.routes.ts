import { Router } from 'express';
import * as AppointmentController from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  listAppointmentsQuerySchema,
} from '../validators/appointment.validator';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

// ─── All Roles ────────────────────────────────────────────────────────────────

// GET /api/appointments
router.get(
  '/',
  validate(listAppointmentsQuerySchema, 'query'),
  AppointmentController.listAppointments
);

// GET /api/appointments/:id
router.get(
  '/:id',
  AppointmentController.getAppointment
);

// ─── Patient Only ─────────────────────────────────────────────────────────────

// POST /api/appointments
router.post(
  '/',
  authorize('patient'),
  validate(bookAppointmentSchema),
  AppointmentController.bookAppointment
);

// ─── Patient + Doctor + Admin ─────────────────────────────────────────────────

// PUT /api/appointments/:id/reschedule
router.put(
  '/:id/reschedule',
  authorize('patient', 'doctor', 'admin'),
  validate(rescheduleAppointmentSchema),
  AppointmentController.rescheduleAppointment
);

// PUT /api/appointments/:id/cancel
router.put(
  '/:id/cancel',
  authorize('patient', 'doctor', 'admin'),
  validate(cancelAppointmentSchema),
  AppointmentController.cancelAppointment
);

// ─── Doctor Only ──────────────────────────────────────────────────────────────

// PUT /api/appointments/:id/complete
router.put(
  '/:id/complete',
  authorize('doctor'),
  AppointmentController.completeAppointment
);

export default router;