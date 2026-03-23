import { Router } from 'express';
import * as RecordController from '../controllers/record.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { uploadRateLimit } from '../middleware/rateLimit.middleware';
import {
  uploadRecordSchema,
  listRecordsQuerySchema,
} from '../validators/record.validator';

const router = Router();

// FIX: File serving route moved BEFORE router.use(authenticate) so it does not
// require a Bearer token. Access is controlled by the URL expiry timestamp instead.
// Previously the route was defined after authenticate middleware was applied to all
// routes, meaning the comment "no auth" was misleading — auth was still running.
router.get(
  '/file/:filename',
  RecordController.serveFile
);

// All remaining record routes require authentication
router.use(authenticate);

// ─── Records CRUD ─────────────────────────────────────────────────────────────

// POST /api/records/upload
router.post(
  '/upload',
  uploadRateLimit,
  uploadSingle,
  validate(uploadRecordSchema),
  RecordController.uploadRecord
);

// GET /api/records
router.get(
  '/',
  validate(listRecordsQuerySchema, 'query'),
  RecordController.listRecords
);

// GET /api/records/:id
router.get(
  '/:id',
  RecordController.getRecord
);

// GET /api/records/:id/download
router.get(
  '/:id/download',
  RecordController.downloadRecord
);

// DELETE /api/records/:id
router.delete(
  '/:id',
  RecordController.deleteRecord
);

export default router;