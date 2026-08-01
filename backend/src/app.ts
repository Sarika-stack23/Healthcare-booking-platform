import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

import { env } from './config/env';
import { connectDB } from './config/database';
import { logger, logRequest } from './utils/logger';
import { globalRateLimit } from './middleware/rateLimit.middleware';
import {
  notFoundHandler,
  globalErrorHandler,
} from './middleware/errorHandler.middleware';

// ─── Route Imports ─────────────────────────────────────────────────────────────

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import doctorRoutes from './routes/doctor.routes';
import appointmentRoutes from './routes/appointment.routes';
import recordRoutes from './routes/record.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';



// ─── App Init ─────────────────────────────────────────────────────────────────

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, etc.)
      if (!origin) return callback(null, true);

      // In development, always allow localhost on any port
      if (env.isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Allow all origins if ALLOWED_ORIGINS includes '*'
      if (env.cors.allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Check if the origin is in the allowed list (ignoring trailing slashes)
      const isAllowed = env.cors.allowedOrigins.some(
        (allowed) => allowed === origin || allowed === `${origin}/` || origin === `${allowed}/`
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        // Instead of throwing a generic Error which causes a 500, we log it and reject
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request ID + Timing ──────────────────────────────────────────────────────

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.startTime = Date.now();
  next();
});

// ─── HTTP Request Logging ──────────────────────────────────────────────────────

app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
    skip: (req: Request) =>
      req.path === '/health' || req.path === '/ready',
  })
);

// Response time logger
app.use((req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    const responseTime = Date.now() - (req.startTime || Date.now());
    logRequest(req.method, req.originalUrl, res.statusCode, responseTime, req.requestId || '');
  });
  next();
});

// ─── Global Rate Limiting ──────────────────────────────────────────────────────

app.use(globalRateLimit);

// ─── Health Check Endpoints ───────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv,
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    const mongoose = await import('mongoose');
    const dbState = mongoose.default.connection.readyState;

    const isReady = dbState === 1; // 1 = connected

    res.status(isReady ? 200 : 503).json({
      success: isReady,
      status: isReady ? 'ready' : 'not ready',
      checks: {
        database: dbState === 1 ? 'connected' : 'disconnected',
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      success: false,
      status: 'not ready',
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────

const API_PREFIX = '/api';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/doctors`, doctorRoutes);
app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
app.use(`${API_PREFIX}/records`, recordRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get(`${API_PREFIX}/docs.json`, (_req, res) => res.send(swaggerSpec));

// ─── API Info ─────────────────────────────────────────────────────────────────

app.get(`${API_PREFIX}`, (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'MedAILockr Healthcare API',
    version: '1.0.0',
    documentation: `${API_PREFIX}/docs`,
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
      doctors: `${API_PREFIX}/doctors`,
      appointments: `${API_PREFIX}/appointments`,
      records: `${API_PREFIX}/records`,
      notifications: `${API_PREFIX}/notifications`,
      admin: `${API_PREFIX}/admin`,
    },
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Server Bootstrap ─────────────────────────────────────────────────────────

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      logger.info(`🚀 MedAILockr API running on port ${env.port}`);
      logger.info(`📋 Environment: ${env.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${env.port}/health`);
      logger.info(`📚 API base: http://localhost:${env.port}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        const { disconnectDB } = await import('./config/database');
        await disconnectDB();

        logger.info('Process terminated');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection:', reason);
      void shutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      void shutdown('uncaughtException');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server locally or in non-serverless environments.
// Vercel serverless functions will import the app and handle routing directly.
if (process.env.NODE_ENV !== 'production' || process.env.START_SERVER === 'true') {
  void startServer();
}

export default app;