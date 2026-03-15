import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authRateLimit, passwordResetRateLimit } from '../middleware/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimit, validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);
router.post('/forgot-password', passwordResetRateLimit, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password/:token', passwordResetRateLimit, validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/logout', authenticate, AuthController.logout);

export default router;
