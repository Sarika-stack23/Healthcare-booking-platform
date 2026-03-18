import User, { IUserDocument } from '../models/User';
import Appointment from '../models/Appointment';
import AuditLog, { IAuditLogDocument } from '../models/AuditLog';
import { ApiError } from '../utils/ApiError';
import { IPaginatedResponse, IUserRole } from '../types';

// ─── Admin: List All Users ────────────────────────────────────────────────────

export interface AdminListUsersQuery {
  role?: IUserRole;
  isActive?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
}

export const adminListUsers = async (
  query: AdminListUsersQuery
): Promise<IPaginatedResponse<IUserDocument>> => {
  const { role, isActive, search, page, limit, sortOrder } = query;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: users as unknown as IUserDocument[],
    pagination: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
};

// ─── Admin: Toggle User Active State ─────────────────────────────────────────

export const adminToggleUser = async (
  userId: string,
  isActive: boolean
): Promise<IUserDocument> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

// ─── Admin: Appointment Analytics ────────────────────────────────────────────

export interface AppointmentAnalyticsQuery {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
}

export const adminAppointmentAnalytics = async (
  query: AppointmentAnalyticsQuery
) => {
  const dateFilter: Record<string, unknown> = {};
  if (query.startDate || query.endDate) {
    dateFilter.scheduledDate = {};
    if (query.startDate) {
      (dateFilter.scheduledDate as Record<string, Date>).$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      (dateFilter.scheduledDate as Record<string, Date>).$lte = end;
    }
  }
  if (query.doctorId) dateFilter.doctorId = query.doctorId;

  // Status breakdown
  const statusBreakdown = await Appointment.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // By doctor (top 10)
  const byDoctor = await Appointment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$doctorId',
        totalAppointments: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$consultationFee', 0],
          },
        },
      },
    },
    { $sort: { totalAppointments: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'doctor',
      },
    },
    { $unwind: '$doctor' },
    {
      $project: {
        doctorId: '$_id',
        doctorName: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] },
        totalAppointments: 1,
        completed: 1,
        cancelled: 1,
        totalRevenue: 1,
      },
    },
  ]);

  // Daily volume (last 30 days or filtered range)
  const dailyVolume = await Appointment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$scheduledDate' },
        },
        count: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$consultationFee', 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalRevenue = await Appointment.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$consultationFee' } } },
  ]);

  const totalCount = await Appointment.countDocuments(dateFilter);

  return {
    summary: {
      total: totalCount,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: statusBreakdown.map((s) => ({ status: s._id, count: s.count })),
    },
    byDoctor,
    dailyVolume,
  };
};

// ─── Admin: Audit Logs ────────────────────────────────────────────────────────

export interface AdminAuditLogsQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export const adminGetAuditLogs = async (
  query: AdminAuditLogsQuery
): Promise<IPaginatedResponse<IAuditLogDocument>> => {
  const { userId, action, resource, startDate, endDate, page, limit } = query;

  const filter: Record<string, unknown> = {};
  if (userId) filter.userId = userId;
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (resource) filter.resource = resource;
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) (filter.timestamp as Record<string, Date>).$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      (filter.timestamp as Record<string, Date>).$lte = end;
    }
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: logs,
    pagination: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
};