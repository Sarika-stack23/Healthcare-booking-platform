import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  mongodb: {
    uri: process.env.MONGODB_URL || process.env.MONGODB_URI || (() => { throw new Error('Missing MONGODB_URI or MONGODB_URL') })(),
  },

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  resetToken: {
    expiresIn: parseInt(process.env.RESET_TOKEN_EXPIRES_IN || '3600000', 10),
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  },
};