import { Types } from 'mongoose';
import path from 'path';
import { Request } from 'express';
import MedicalRecord, { IMedicalRecordDocument } from '../models/MedicalRecord';
import { ApiError } from '../utils/ApiError';
import { createAuditLog, AuditActions } from '../utils/auditLog';
import { deleteLocalFile, generateLocalSignedUrl } from '../middleware/upload.middleware';
import { UploadRecordInput, ListRecordsQuery } from '../validators/record.validator';
import { IPaginatedResponse, IUserRole } from '../types';

// ─── Upload Record ────────────────────────────────────────────────────────────

export const uploadRecord = async (
  uploaderId: string,
  role: IUserRole,
  file: Express.Multer.File,
  input: UploadRecordInput,
  ipAddress?: string
): Promise<IMedicalRecordDocument> => {
  let patientId: string;

  if (role === 'patient') {
    patientId = uploaderId;
  } else if (role === 'doctor' || role === 'admin') {
    if (!input.patientId) {
      throw ApiError.badRequest('patientId is required when a doctor or admin uploads a record');
    }
    patientId = input.patientId;
  } else {
    throw ApiError.forbidden('You do not have permission to upload records');
  }

  const storageKey = `${file.destination}${file.filename}`;

  const record = await MedicalRecord.create({
    patientId,
    uploadedBy: uploaderId,
    appointmentId: input.appointmentId,
    title: input.title,
    description: input.description,
    recordType: input.recordType,
    file: {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey,
      storageType: 'local',
    },
    tags: input.tags || [],
  });

  await createAuditLog({
    userId: uploaderId,
    action: AuditActions.RECORD_UPLOAD,
    resource: 'MedicalRecord',
    resourceId: record._id.toString(),
    details: {
      fileName: file.originalname,
      fileSize: file.size,
      recordType: input.recordType,
      patientId,
    },
    ipAddress,
  });

  return record;
};

// ─── List Records ─────────────────────────────────────────────────────────────

export const listRecords = async (
  userId: string,
  role: IUserRole,
  query: ListRecordsQuery
): Promise<IPaginatedResponse<IMedicalRecordDocument>> => {
  const { recordType, patientId, appointmentId, startDate, endDate, tags, page, limit, sortOrder } = query;

  const filter: Record<string, unknown> = {};

  if (role === 'patient') {
    filter.patientId = userId;
  } else if (role === 'doctor') {
    if (patientId) filter.patientId = patientId;
  } else if (role === 'admin') {
    if (patientId) filter.patientId = patientId;
  }

  if (recordType) filter.recordType = recordType;
  if (appointmentId) filter.appointmentId = appointmentId;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      (filter.createdAt as Record<string, Date>).$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      (filter.createdAt as Record<string, Date>).$lte = end;
    }
  }

  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    MedicalRecord.find(filter)
      .populate('patientId', 'firstName lastName email')
      .populate('uploadedBy', 'firstName lastName role')
      .populate('appointmentId', 'scheduledDate scheduledTime')
      .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit),
    MedicalRecord.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: records,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// ─── Get Record By ID ─────────────────────────────────────────────────────────

export const getRecordById = async (
  recordId: string,
  userId: string,
  role: IUserRole,
  ipAddress?: string
): Promise<IMedicalRecordDocument> => {
  const record = await MedicalRecord.findById(recordId)
    .populate('patientId', 'firstName lastName email')
    .populate('uploadedBy', 'firstName lastName role');

  if (!record) throw ApiError.notFound('Medical record not found');

  const isPatient = record.patientId._id.toString() === userId;
  const isUploader = record.uploadedBy._id.toString() === userId;

  if (role !== 'admin' && !isPatient && !isUploader && role !== 'doctor') {
    throw ApiError.forbidden('You do not have access to this record');
  }

  await createAuditLog({
    userId,
    action: AuditActions.RECORD_VIEW,
    resource: 'MedicalRecord',
    resourceId: recordId,
    ipAddress,
  });

  return record;
};

// ─── Generate Download URL ────────────────────────────────────────────────────

export const generateDownloadUrl = async (
  recordId: string,
  userId: string,
  role: IUserRole,
  req: Request,
  ipAddress?: string
): Promise<{ url: string; expiresIn: number; fileName: string }> => {
  const record = await MedicalRecord.findById(recordId);
  if (!record) throw ApiError.notFound('Medical record not found');

  const isPatient = record.patientId.toString() === userId;
  const isUploader = record.uploadedBy.toString() === userId;

  if (role !== 'admin' && !isPatient && !isUploader && role !== 'doctor') {
    throw ApiError.forbidden('You do not have permission to download this file');
  }

  const expiresIn = 3600;

  const url = generateLocalSignedUrl(req, record.file.storageKey, expiresIn);

  await createAuditLog({
    userId,
    action: AuditActions.RECORD_DOWNLOAD,
    resource: 'MedicalRecord',
    resourceId: recordId,
    details: { fileName: record.file.originalName },
    ipAddress,
  });

  return {
    url,
    expiresIn,
    fileName: record.file.originalName,
  };
};

// ─── Delete Record ────────────────────────────────────────────────────────────

export const deleteRecord = async (
  recordId: string,
  userId: string,
  role: IUserRole,
  hardDelete = false,
  ipAddress?: string
): Promise<void> => {
  const record = await MedicalRecord.findById(recordId);
  if (!record) throw ApiError.notFound('Medical record not found');

  const isUploader = record.uploadedBy.toString() === userId;

  if (role !== 'admin' && !isUploader) {
    throw ApiError.forbidden('You do not have permission to delete this record');
  }

  if (hardDelete && role === 'admin') {
    deleteLocalFile(record.file.storageKey);
    await MedicalRecord.findByIdAndDelete(recordId);
  } else {
    record.isDeleted = true;
    record.deletedAt = new Date();
    record.deletedBy = new Types.ObjectId(userId);
    await record.save();
  }

  await createAuditLog({
    userId,
    action: AuditActions.RECORD_DELETE,
    resource: 'MedicalRecord',
    resourceId: recordId,
    details: {
      deleteType: hardDelete ? 'hard' : 'soft',
      fileName: record.file.originalName,
    },
    ipAddress,
  });
};

// ─── Serve Local File ─────────────────────────────────────────────────────────

export const getLocalFilePath = async (
  filename: string,
  expiresParam: string
): Promise<string> => {
  const expires = parseInt(expiresParam, 10);
  if (isNaN(expires) || Date.now() > expires) {
    throw ApiError.unauthorized('Download link has expired');
  }

  const sanitized = path.basename(filename);
  const filePath = path.join(process.cwd(), 'uploads', sanitized);

  return filePath;
};