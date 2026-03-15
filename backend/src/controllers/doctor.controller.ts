import { Request, Response, NextFunction } from 'express';
import * as DoctorService from '../services/doctor.service';
import { AvailableSlotsQuery } from '../validators/appointment.validator';

// ─── Get Availability ─────────────────────────────────────────────────────────

export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const availability = await DoctorService.getDoctorAvailability(
      req.params.doctorId
    );

    res.status(200).json({
      success: true,
      message: 'Availability fetched successfully',
      data: { availability },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Set Weekly Schedule ──────────────────────────────────────────────────────

export const setWeeklySchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const availability = await DoctorService.setWeeklySchedule(
      req.params.doctorId,
      req.body,
      req.user!.userId,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Weekly schedule updated successfully',
      data: { availability },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Set Date Override ────────────────────────────────────────────────────────

export const setDateOverride = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const availability = await DoctorService.setDateOverride(
      req.params.doctorId,
      req.body,
      req.user!.userId,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Date override set successfully',
      data: { availability },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Available Slots ──────────────────────────────────────────────────────

export const getAvailableSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query as unknown as AvailableSlotsQuery;

    const result = await DoctorService.getAvailableSlots(
      req.params.doctorId,
      date
    );

    res.status(200).json({
      success: true,
      message: 'Available slots fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Set Break Times ──────────────────────────────────────────────────────────

export const setBreakTimes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const availability = await DoctorService.setBreakTimes(
      req.params.doctorId,
      req.body,
      req.user!.userId,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Break times updated successfully',
      data: { availability },
    });
  } catch (error) {
    next(error);
  }
};