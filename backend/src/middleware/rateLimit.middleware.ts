import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';

// ─── Helper: Standard Rate Limit Response ─────────────────────────────────────

const rateLimitHandler = (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    retryAfter: Math.ceil(env.rateLimit.windowMs / 1000 / 60), // minutes
  });
};

// ─── Global Rate Limiter ──────────────────────────────────────────────────────

export const globalRateLimit = rateLimit({
  windowMs: env.rateLimit.windowMs,       // 15 minutes
  max: env.rateLimit.max,                 // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req: Request) => req.path === '/health' || req.path === '/ready',
});

// ─── Auth Rate Limiter (Stricter) ─────────────────────────────────────────────

export const authRateLimit = rateLimit({
  windowMs: env.rateLimit.windowMs,       // 15 minutes
  max: env.rateLimit.authMax,             // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    });
  },
  keyGenerator: (req: Request): string => {
    // Rate limit by IP + email combo if available
    const email = (req.body as { email?: string })?.email || '';
    return `${req.ip}_${email}`;
  },
});

// ─── Upload Rate Limiter ──────────────────────────────────────────────────────

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,              // 1 hour
  max: 20,                               // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      message: 'Upload limit reached. You can upload up to 20 files per hour.',
    });
  },
});

// ─── Password Reset Rate Limiter ──────────────────────────────────────────────

export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,             // 1 hour
  max: 3,                               // 3 reset attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again in 1 hour.',
    });
  },
});