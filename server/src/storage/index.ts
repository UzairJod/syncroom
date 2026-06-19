/** Storage interface for file upload abstraction */
export interface IStorage {
  /** Upload a file and return its URL and storage key */
  upload(file: Express.Multer.File): Promise<{ url: string; key: string }>;

  /** Get the public URL for a storage key */
  getUrl(key: string): string;

  /** Delete a file by its storage key */
  delete(key: string): Promise<void>;
}

import { LocalStorage } from './local.js';
import { S3Storage } from './s3.js';

let storageInstance: IStorage | null = null;

/** Get or create the storage instance based on STORAGE_TYPE env var */
export function getStorage(): IStorage {
  if (storageInstance) return storageInstance;

  const storageType = process.env.STORAGE_TYPE ?? 'local';

  if (storageType === 's3') {
    storageInstance = new S3Storage();
  } else {
    storageInstance = new LocalStorage();
  }

  return storageInstance;
}
