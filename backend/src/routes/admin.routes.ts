import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/users — list all users with filters
router.get('/users', AdminController.listUsers);

// PATCH /api/admin/users/:id/toggle — activate / deactivate user
router.patch('/users/:id/toggle', AdminController.toggleUser);

// GET /api/admin/analytics/appointments — stats by status, doctor, date range
router.get('/analytics/appointments', AdminController.appointmentAnalytics);

// GET /api/admin/audit-logs — paginated access logs for sensitive operations
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;