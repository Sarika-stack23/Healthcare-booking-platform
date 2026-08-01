import Availability, { IAvailabilityDocument } from '../models/Availability';
import User from '../models/User';
import { ApiError } from '../utils/ApiError';
import { createAuditLog, AuditActions } from '../utils/auditLog';
import {
  WeeklyScheduleInput,
  DateOverrideInput,
  BreakTimeInput,
} from '../validators/appointment.validator';
import { IDayOfWeek, ITimeSlot } from '../types';

// ─── Helper: Day name from Date ───────────────────────────────────────────────

const getDayName = (date: Date): IDayOfWeek => {
  const days: IDayOfWeek[] = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday',
  ];
  return days[date.getDay()];
};

// ─── Helper: Generate time slots ─────────────────────────────────────────────

const generateSlots = (
  slots: ITimeSlot[],
  breaks: { start: string; end: string }[],
  slotDuration: number
): string[] => {
  const result: string[] = [];

  for (const slot of slots) {
    const [startH, startM] = slot.start.split(':').map(Number);
    const [endH, endM] = slot.end.split(':').map(Number);

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + slotDuration <= end) {
      const hh = String(Math.floor(current / 60)).padStart(2, '0');
      const mm = String(current % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      // Check if this slot overlaps with any break
      const isBreak = breaks.some((b) => {
        const [bsh, bsm] = b.start.split(':').map(Number);
        const [beh, bem] = b.end.split(':').map(Number);
        const breakStart = bsh * 60 + bsm;
        const breakEnd = beh * 60 + bem;
        return current >= breakStart && current < breakEnd;
      });

      if (!isBreak) {
        result.push(timeStr);
      }

      current += slotDuration;
    }
  }

  return result;
};

// ─── Get or Create Availability ───────────────────────────────────────────────

const getOrCreateAvailability = async (
  doctorId: string
): Promise<IAvailabilityDocument> => {
  let availability = await Availability.findOne({ doctorId });

  if (!availability) {
    availability = await Availability.create({ doctorId });
  }

  return availability;
};

// ─── Get Availability ─────────────────────────────────────────────────────────

export const getDoctorAvailability = async (
  doctorId: string
): Promise<IAvailabilityDocument> => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  return getOrCreateAvailability(doctorId);
};

// ─── Set Weekly Schedule ──────────────────────────────────────────────────────

export const setWeeklySchedule = async (
  doctorId: string,
  input: WeeklyScheduleInput,
  requesterId: string,
  ipAddress?: string
): Promise<IAvailabilityDocument> => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const availability = await getOrCreateAvailability(doctorId);

  // Merge incoming schedule with existing (only update provided days)
  for (const incoming of input.schedule) {
    const idx = availability.weeklySchedule.findIndex(
      (s) => s.dayOfWeek === incoming.dayOfWeek
    );

    if (idx !== -1) {
      availability.weeklySchedule[idx] = incoming;
    } else {
      availability.weeklySchedule.push(incoming);
    }
  }

  if (input.slotDurationMinutes) {
    availability.slotDurationMinutes = input.slotDurationMinutes;
  }

  await availability.save();

  await createAuditLog({
    userId: requesterId,
    action: AuditActions.AVAILABILITY_SET,
    resource: 'Availability',
    resourceId: doctorId,
    ipAddress,
  });

  return availability;
};

// ─── Set Date Override ────────────────────────────────────────────────────────

export const setDateOverride = async (
  doctorId: string,
  input: DateOverrideInput,
  requesterId: string,
  ipAddress?: string
): Promise<IAvailabilityDocument> => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const availability = await getOrCreateAvailability(doctorId);

  const overrideDate = new Date(input.date);
  overrideDate.setHours(0, 0, 0, 0);

  // Remove existing override for that date if any
  availability.dateOverrides = availability.dateOverrides.filter((o) => {
    const d = new Date(o.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() !== overrideDate.getTime();
  });

  // Add new override
  availability.dateOverrides.push({
    date: overrideDate,
    isAvailable: input.isAvailable,
    slots: input.slots,
    reason: input.reason,
  });

  await availability.save();

  await createAuditLog({
    userId: requesterId,
    action: AuditActions.AVAILABILITY_UPDATE,
    resource: 'Availability',
    resourceId: doctorId,
    details: { date: input.date, isAvailable: input.isAvailable },
    ipAddress,
  });

  return availability;
};

// ─── Set Break Times ──────────────────────────────────────────────────────────

export const setBreakTimes = async (
  doctorId: string,
  input: BreakTimeInput,
  requesterId: string,
  ipAddress?: string
): Promise<IAvailabilityDocument> => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const availability = await getOrCreateAvailability(doctorId);

  // Replace all break times
  availability.breakTimes = input.breaks;

  await availability.save();

  await createAuditLog({
    userId: requesterId,
    action: AuditActions.AVAILABILITY_UPDATE,
    resource: 'Availability',
    resourceId: doctorId,
    details: { breakCount: input.breaks.length },
    ipAddress,
  });

  return availability;
};

// ─── Get Available Slots for a Date ──────────────────────────────────────────

export const getAvailableSlots = async (
  doctorId: string,
  dateStr: string
): Promise<{ date: string; slots: string[]; slotDurationMinutes: number }> => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const availability = await getOrCreateAvailability(doctorId);

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  // Check for a date override first
  const override = availability.dateOverrides.find((o) => {
    const d = new Date(o.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === date.getTime();
  });

  let activeSlots: ITimeSlot[] = [];

  if (override) {
    if (!override.isAvailable) {
      return { date: dateStr, slots: [], slotDurationMinutes: availability.slotDurationMinutes };
    }
    activeSlots = override.slots;
  } else {
    // Use weekly schedule
    const dayName = getDayName(date);
    const daySchedule = availability.weeklySchedule.find(
      (s) => s.dayOfWeek === dayName
    );

    if (!daySchedule || !daySchedule.isAvailable) {
      // Fallback: If doctor has NEVER set a schedule (all days are isAvailable: false), allow standard slots
      const hasConfiguredSchedule = availability.weeklySchedule.some(s => s.isAvailable);
      if (!hasConfiguredSchedule) {
        activeSlots = [{ start: '09:00', end: '17:00' }];
      } else {
        return { date: dateStr, slots: [], slotDurationMinutes: availability.slotDurationMinutes };
      }
    } else {
      activeSlots = daySchedule.slots;
    }
  }

  // Get breaks for that day
  const dayName = getDayName(date);
  const breaks = availability.breakTimes
    .filter((b) => b.dayOfWeek === dayName)
    .map((b) => ({ start: b.start, end: b.end }));

  const allSlots = generateSlots(activeSlots, breaks, availability.slotDurationMinutes);

  // Import here to avoid circular dependencies
  const Appointment = (await import('../models/Appointment')).default;

  // Filter out already-booked slots
  const booked = await Appointment.find({
    doctorId,
    scheduledDate: {
      $gte: date,
      $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
    },
    status: { $in: ['scheduled', 'confirmed'] },
  }).select('scheduledTime');

  const bookedTimes = new Set(booked.map((a) => a.scheduledTime));

  const availableSlots = allSlots.filter((slot) => !bookedTimes.has(slot));

  return {
    date: dateStr,
    slots: availableSlots,
    slotDurationMinutes: availability.slotDurationMinutes,
  };
};