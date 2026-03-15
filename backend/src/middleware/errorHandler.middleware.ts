import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ─── Not Found Handler ────────────────────────────────────────────────────────

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// ─── Global Error Handler ─────────────────────────────────────────────────────

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let error = err;

  // ── Mongoose Validation Error ───────────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new ApiError(422, 'Validation failed', errors);
  }

  // ── Mongoose Duplicate Key Error ────────────────────────────────────────────
  if ((err as NodeJS.ErrnoException).name === 'MongoServerError' &&
    (err as { code?: number }).code === 11000) {
    const field = Object.keys(
      (err as { keyValue?: Record<string, unknown> }).keyValue || {}
    )[0];
    error = ApiError.conflict(
      `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Value'} already exists`
    );
  }

  // ── Mongoose Cast Error (invalid ObjectId) ──────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // ── JWT Errors ──────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token has expired');
  }

  // ── Multer Errors ───────────────────────────────────────────────────────────
  if (err.name === 'MulterError') {
    const multerErr = err as { code?: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      error = ApiError.badRequest('File size exceeds the 10MB limit');
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      error = ApiError.badRequest('Unexpected file field. Use "file" as the field name');
    } else {
      error = ApiError.badRequest('File upload error');
    }
  }

  // ── Final Error Response ────────────────────────────────────────────────────
  const apiError = error instanceof ApiError ? error : ApiError.internal();
  const statusCode = apiError.statusCode || 500;

  // Log the error
  if (statusCode >= 500) {
    logger.error('Server Error', {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      requestId: req.requestId,
      userId: req.user?.userId,
    });
  } else {
    logger.warn('Client Error', {
      message: apiError.message,
      statusCode,
      method: req.method,
      url: req.originalUrl,
      requestId: req.requestId,
      userId: req.user?.userId,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.errors && { errors: apiError.errors }),
    ...(env.isDev && statusCode >= 500 && { stack: err.stack }),
  });
};