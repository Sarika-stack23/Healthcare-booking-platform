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
    // FIX: Removed schema-level expireAfterSeconds here because it applied to
    // 'createdAt', conflicting with the explicit TTL index on 'timestamp' below.
    // One TTL index on the correct field (timestamp) is sufficient.
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ timestamp: -1 });

// FIX: Single TTL index on 'timestamp' field only (removed duplicate from schema options)
// Auto-expire audit logs after 1 year
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// ─── Model ────────────────────────────────────────────────────────────────────

const AuditLog: Model<IAuditLogDocument> = mongoose.model<IAuditLogDocument>(
  'AuditLog',
  AuditLogSchema
);

export default AuditLog;