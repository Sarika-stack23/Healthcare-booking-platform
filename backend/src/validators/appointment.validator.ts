import { z } from 'zod';

// ─── Book Appointment ─────────────────────────────────────────────────────────

export const bookAppointmentSchema = z.object({
  doctorId: z
    .string({ required_error: 'Doctor ID is required' })
    .regex(/^[a-f\d]{24}$/i, 'Invalid doctor ID format'),

  scheduledDate: z
    .string({ required_error: 'Scheduled date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const scheduled = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return scheduled >= today;
    }, 'Appointment date cannot be in the past'),

  scheduledTime: z
    .string({ required_error: 'Scheduled time is required' })
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format'),

  reasonForVisit: z
    .string({ required_error: 'Reason for visit is required' })
    .trim()
    .min(5, 'Please provide a more detailed reason (min 5 characters)')
    .max(500, 'Reason cannot exceed 500 characters'),

  symptoms: z
    .array(z.string().trim().max(100))
    .max(20, 'Cannot list more than 20 symptoms')
    .optional(),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

// ─── Reschedule Appointment ───────────────────────────────────────────────────

export const rescheduleAppointmentSchema = z.object({
  scheduledDate: z
    .string({ required_error: 'New date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const scheduled = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return scheduled >= today;
    }, 'Appointment date cannot be in the past'),

  scheduledTime: z
    .string({ required_error: 'New time is required' })
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format'),

  reason: z.string().trim().max(300).optional(),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

// ─── Cancel Appointment ───────────────────────────────────────────────────────

export const cancelAppointmentSchema = z.object({
  reason: z
    .string({ required_error: 'Cancellation reason is required' })
    .trim()
    .min(5, 'Please provide a reason (min 5 characters)')
    .max(300, 'Reason cannot exceed 300 characters'),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

// ─── List Appointments Query ──────────────────────────────────────────────────

export const listAppointmentsQuerySchema = z.object({
  status: z
    .enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  doctorId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid doctor ID format')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(10),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

// ─── Available Slots Query ────────────────────────────────────────────────────

export const availableSlotsQuerySchema = z.object({
  date: z
    .string({ required_error: 'Date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'Date cannot be in the past'),
});

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;

// ─── Weekly Schedule ──────────────────────────────────────────────────────────

const timeSlotSchema = z.object({
  start: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'),
  end: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format'),
}).refine((slot) => slot.start < slot.end, {
  message: 'End time must be after start time',
});

export const weeklyScheduleSchema = z.object({
  schedule: z.array(
    z.object({
      dayOfWeek: z.enum([
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday',
      ]),
      isAvailable: z.boolean(),
      slots: z.array(timeSlotSchema).max(10),
    })
  ).min(1, 'At least one day must be provided'),
  slotDurationMinutes: z.number().int().min(10).max(120).optional(),
});

export type WeeklyScheduleInput = z.infer<typeof weeklyScheduleSchema>;

// ─── Date Override ────────────────────────────────────────────────────────────

export const dateOverrideSchema = z.object({
  date: z
    .string({ required_error: 'Date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  isAvailable: z.boolean(),
  slots: z.array(timeSlotSchema).max(10),
  reason: z.string().trim().max(200).optional(),
});

export type DateOverrideInput = z.infer<typeof dateOverrideSchema>;

// ─── Break Times ──────────────────────────────────────────────────────────────

export const breakTimeSchema = z.object({
  breaks: z.array(
    z.object({
      dayOfWeek: z.enum([
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday',
      ]),
      start: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'),
      end: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format'),
      isRecurring: z.boolean().default(true),
    }).refine((b) => b.start < b.end, {
      message: 'Break end time must be after start time',
    })
  ).min(1, 'At least one break must be provided'),
});

export type BreakTimeInput = z.infer<typeof breakTimeSchema>;