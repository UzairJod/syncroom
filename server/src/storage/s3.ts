import fs from 'fs';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import type { IStorage } from './index.js';
import { logger } from '../utils/logger.js';

export class S3Storage implements IStorage {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    const region = process.env.S3_REGION ?? 'auto';

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 storage requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY environment variables',
      );
    }

    this.endpoint = endpoint;
    this.bucket = bucket;

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for many S3-compatible services like MinIO
    });

    logger.info('S3 storage initialized', { endpoint, bucket, region });
  }

  async upload(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    const key = file.filename;
    const fileStream = fs.createReadStream(file.path);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
      ContentLength: file.size,
    });

    try {
      await this.client.send(command);

      // Clean up the local temp file after successful upload
      try {
        fs.unlinkSync(file.path);
      } catch {
        // Ignore cleanup errors
      }

      const url = this.getUrl(key);
      logger.info('File uploaded to S3', { key, size: file.size, bucket: this.bucket });

      return { url, key };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to upload file to S3', { key, error: message });
      throw new Error(`S3 upload failed: ${message}`);
    }
  }

  getUrl(key: string): string {
    // Use the public URL if configured (Cloudflare R2 public bucket URL)
    const publicUrl = process.env.S3_PUBLIC_URL;
    if (publicUrl) {
      return `${publicUrl}/${key}`;
    }
    // Fallback to endpoint/bucket/key pattern
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
      logger.info('File deleted from S3', { key, bucket: this.bucket });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to delete file from S3', { key, error: message });
      throw new Error(`S3 delete failed: ${message}`);
    }
  }
}
