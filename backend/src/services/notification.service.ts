import Notification, { INotificationDocument } from '../models/Notification';
import User from '../models/User';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { SendNotificationInput, ListNotificationsQuery } from '../validators/notification.validator';
import { IPaginatedResponse } from '../types';

// ─── Template Registry ────────────────────────────────────────────────────────
// In production this would load HTML templates from a template engine (Handlebars, etc.)

const TEMPLATES: Record<string, { subject: string; body: (data: Record<string, unknown>) => string }> = {
  appointment_booked: {
    subject: 'Your appointment has been booked',
    body: (d) =>
      `Hello ${d.patientName},\n\nYour appointment with Dr. ${d.doctorName} is confirmed for ${d.date} at ${d.time}.\n\nReason: ${d.reason}\n\nThank you,\nMedAILockr`,
  },
  appointment_cancelled: {
    subject: 'Your appointment has been cancelled',
    body: (d) =>
      `Hello ${d.patientName},\n\nYour appointment with Dr. ${d.doctorName} on ${d.date} at ${d.time} has been cancelled.\n\nReason: ${d.reason}\n\nPlease rebook at your convenience.\n\nMedAILockr`,
  },
  appointment_reminder: {
    subject: 'Appointment reminder',
    body: (d) =>
      `Hello ${d.patientName},\n\nThis is a reminder for your appointment with Dr. ${d.doctorName} tomorrow at ${d.time}.\n\nMedAILockr`,
  },
  password_reset: {
    subject: 'Password reset request',
    body: (d) =>
      `Hello,\n\nYou requested a password reset. Use the token below (valid 1 hour):\n\n${d.token}\n\nIf you did not request this, ignore this email.\n\nMedAILockr`,
  },
  welcome: {
    subject: 'Welcome to MedAILockr',
    body: (d) =>
      `Hello ${d.name},\n\nWelcome to MedAILockr! Your account has been created successfully.\n\nMedAILockr`,
  },
};

// ─── Dispatch Simulation ──────────────────────────────────────────────────────
// In production: replace each branch with real provider SDKs
// (Nodemailer/SendGrid for email, Twilio for SMS, FCM for push)

const dispatch = async (
  type: string,
  recipient: string,
  subject: string | undefined,
  body: string
): Promise<void> => {
  // Simulate async I/O (network call to provider)
  await new Promise((r) => setTimeout(r, 50));

  // Simulate occasional transient failures (10% rate — for retry demo)
  if (Math.random() < 0.1) {
    throw new Error('Provider transient error: connection timeout');
  }

  logger.info(`[Notification] ${type.toUpperCase()} dispatched`, {
    recipient,
    subject: subject || '(no subject)',
    preview: body.slice(0, 80),
  });
};

// ─── Process Queue (retry worker) ─────────────────────────────────────────────
// In production this runs on a Bull/Agenda job every N minutes

export const processNotificationQueue = async (): Promise<void> => {
  const pending = await Notification.find({
    status: { $in: ['pending', 'retrying'] },
    $or: [
      { scheduledAt: { $lte: new Date() } },
      { scheduledAt: { $exists: false } },
    ],
    $expr: { $lt: ['$retryCount', '$maxRetries'] },
  }).limit(50);

  for (const notification of pending) {
    notification.lastAttemptAt = new Date();
    notification.retryCount += 1;

    try {
      await dispatch(notification.type, notification.recipient, notification.subject, notification.body);
      notification.status = 'sent';
      notification.sentAt = new Date();
      logger.info(`[Queue] Notification ${notification._id} sent successfully`);
    } catch (err) {
      const isExhausted = notification.retryCount >= notification.maxRetries;
      notification.status = isExhausted ? 'failed' : 'retrying';
      notification.failureReason = (err as Error).message;

      if (isExhausted) {
        logger.warn(`[Queue] Notification ${notification._id} permanently failed after ${notification.retryCount} attempts`);
      } else {
        logger.warn(`[Queue] Notification ${notification._id} failed, will retry (attempt ${notification.retryCount}/${notification.maxRetries})`);
      }
    }

    await notification.save();
  }
};

// ─── Send Notification ────────────────────────────────────────────────────────

export const sendNotification = async (
  input: SendNotificationInput
): Promise<INotificationDocument> => {
  // Verify user exists
  const user = await User.findById(input.userId);
  if (!user) throw ApiError.notFound('User not found');

  // Resolve template body if a known template is supplied
  let resolvedBody = input.body;
  let resolvedSubject = input.subject;

  if (TEMPLATES[input.template]) {
    const tpl = TEMPLATES[input.template];
    if (!resolvedSubject) resolvedSubject = tpl.subject;
    // Use the provided body as template data context when it looks like JSON
    try {
      const ctx = JSON.parse(input.body) as Record<string, unknown>;
      resolvedBody = tpl.body(ctx);
    } catch {
      // body is plain text, use as-is
    }
  }

  const notification = await Notification.create({
    userId: input.userId,
    type: input.type,
    template: input.template,
    subject: resolvedSubject,
    body: resolvedBody,
    recipient: input.recipient,
    status: 'pending',
    retryCount: 0,
    maxRetries: 3,
    metadata: input.metadata,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
  });

  // Fire-and-forget: attempt immediate dispatch if not scheduled
  if (!input.scheduledAt) {
    notification.lastAttemptAt = new Date();
    notification.retryCount += 1;

    try {
      await dispatch(notification.type, notification.recipient, notification.subject, notification.body);
      notification.status = 'sent';
      notification.sentAt = new Date();
    } catch (err) {
      notification.status = 'retrying';
      notification.failureReason = (err as Error).message;
      logger.warn(`[Notification] Initial dispatch failed for ${notification._id}, queued for retry`);
    }

    await notification.save();
  }

  return notification;
};

// ─── List Notifications ───────────────────────────────────────────────────────

export const listNotifications = async (
  userId: string,
  query: ListNotificationsQuery
): Promise<IPaginatedResponse<INotificationDocument>> => {
  const { type, status, page, limit, sortOrder } = query;

  const filter: Record<string, unknown> = { userId };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// ─── Get Notification By ID ───────────────────────────────────────────────────

export const getNotificationById = async (
  notificationId: string,
  userId: string
): Promise<INotificationDocument> => {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) throw ApiError.notFound('Notification not found');
  return notification;
};

// ─── Retry Failed Notification ────────────────────────────────────────────────

export const retryNotification = async (
  notificationId: string,
  userId: string
): Promise<INotificationDocument> => {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) throw ApiError.notFound('Notification not found');

  if (notification.status !== 'failed') {
    throw ApiError.badRequest('Only failed notifications can be manually retried');
  }

  notification.status = 'retrying';
  notification.retryCount = 0;
  notification.failureReason = undefined;
  await notification.save();

  // Trigger immediate re-attempt
  await processNotificationQueue();

  return Notification.findById(notificationId) as Promise<INotificationDocument>;
};