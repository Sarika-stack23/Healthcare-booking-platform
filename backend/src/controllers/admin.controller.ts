import { Request, Response, NextFunction } from 'express';
import * as AdminService from '../services/admin.service';

// ─── List All Users ───────────────────────────────────────────────────────────

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = {
      role: req.query.role as AdminService.AdminListUsersQuery['role'],
      isActive: req.query.isActive !== undefined
        ? req.query.isActive === 'true'
        : undefined,
      search: req.query.search as string | undefined,
      page: Math.max(1, parseInt(req.query.page as string) || 1),
      limit: Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20)),
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await AdminService.adminListUsers(query);

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Toggle User Active State ─────────────────────────────────────────────────

export const toggleUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { isActive } = req.body as { isActive: boolean };
    const user = await AdminService.adminToggleUser(req.params.id, isActive);

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Appointment Analytics ────────────────────────────────────────────────────

export const appointmentAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      doctorId: req.query.doctorId as string | undefined,
    };

    const analytics = await AdminService.adminAppointmentAnalytics(query);

    res.status(200).json({
      success: true,
      message: 'Appointment analytics fetched successfully',
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = {
      userId: req.query.userId as string | undefined,
      action: req.query.action as string | undefined,
      resource: req.query.resource as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      page: Math.max(1, parseInt(req.query.page as string) || 1),
      limit: Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)),
    };

    const result = await AdminService.adminGetAuditLogs(query);

    res.status(200).json({
      success: true,
      message: 'Audit logs fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};