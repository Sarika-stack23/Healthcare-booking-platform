import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type INotificationType = 'email' | 'sms' | 'push';
export type INotificationStatus = 'pending' | 'sent' | 'failed' | 'retrying';

export interface INotificationDocument extends Document {
  userId: Types.ObjectId;
  type: INotificationType;
  template: string;
  subject?: string;
  body: string;
  recipient: string; // email address or phone number
  status: INotificationStatus;
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'push'] as INotificationType[],
      required: true,
    },
    template: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'retrying'] as INotificationStatus[],
      default: 'pending',
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    lastAttemptAt: { type: Date },
    sentAt: { type: Date },
    failureReason: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    scheduledAt: { type: Date },
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

// Indexes
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ scheduledAt: 1 });
// TTL: auto-delete notifications older than 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification: Model<INotificationDocument> = mongoose.model<INotificationDocument>(
  'Notification',
  NotificationSchema
);

export default Notification;