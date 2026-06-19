import fs from 'fs';
import path from 'path';
import type { IStorage } from './index.js';
import { logger } from '../utils/logger.js';

export class LocalStorage implements IStorage {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR ?? 'uploads';

    // Ensure upload directory exists
    const absolutePath = path.resolve(this.uploadDir);
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
      logger.info('Created upload directory', { path: absolutePath });
    }
  }

  async upload(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    // Multer has already saved the file when using diskStorage
    // The file.filename is set by multer
    const key = file.filename;
    const url = this.getUrl(key);

    logger.info('File uploaded to local storage', { key, size: file.size });

    return { url, key };
  }

  getUrl(key: string): string {
    return `/api/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.resolve(this.uploadDir, key);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('File deleted from local storage', { key });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to delete file from local storage', { key, error: message });
      throw err;
    }
  }
}
