import { Router } from 'express';
import * as NotificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  sendNotificationSchema,
  listNotificationsQuerySchema,
} from '../validators/notification.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/notifications/send — doctor or admin triggers a notification
router.post(
  '/send',
  authorize('doctor', 'admin'),
  validate(sendNotificationSchema),
  NotificationController.sendNotification
);

// GET /api/notifications — list my notifications
router.get(
  '/',
  validate(listNotificationsQuerySchema, 'query'),
  NotificationController.listNotifications
);

// GET /api/notifications/:id
router.get(
  '/:id',
  NotificationController.getNotification
);

// POST /api/notifications/:id/retry — retry a failed notification
router.post(
  '/:id/retry',
  NotificationController.retryNotification
);

// POST /api/notifications/queue/process — admin manually triggers queue worker
router.post(
  '/queue/process',
  authorize('admin'),
  NotificationController.processQueue
);

export default router;