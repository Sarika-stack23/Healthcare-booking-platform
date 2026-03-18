import { z } from 'zod';

// ─── Send Notification ────────────────────────────────────────────────────────

export const sendNotificationSchema = z.object({
  userId: z
    .string({ required_error: 'userId is required' })
    .regex(/^[a-f\d]{24}$/i, 'Invalid user ID format'),

  type: z.enum(['email', 'sms', 'push'], {
    errorMap: () => ({ message: 'type must be email, sms, or push' }),
  }),

  template: z
    .string({ required_error: 'template is required' })
    .trim()
    .min(1, 'template cannot be empty')
    .max(100, 'template name too long'),

  subject: z.string().trim().max(200).optional(),

  body: z
    .string({ required_error: 'body is required' })
    .trim()
    .min(1, 'body cannot be empty')
    .max(5000, 'body too long'),

  recipient: z
    .string({ required_error: 'recipient is required' })
    .trim()
    .min(3, 'recipient too short'),

  metadata: z.record(z.unknown()).optional(),

  scheduledAt: z
    .string()
    .datetime({ message: 'scheduledAt must be a valid ISO 8601 datetime' })
    .optional(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

// ─── List Notifications Query ─────────────────────────────────────────────────

export const listNotificationsQuerySchema = z.object({
  type: z.enum(['email', 'sms', 'push']).optional(),
  status: z.enum(['pending', 'sent', 'failed', 'retrying']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;