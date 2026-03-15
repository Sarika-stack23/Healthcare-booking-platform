import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import User from '../models/User';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }
    const token = authHeader.split(' ')[1];
    if (!token) throw ApiError.unauthorized('Invalid token format');

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId).select('isActive role');
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (!user.isActive) throw ApiError.unauthorized('Account has been deactivated');

    req.user = { userId: payload.userId, email: payload.email, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    if (!token) return next();
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId).select('isActive role');
    if (user && user.isActive) {
      req.user = { userId: payload.userId, email: payload.email, role: payload.role };
    }
    next();
  } catch { next(); }
};
