import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, accessToken, refreshToken } = await AuthService.registerUser(
      req.body,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, accessToken, refreshToken } = await AuthService.loginUser(
      req.body,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };

    const tokens = await AuthService.refreshAccessToken(refreshToken, req.ip);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await AuthService.logoutUser(req.user!.userId, req.ip);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body as { email: string };

    const resetToken = await AuthService.forgotPassword(email, req.ip);

    // In production: send email with reset link, don't return token
    // Returning token here for demo/testing purposes only
    res.status(200).json({
      success: true,
      message: 'If this email exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body as { password: string };

    await AuthService.resetPassword(token, password, req.ip);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};