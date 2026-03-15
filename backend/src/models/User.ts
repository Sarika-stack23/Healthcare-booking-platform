import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  IUser,
  IUserRole,
  IPatientProfile,
  IDoctorProfile,
} from '../types';

// ─── Document Interface ─────────────────────────────────────────────────────

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName: string;
}

// ─── Sub-schemas ────────────────────────────────────────────────────────────

const PatientProfileSchema = new Schema<IPatientProfile>(
  {
    dateOfBirth: { type: Date },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: [{ type: String, trim: true }],
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
  },
  { _id: false }
);

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    specialization: { type: String, required: true, trim: true },
    qualifications: [{ type: String, trim: true }],
    consultationFee: { type: Number, required: true, min: 0 },
    experienceYears: { type: Number, min: 0 },
    bio: { type: String, trim: true, maxlength: 1000 },
    licenseNumber: { type: String, trim: true },
  },
  { _id: false }
);

// ─── Main Schema ─────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUserDocument>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'] as IUserRole[],
      required: [true, 'Role is required'],
      default: 'patient',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-()]{7,15}$/, 'Please provide a valid phone number'],
    },
    profilePicture: { type: String },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    patientProfile: {
      type: PatientProfileSchema,
      default: undefined,
    },
    doctorProfile: {
      type: DoctorProfileSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'doctorProfile.specialization': 1 });
UserSchema.index({ createdAt: -1 });

// ─── Virtuals ────────────────────────────────────────────────────────────────

UserSchema.virtual('fullName').get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Pre-save Hook ────────────────────────────────────────────────────────────

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ─── Methods ─────────────────────────────────────────────────────────────────

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Model ───────────────────────────────────────────────────────────────────

const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', UserSchema);

export default User;