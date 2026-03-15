import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import {
  IWeeklySchedule,
  IDateOverride,
  IBreakTime,
  IDayOfWeek,
} from '../types';

// ─── Document Interface ──────────────────────────────────────────────────────

export interface IAvailabilityDocument extends Document {
  doctorId: Types.ObjectId;
  weeklySchedule: IWeeklySchedule[];
  dateOverrides: IDateOverride[];
  breakTimes: IBreakTime[];
  slotDurationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const TimeSlotSchema = new Schema(
  {
    start: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format'],
    },
    end: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format'],
    },
  },
  { _id: false }
);

const DAYS: IDayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday', 'sunday',
];

const WeeklyScheduleSchema = new Schema<IWeeklySchedule>(
  {
    dayOfWeek: {
      type: String,
      enum: DAYS,
      required: true,
    },
    isAvailable: { type: Boolean, default: false },
    slots: [TimeSlotSchema],
  },
  { _id: false }
);

const DateOverrideSchema = new Schema<IDateOverride>(
  {
    date: { type: Date, required: true },
    isAvailable: { type: Boolean, required: true },
    slots: [TimeSlotSchema],
    reason: { type: String, trim: true },
  },
  { _id: true }
);

const BreakTimeSchema = new Schema<IBreakTime>(
  {
    dayOfWeek: { type: String, enum: DAYS, required: true },
    start: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format'],
    },
    end: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format'],
    },
    isRecurring: { type: Boolean, default: true },
  },
  { _id: true }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const AvailabilitySchema = new Schema<IAvailabilityDocument>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      
    },
    weeklySchedule: {
      type: [WeeklyScheduleSchema],
      default: DAYS.map((day) => ({
        dayOfWeek: day,
        isAvailable: false,
        slots: [],
      })),
    },
    dateOverrides: {
      type: [DateOverrideSchema],
      default: [],
    },
    breakTimes: {
      type: [BreakTimeSchema],
      default: [],
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: [10, 'Slot duration must be at least 10 minutes'],
      max: [120, 'Slot duration cannot exceed 120 minutes'],
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

AvailabilitySchema.index({ doctorId: 1 }, { unique: true });
AvailabilitySchema.index({ 'dateOverrides.date': 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Availability: Model<IAvailabilityDocument> = mongoose.model<IAvailabilityDocument>(
  'Availability',
  AvailabilitySchema
);

export default Availability;