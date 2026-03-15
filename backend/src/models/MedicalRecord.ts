import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IRecordType, IFileMetadata } from '../types';

// ─── Document Interface ──────────────────────────────────────────────────────

export interface IMedicalRecordDocument extends Document {
  patientId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  title: string;
  description?: string;
  recordType: IRecordType;
  file: IFileMetadata;
  tags?: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── File Metadata Sub-schema ─────────────────────────────────────────────────

const FileMetadataSchema = new Schema<IFileMetadata>(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true },
    storageType: {
      type: String,
      enum: ['local', 's3'],
      required: true,
      default: 'local',
    },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const MedicalRecordSchema = new Schema<IMedicalRecordDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    title: {
      type: String,
      required: [true, 'Record title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    recordType: {
      type: String,
      enum: [
        'lab_report',
        'prescription',
        'imaging',
        'discharge_summary',
        'consultation_note',
        'other',
      ] as IRecordType[],
      required: [true, 'Record type is required'],
      default: 'other',
    },
    file: {
      type: FileMetadataSchema,
      required: [true, 'File metadata is required'],
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // Never expose raw storage key to client
        if (ret.file) {
          delete ret.file.storageKey;
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
MedicalRecordSchema.index({ patientId: 1, recordType: 1 });
MedicalRecordSchema.index({ appointmentId: 1 });
MedicalRecordSchema.index({ isDeleted: 1 });
MedicalRecordSchema.index({ tags: 1 });

// ─── Query Middleware — Auto filter soft-deleted ──────────────────────────────

MedicalRecordSchema.pre(/^find/, function (this: mongoose.Query<unknown, IMedicalRecordDocument>, next) {
  // Only filter if isDeleted is not explicitly set in the query
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// ─── Model ────────────────────────────────────────────────────────────────────

const MedicalRecord: Model<IMedicalRecordDocument> = mongoose.model<IMedicalRecordDocument>(
  'MedicalRecord',
  MedicalRecordSchema
);

export default MedicalRecord;