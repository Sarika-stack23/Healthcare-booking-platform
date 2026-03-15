import { z } from 'zod';

// ─── Upload Record ────────────────────────────────────────────────────────────

export const uploadRecordSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title cannot exceed 200 characters'),

  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),

  recordType: z.enum(
    ['lab_report', 'prescription', 'imaging', 'discharge_summary', 'consultation_note', 'other'],
    { errorMap: () => ({ message: 'Invalid record type' }) }
  ),

  patientId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid patient ID format')
    .optional(), // Optional — defaults to self if patient uploads

  appointmentId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid appointment ID format')
    .optional(),

  tags: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      return val
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }),
});

export type UploadRecordInput = z.infer<typeof uploadRecordSchema>;

// ─── List Records Query ───────────────────────────────────────────────────────

export const listRecordsQuerySchema = z.object({
  recordType: z
    .enum(['lab_report', 'prescription', 'imaging', 'discharge_summary', 'consultation_note', 'other'])
    .optional(),

  patientId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid patient ID format')
    .optional(),

  appointmentId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid appointment ID format')
    .optional(),

  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),

  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),

  tags: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    }),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;