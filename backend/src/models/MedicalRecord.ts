import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IRecordType, IFileMetadata } from '../types';

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
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        // Hide storageKey from client — never expose raw file path
        if (ret['file'] && typeof ret['file'] === 'object') {
          (ret['file'] as Record<string, unknown>)['storageKey'] = undefined;
        }
        ret['__v'] = undefined;
        return ret;
      },
    },
  }
);

MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
MedicalRecordSchema.index({ patientId: 1, recordType: 1 });
MedicalRecordSchema.index({ appointmentId: 1 });
MedicalRecordSchema.index({ isDeleted: 1 });
MedicalRecordSchema.index({ tags: 1 });

// FIX: Replaced fragile regex /^find/ hook with explicit named hooks for type safety.
// The regex approach can silently match unexpected query methods and loses TypeScript
// type inference on 'this'. Explicit hooks are predictable and correctly typed.
type MedicalRecordQuery = mongoose.Query<unknown, IMedicalRecordDocument>;

function excludeDeleted(this: MedicalRecordQuery): void {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
}

MedicalRecordSchema.pre('find', excludeDeleted);
MedicalRecordSchema.pre('findOne', excludeDeleted);
MedicalRecordSchema.pre('findOneAndUpdate', excludeDeleted);
MedicalRecordSchema.pre('countDocuments', excludeDeleted);

const MedicalRecord: Model<IMedicalRecordDocument> = mongoose.model<IMedicalRecordDocument>(
  'MedicalRecord',
  MedicalRecordSchema
);

export default MedicalRecord;