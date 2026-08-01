import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IAppointmentStatus, IAppointmentNote } from '../types';

// ─── Document Interface ──────────────────────────────────────────────────────

export interface IAppointmentDocument extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  durationMinutes: number;
  status: IAppointmentStatus;
  reasonForVisit: string;
  symptoms?: string[];
  notes: IAppointmentNote[];
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  completedAt?: Date;
  consultationFee: number;
  auditLog: {
    action: string;
    performedBy: Types.ObjectId;
    performedAt: Date;
    details?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentNoteSchema = new Schema<IAppointmentNote>(
  {
    content: { type: String, required: true, trim: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const AppointmentAuditSchema = new Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedAt: { type: Date, default: Date.now },
    details: { type: String },
  },
  { _id: false }
);

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor is required'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format'],
    },
    durationMinutes: {
      type: Number,
      default: 30,
      min: 10,
      max: 120,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as IAppointmentStatus[],
      default: 'scheduled',
    },
    reasonForVisit: {
      type: String,
      required: [true, 'Reason for visit is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    symptoms: [{ type: String, trim: true }],
    notes: [AppointmentNoteSchema],
    cancellationReason: { type: String, trim: true },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    completedAt: { type: Date },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    auditLog: [AppointmentAuditSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

AppointmentSchema.index({ patientId: 1, scheduledDate: -1 });
AppointmentSchema.index({ doctorId: 1, scheduledDate: -1 });
AppointmentSchema.index({ doctorId: 1, scheduledDate: 1, scheduledTime: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ createdAt: -1 });
AppointmentSchema.index(
  { doctorId: 1, scheduledDate: 1, scheduledTime: 1 },
  { 
    unique: true,
    name: 'unique_conflict_detection_idx',
    partialFilterExpression: { status: { $in: ['scheduled', 'confirmed'] } }
  }
);

const Appointment: Model<IAppointmentDocument> = mongoose.model<IAppointmentDocument>(
  'Appointment',
  AppointmentSchema
);

export default Appointment;