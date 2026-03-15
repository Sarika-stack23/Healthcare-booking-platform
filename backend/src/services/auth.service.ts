import crypto from 'crypto';
import User, { IUserDocument } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { createAuditLog, AuditActions } from '../utils/auditLog';
import { env } from '../config/env';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { logger } from '../utils/logger';

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUser = async (
  input: RegisterInput,
  ipAddress?: string
): Promise<{ user: IUserDocument; accessToken: string; refreshToken: string }> => {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const userData: Record<string, unknown> = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
    role: input.role,
    phone: input.phone,
  };

  if (input.role === 'doctor') {
    userData.doctorProfile = {
      specialization: input.specialization,
      consultationFee: input.consultationFee,
      qualifications: input.qualifications || [],
      experienceYears: input.experienceYears,
      licenseNumber: input.licenseNumber,
    };
  } else {
    userData.patientProfile = {};
  }

  const user = await User.create(userData);

  const tokens = generateTokenPair(
    { userId: user._id.toString(), email: user.email, role: user.role },
    user.tokenVersion
  );

  await createAuditLog({
    userId: user._id.toString(),
    action: AuditActions.REGISTER,
    resource: 'User',
    resourceId: user._id.toString(),
    ipAddress,
  });

  logger.info(`New user registered: ${user.email} (${user.role})`);

  return { user, ...tokens };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUser = async (
  input: LoginInput,
  ipAddress?: string
): Promise<{ user: IUserDocument; accessToken: string; refreshToken: string }> => {
  // Explicitly select password for comparison
  const user = await User.findOne({ email: input.email }).select(
    '+password +tokenVersion'
  );

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Your account has been deactivated. Please contact support.');
  }

  const isPasswordValid = await user.comparePassword(input.password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokens = generateTokenPair(
    { userId: user._id.toString(), email: user.email, role: user.role },
    user.tokenVersion
  );

  await createAuditLog({
    userId: user._id.toString(),
    action: AuditActions.LOGIN,
    resource: 'User',
    resourceId: user._id.toString(),
    ipAddress,
  });

  logger.info(`User logged in: ${user.email}`);

  return { user, ...tokens };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshAccessToken = async (
  refreshToken: string,
  ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.userId).select('+tokenVersion');

  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Account has been deactivated');
  }

  // Token rotation — invalidate old token version
  if (user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Refresh token has been revoked. Please log in again.');
  }

  // Rotate token version for security
  user.tokenVersion += 1;
  await user.save();

  const tokens = generateTokenPair(
    { userId: user._id.toString(), email: user.email, role: user.role },
    user.tokenVersion
  );

  await createAuditLog({
    userId: user._id.toString(),
    action: AuditActions.TOKEN_REFRESH,
    resource: 'User',
    resourceId: user._id.toString(),
    ipAddress,
  });

  return tokens;
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutUser = async (
  userId: string,
  ipAddress?: string
): Promise<void> => {
  // Increment tokenVersion to invalidate all existing refresh tokens
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });

  await createAuditLog({
    userId,
    action: AuditActions.LOGOUT,
    resource: 'User',
    resourceId: userId,
    ipAddress,
  });

  logger.info(`User logged out: ${userId}`);
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (
  email: string,
  ipAddress?: string
): Promise<string> => {
  const user = await User.findOne({ email });

  // Always respond with success to prevent email enumeration
  if (!user) {
    logger.warn(`Password reset requested for non-existent email: ${email}`);
    return 'If this email exists, a reset link has been sent.';
  }

  // Generate a secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + env.resetToken.expiresIn);
  await user.save({ validateBeforeSave: false });

  await createAuditLog({
    userId: user._id.toString(),
    action: AuditActions.PASSWORD_RESET_REQUEST,
    resource: 'User',
    resourceId: user._id.toString(),
    ipAddress,
  });

  // In production this would send an email
  // For now, return the raw token (demo purposes only)
  logger.info(`Password reset token generated for: ${email}`);

  // Return reset token — in production send via email instead
  return resetToken;
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (
  token: string,
  newPassword: string,
  ipAddress?: string
): Promise<void> => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw ApiError.badRequest('Reset token is invalid or has expired');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Invalidate all existing sessions
  user.tokenVersion += 1;

  await user.save();

  await createAuditLog({
    userId: user._id.toString(),
    action: AuditActions.PASSWORD_RESET,
    resource: 'User',
    resourceId: user._id.toString(),
    ipAddress,
  });

  logger.info(`Password reset successful for user: ${user.email}`);
};