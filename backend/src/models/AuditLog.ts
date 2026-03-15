import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// ─── Document Interface ──────────────────────────────────────────────────────

export interface IAuditLogDocument extends Document {
  userId: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ─── Main Schema ──────────────────────────────────────────────────────────────

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
    },
    resourceId: {
      type: String,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    // No updatedAt needed for audit logs — they are immutable
    timestamps: { createdAt: true, updatedAt: false },
    // TTL: auto-delete logs older than 1 year
    expireAfterSeconds: 365 * 24 * 60 * 60,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ timestamp: -1 });
// TTL index for auto-expiry
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// ─── Model ────────────────────────────────────────────────────────────────────

const AuditLog: Model<IAuditLogDocument> = mongoose.model<IAuditLogDocument>(
  'AuditLog',
  AuditLogSchema
);

export default AuditLog;