import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { IUserRole } from '../types';

export interface JwtPayload {
  userId: string;
  email: string;
  role: IUserRole;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as SignOptions);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
};

export const generateTokenPair = (
  userPayload: JwtPayload,
  tokenVersion: number
): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken({
    userId: userPayload.userId,
    tokenVersion,
  });
  return { accessToken, refreshToken };
};