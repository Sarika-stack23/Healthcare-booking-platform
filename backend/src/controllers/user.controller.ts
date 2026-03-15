import { Request, Response, NextFunction } from 'express';
import * as UserService from '../services/user.service';

export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await UserService.getUserProfile(req.user!.userId, req.user!.userId, req.ip);
    res.status(200).json({ success: true, message: 'Profile fetched successfully', data: { user } });
  } catch (error) { next(error); }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await UserService.updateUserProfile(req.user!.userId, req.body, req.ip);
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: { user: updated } });
  } catch (error) { next(error); }
};

export const listDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await UserService.listDoctors(req.query as any);
    res.status(200).json({ success: true, message: 'Doctors fetched successfully', data: result.data, pagination: result.pagination });
  } catch (error) { next(error); }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctor = await UserService.getDoctorById(req.params.id);
    res.status(200).json({ success: true, message: 'Doctor fetched successfully', data: { doctor } });
  } catch (error) { next(error); }
};
