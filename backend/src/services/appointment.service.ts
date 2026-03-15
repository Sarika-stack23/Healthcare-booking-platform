import Appointment, { IAppointmentDocument } from '../models/Appointment';
import User from '../models/User';
import { ApiError } from '../utils/ApiError';
import { createAuditLog, AuditActions } from '../utils/auditLog';
import { getAvailableSlots } from './doctor.service';
import {
  BookAppointmentInput,
  RescheduleAppointmentInput,
  CancelAppointmentInput,
  ListAppointmentsQuery,
} from '../validators/appointment.validator';
import { IPaginatedResponse, IUserRole } from '../types';

// ─── Book Appointment ─────────────────────────────────────────────────────────

export const bookAppointment = async (
  patientId: string,
  input: BookAppointmentInput,
  ipAddress?: string
): Promise<IAppointmentDocument> => {
  // Verify doctor exists
  const doctor = await User.findOne({
    _id: input.doctorId,
    role: 'doctor',
    isActive: true,
  });

  if (!doctor) throw ApiError.notFound('Doctor not found');
  if (!doctor.doctorProfile) throw ApiError.internal('Doctor profile not configured');

  // Prevent patients from booking with themselves (edge case)
  if (patientId === input.doctorId) {
    throw ApiError.badRequest('You cannot book an appointment with yourself');
  }

  // ── Conflict Detection ──────────────────────────────────────────────────────
  const scheduledDate = new Date(input.scheduledDate);
  scheduledDate.setHours(0, 0, 0, 0);

  // Check if doctor has this slot available
  const { slots: availableSlots } = await getAvailableSlots(
    input.doctorId,
    input.scheduledDate
  );

  if (!availableSlots.includes(input.scheduledTime)) {
    throw ApiError.conflict(
      `The slot ${input.scheduledTime} on ${input.scheduledDate} is not available`
    );
  }

  // Double-check for existing appointment at same slot (race condition guard)
  const existing = await Appointment.findOne({
    doctorId: input.doctorId,
    scheduledDate: {
      $gte: scheduledDate,
      $lt: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000),
    },
    scheduledTime: input.scheduledTime,
    status: { $in: ['scheduled', 'confirmed'] },
  });

  if (existing) {
    throw ApiError.conflict(
      'This time slot has just been booked. Please choose another slot.'
    );
  }

  // ── Create Appointment ──────────────────────────────────────────────────────
  const appointment = await Appointment.create({
    patientId,
    doctorId: input.doctorId,
    scheduledDate,
    scheduledTime: input.scheduledTime,
    reasonForVisit: input.reasonForVisit,
    symptoms: input.symptoms || [],
    consultationFee: doctor.doctorProfile.consultationFee,
    status: 'scheduled',
    auditLog: [
      {
        action: 'BOOKED',
        performedBy: patientId,
        performedAt: new Date(),
        details: `Appointment booked by patient`,
      },
    ],
  });

  await createAuditLog({
    userId: patientId,
    action: AuditActions.APPOINTMENT_BOOK,
    resource: 'Appointment',
    resourceId: appointment._id.toString(),
    details: {
      doctorId: input.doctorId,
      date: input.scheduledDate,
      time: input.scheduledTime,
    },
    ipAddress,
  });

  return appointment;
};

// ─── List Appointments ────────────────────────────────────────────────────────

export const listAppointments = async (
  userId: string,
  role: IUserRole,
  query: ListAppointmentsQuery
): Promise<IPaginatedResponse<IAppointmentDocument>> => {
  const { status, startDate, endDate, doctorId, page, limit, sortOrder } = query;

  const filter: Record<string, unknown> = {};

  // Scope appointments to the requesting user
  if (role === 'patient') {
    filter.patientId = userId;
  } else if (role === 'doctor') {
    filter.doctorId = userId;
  }
  // Admin sees all

  if (status) filter.status = status;

  if (doctorId && role !== 'doctor') filter.doctorId = doctorId;

  if (startDate || endDate) {
    filter.scheduledDate = {};
    if (startDate) {
      (filter.scheduledDate as Record<string, Date>).$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      (filter.scheduledDate as Record<string, Date>).$lte = end;
    }
  }

  const skip = (page - 1) * limit;

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName email doctorProfile')
      .sort({ scheduledDate: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: appointments,
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

// ─── Get Appointment By ID ────────────────────────────────────────────────────

export const getAppointmentById = async (
  appointmentId: string,
  userId: string,
  role: IUserRole,
  ipAddress?: string
): Promise<IAppointmentDocument> => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patientId', 'firstName lastName email phone patientProfile')
    .populate('doctorId', 'firstName lastName email doctorProfile');

  if (!appointment) throw ApiError.notFound('Appointment not found');

  // Access control
  const isPatient = appointment.patientId._id.toString() === userId;
  const isDoctor = appointment.doctorId._id.toString() === userId;

  if (role !== 'admin' && !isPatient && !isDoctor) {
    throw ApiError.forbidden('You do not have access to this appointment');
  }

  await createAuditLog({
    userId,
    action: AuditActions.APPOINTMENT_VIEW,
    resource: 'Appointment',
    resourceId: appointmentId,
    ipAddress,
  });

  return appointment;
};

// ─── Reschedule Appointment ───────────────────────────────────────────────────

export const rescheduleAppointment = async (
  appointmentId: string,
  userId: string,
  role: IUserRole,
  input: RescheduleAppointmentInput,
  ipAddress?: string
): Promise<IAppointmentDocument> => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw ApiError.notFound('Appointment not found');

  // Access control — patient or doctor can reschedule
  const isPatient = appointment.patientId.toString() === userId;
  const isDoctor = appointment.doctorId.toString() === userId;

  if (role !== 'admin' && !isPatient && !isDoctor) {
    throw ApiError.forbidden('You cannot reschedule this appointment');
  }

  if (!['scheduled', 'confirmed'].includes(appointment.status)) {
    throw ApiError.badRequest(
      `Cannot reschedule an appointment with status: ${appointment.status}`
    );
  }

  // Validate new slot availability
  const { slots: availableSlots } = await getAvailableSlots(
    appointment.doctorId.toString(),
    input.scheduledDate
  );

  if (!availableSlots.includes(input.scheduledTime)) {
    throw ApiError.conflict(
      `The slot ${input.scheduledTime} on ${input.scheduledDate} is not available`
    );
  }

  // Double-check conflict (exclude current appointment)
  const newDate = new Date(input.scheduledDate);
  newDate.setHours(0, 0, 0, 0);

  const conflict = await Appointment.findOne({
    _id: { $ne: appointmentId },
    doctorId: appointment.doctorId,
    scheduledDate: {
      $gte: newDate,
      $lt: new Date(newDate.getTime() + 24 * 60 * 60 * 1000),
    },
    scheduledTime: input.scheduledTime,
    status: { $in: ['scheduled', 'confirmed'] },
  });

  if (conflict) {
    throw ApiError.conflict('This time slot is already booked');
  }

  const oldDate = appointment.scheduledDate;
  const oldTime = appointment.scheduledTime;

  appointment.scheduledDate = newDate;
  appointment.scheduledTime = input.scheduledTime;
  appointment.auditLog.push({
    action: 'RESCHEDULED',
    performedBy: userId as unknown as import('mongoose').Types.ObjectId,
    performedAt: new Date(),
    details: `From ${oldDate.toISOString().split('T')[0]} ${oldTime} to ${input.scheduledDate} ${input.scheduledTime}`,
  });

  await appointment.save();

  await createAuditLog({
    userId,
    action: AuditActions.APPOINTMENT_RESCHEDULE,
    resource: 'Appointment',
    resourceId: appointmentId,
    details: { from: `${oldDate} ${oldTime}`, to: `${input.scheduledDate} ${input.scheduledTime}` },
    ipAddress,
  });

  return appointment;
};

// ─── Cancel Appointment ───────────────────────────────────────────────────────

export const cancelAppointment = async (
  appointmentId: string,
  userId: string,
  role: IUserRole,
  input: CancelAppointmentInput,
  ipAddress?: string
): Promise<IAppointmentDocument> => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw ApiError.notFound('Appointment not found');

  const isPatient = appointment.patientId.toString() === userId;
  const isDoctor = appointment.doctorId.toString() === userId;

  if (role !== 'admin' && !isPatient && !isDoctor) {
    throw ApiError.forbidden('You cannot cancel this appointment');
  }

  if (['completed', 'cancelled'].includes(appointment.status)) {
    throw ApiError.badRequest(
      `Cannot cancel an appointment with status: ${appointment.status}`
    );
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = input.reason;
  appointment.cancelledBy = userId as unknown as import('mongoose').Types.ObjectId;
  appointment.cancelledAt = new Date();
  appointment.auditLog.push({
    action: 'CANCELLED',
    performedBy: userId as unknown as import('mongoose').Types.ObjectId,
    performedAt: new Date(),
    details: input.reason,
  });

  await appointment.save();

  await createAuditLog({
    userId,
    action: AuditActions.APPOINTMENT_CANCEL,
    resource: 'Appointment',
    resourceId: appointmentId,
    details: { reason: input.reason },
    ipAddress,
  });

  return appointment;
};

// ─── Complete Appointment ─────────────────────────────────────────────────────

export const completeAppointment = async (
  appointmentId: string,
  doctorId: string,
  ipAddress?: string
): Promise<IAppointmentDocument> => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw ApiError.notFound('Appointment not found');

  if (appointment.doctorId.toString() !== doctorId) {
    throw ApiError.forbidden('Only the assigned doctor can complete this appointment');
  }

  if (appointment.status !== 'confirmed' && appointment.status !== 'scheduled') {
    throw ApiError.badRequest(
      `Cannot complete an appointment with status: ${appointment.status}`
    );
  }

  appointment.status = 'completed';
  appointment.completedAt = new Date();
  appointment.auditLog.push({
    action: 'COMPLETED',
    performedBy: doctorId as unknown as import('mongoose').Types.ObjectId,
    performedAt: new Date(),
  });

  await appointment.save();

  await createAuditLog({
    userId: doctorId,
    action: AuditActions.APPOINTMENT_COMPLETE,
    resource: 'Appointment',
    resourceId: appointmentId,
    ipAddress,
  });

  return appointment;
};