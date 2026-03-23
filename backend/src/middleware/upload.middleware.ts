import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

// ─── Allowed MIME Types ───────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.txt'];

// ─── Storage Configuration ────────────────────────────────────────────────────

const localStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const uploadDir = env.upload.uploadPath;

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = `${uniqueId}${ext}`;
    cb(null, sanitizedName);
  },
});

// ─── File Filter ──────────────────────────────────────────────────────────────

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new ApiError(400, `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new ApiError(400, `File extension not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }

  cb(null, true);
};

// ─── Multer Instance ──────────────────────────────────────────────────────────

export const upload = multer({
  storage: localStorage,
  limits: {
    fileSize: env.upload.maxFileSize,
    files: 1,
  },
  fileFilter,
});

// ─── Single File Upload ───────────────────────────────────────────────────────

export const uploadSingle = upload.single('file');

// ─── Helper: Get Storage Key ──────────────────────────────────────────────────

export const getStorageKey = (filename: string): string => {
  return `${env.upload.uploadPath}${filename}`;
};

// ─── Helper: Delete Local File ────────────────────────────────────────────────

export const deleteLocalFile = (storageKey: string): void => {
  try {
    if (fs.existsSync(storageKey)) {
      fs.unlinkSync(storageKey);
    }
  } catch (error) {
    // FIX: Added actual logger.warn call — the previous comment said "log but don't throw"
    // but there was no logging statement, meaning silent failures went completely unnoticed.
    // We still don't throw so file deletion failure won't crash the main request flow.
    logger.warn('Failed to delete local file', {
      storageKey,
      error: (error as Error).message,
    });
  }
};

// ─── Helper: Generate Temp Signed URL (Local) ────────────────────────────────

export const generateLocalSignedUrl = (
  req: Request,
  storageKey: string,
  expiresInSeconds = 3600
): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const expiry = Date.now() + expiresInSeconds * 1000;
  // Simple expiry-based URL (not cryptographically signed — use S3 in production)
  return `${baseUrl}/api/records/file/${path.basename(storageKey)}?expires=${expiry}`;
};