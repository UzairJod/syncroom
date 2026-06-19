import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { getStorage } from '../storage/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
const absoluteUploadDir = path.resolve(uploadDir);

// Ensure upload directory exists
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

// ── Multer configuration ──────────────────────────
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, absoluteUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueId = nanoid(12);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${ext}`);
  },
});

// Video upload: max 3GB
const videoUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 3 * 1024 * 1024 * 1024, // 3GB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/x-matroska'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: mp4, webm, mkv`));
    }
  },
});

// Subtitle upload: max 5MB
const subtitleUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.srt', '.vtt'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${ext}. Allowed: .srt, .vtt`));
    }
  },
});

// ── POST /api/upload ──────────────────────────────
router.post('/api/upload', videoUpload.single('video'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No video file provided' });
      return;
    }

    const storage = getStorage();
    const { url } = await storage.upload(req.file);

    logger.info('Video uploaded', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    res.status(200).json({
      url,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/upload/subtitle ─────────────────────
router.post(
  '/api/upload/subtitle',
  subtitleUpload.single('subtitle'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No subtitle file provided' });
        return;
      }

      const storage = getStorage();
      const { url } = await storage.upload(req.file);

      logger.info('Subtitle uploaded', {
        filename: req.file.filename,
        size: req.file.size,
      });

      res.status(200).json({
        url,
        filename: req.file.filename,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/uploads/:filename ────────────────────
// Serve uploaded files with range request support for video streaming
router.get('/api/uploads/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;

  // Sanitize filename to prevent directory traversal
  const sanitizedFilename = path.basename(filename);
  const filePath = path.join(absoluteUploadDir, sanitizedFilename);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(sanitizedFilename).toLowerCase();

  // Determine content type
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.srt': 'text/plain; charset=utf-8',
    '.vtt': 'text/vtt; charset=utf-8',
  };
  const contentType = mimeTypes[ext] ?? 'application/octet-stream';

  // Handle range requests for video streaming
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    // Validate range
    if (start >= fileSize || end >= fileSize || start > end) {
      res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
      return;
    }

    const chunkSize = end - start + 1;

    res.status(206).set({
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize.toString(),
      'Content-Type': contentType,
    });

    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
  } else {
    // No range request: send entire file
    res.set({
      'Content-Length': fileSize.toString(),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
});

export default router;
