import { Request, Response, NextFunction } from 'express';
import * as NotificationService from '../services/notification.service';
import { ListNotificationsQuery } from '../validators/notification.validator';

// ─── Send Notification ────────────────────────────────────────────────────────

export const sendNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await NotificationService.sendNotification(req.body);

    res.status(201).json({
      success: true,
      message: 'Notification queued successfully',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// ─── List Notifications ───────────────────────────────────────────────────────

export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await NotificationService.listNotifications(
      req.user!.userId,
      req.query as unknown as ListNotificationsQuery
    );

    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Notification ─────────────────────────────────────────────────────────

export const getNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await NotificationService.getNotificationById(
      req.params.id,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: 'Notification fetched successfully',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Retry Failed Notification ────────────────────────────────────────────────

export const retryNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await NotificationService.retryNotification(
      req.params.id,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: 'Notification retry triggered',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Process Queue (admin trigger) ───────────────────────────────────────────

export const processQueue = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await NotificationService.processNotificationQueue();

    res.status(200).json({
      success: true,
      message: 'Notification queue processed',
    });
  } catch (error) {
    next(error);
  }
};