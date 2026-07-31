import { connectDB } from '../src/config/database';
import app from '../src/app';
import type { Request, Response } from 'express';

// Vercel serverless function entry point
// We need to connect to MongoDB before handling any request.
let isConnected = false;

const handler = async (req: Request, res: Response) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};

export default handler;
