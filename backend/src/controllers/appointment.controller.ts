import { Request, Response, NextFunction } from 'express';
import * as AppointmentService from '../services/appointment.service';
import { ListAppointmentsQuery } from '../validators/appointment.validator';

// ─── Book Appointment ─────────────────────────────────────────────────────────

export const bookAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const appointment = await AppointmentService.bookAppointment(
      req.user!.userId,
      req.body,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

// ─── List Appointments ────────────────────────────────────────────────────────

export const listAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await AppointmentService.listAppointments(
      req.user!.userId,
      req.user!.role,
      req.query as unknown as ListAppointmentsQuery
    );

    res.status(200).json({
      success: true,
      message: 'Appointments fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Appointment ──────────────────────────────────────────────────────────

export const getAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const appointment = await AppointmentService.getAppointmentById(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Appointment fetched successfully',
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reschedule Appointment ───────────────────────────────────────────────────

export const rescheduleAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const appointment = await AppointmentService.rescheduleAppointment(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.body,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Cancel Appointment ───────────────────────────────────────────────────────

export const cancelAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const appointment = await AppointmentService.cancelAppointment(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.body,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Complete Appointment ─────────────────────────────────────────────────────

export const completeAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const appointment = await AppointmentService.completeAppointment(
      req.params.id,
      req.user!.userId,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Appointment marked as completed',
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};