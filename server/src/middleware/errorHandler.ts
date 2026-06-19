import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { logger } from '../utils/logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Handle Multer-specific errors
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        logger.warn('File too large', { field: err.field });
        res.status(413).json({
          error: 'File too large. Maximum size exceeded.',
          code: 'FILE_TOO_LARGE',
        });
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        logger.warn('Unexpected file field', { field: err.field });
        res.status(400).json({
          error: 'Unexpected file field.',
          code: 'UNEXPECTED_FILE',
        });
        return;
      case 'LIMIT_FILE_COUNT':
        logger.warn('Too many files');
        res.status(400).json({
          error: 'Too many files.',
          code: 'TOO_MANY_FILES',
        });
        return;
      default:
        logger.error('Multer error', { code: err.code, message: err.message });
        res.status(400).json({
          error: err.message,
          code: err.code,
        });
        return;
    }
  }

  // Handle file type errors from our custom filter
  if (err.message && err.message.startsWith('Invalid file type')) {
    logger.warn('Invalid file type', { message: err.message });
    res.status(415).json({
      error: err.message,
      code: 'INVALID_FILE_TYPE',
    });
    return;
  }

  // Generic error handler
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
}
