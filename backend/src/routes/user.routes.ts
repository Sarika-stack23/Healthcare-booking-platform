import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateProfileSchema,
  listDoctorsQuerySchema,
} from '../validators/user.validator';

const router = Router();

// GET /api/users/profile
router.get('/profile', authenticate, UserController.getMyProfile);

// PUT /api/users/profile
router.put('/profile', authenticate, validate(updateProfileSchema), UserController.updateMyProfile);

// GET /api/users/doctors
router.get('/doctors', authenticate, validate(listDoctorsQuerySchema, 'query'), UserController.listDoctors);

// GET /api/users/doctors/:id
router.get('/doctors/:id', authenticate, UserController.getDoctorById);

export default router;
