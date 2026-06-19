import express from 'express';
import path from 'path';
import { createCorsMiddleware } from './middleware/cors.js';
import { apiRateLimiter, uploadRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import uploadRouter from './routes/upload.js';
import healthRouter from './routes/health.js';

export function createApp(): express.Express {
  const app = express();

  // ── Core middleware ─────────────────────────────
  app.use(createCorsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── Rate limiting ──────────────────────────────
  // Apply upload rate limiter specifically to upload routes
  app.use('/api/upload', uploadRateLimiter);
  // Apply general API rate limiter to all other API routes
  app.use('/api', apiRateLimiter);

  // ── Routes ─────────────────────────────────────
  app.use(healthRouter);
  app.use(uploadRouter);

  // ── Static file serving for uploads directory ──
  const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
  const absoluteUploadDir = path.resolve(uploadDir);
  app.use('/uploads', express.static(absoluteUploadDir));

  // ── Error handler (must be last) ───────────────
  app.use(errorHandler);

  return app;
}
