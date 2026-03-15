import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as RecordService from '../services/record.service';
import { ApiError } from '../utils/ApiError';
import { ListRecordsQuery } from '../validators/record.validator';

// ─── Upload Record ────────────────────────────────────────────────────────────

export const uploadRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded. Please attach a file.');
    }

    const record = await RecordService.uploadRecord(
      req.user!.userId,
      req.user!.role,
      req.file,
      req.body,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Medical record uploaded successfully',
      data: { record },
    });
  } catch (error) {
    next(error);
  }
};

// ─── List Records ─────────────────────────────────────────────────────────────

export const listRecords = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await RecordService.listRecords(
      req.user!.userId,
      req.user!.role,
      req.query as unknown as ListRecordsQuery
    );

    res.status(200).json({
      success: true,
      message: 'Medical records fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Record ───────────────────────────────────────────────────────────────

export const getRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const record = await RecordService.getRecordById(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Medical record fetched successfully',
      data: { record },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Download Record ──────────────────────────────────────────────────────────

export const downloadRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url, expiresIn, fileName } = await RecordService.generateDownloadUrl(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Download URL generated successfully',
      data: {
        url,
        fileName,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Serve File (Local Storage) ───────────────────────────────────────────────

export const serveFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { filename } = req.params;
    const { expires } = req.query as { expires: string };

    const filePath = await RecordService.getLocalFilePath(filename, expires);

    if (!fs.existsSync(filePath)) {
      throw ApiError.notFound('File not found');
    }

    // Get file extension and set content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// ─── Delete Record ────────────────────────────────────────────────────────────

export const deleteRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hardDelete = req.query.hard === 'true' && req.user!.role === 'admin';

    await RecordService.deleteRecord(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      hardDelete,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: `Medical record ${hardDelete ? 'permanently deleted' : 'deleted'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};