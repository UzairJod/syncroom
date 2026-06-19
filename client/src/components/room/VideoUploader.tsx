'use client';

import { useState, useRef, useCallback } from 'react';
import { SUPPORTED_VIDEO_TYPES, MAX_FILE_SIZE } from '@/lib/constants';
import { useUIStore } from '@/store/useUIStore';

interface VideoUploaderProps {
  onUploadComplete: (url: string) => void;
}

export default function VideoUploader({ onUploadComplete }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useUIStore((s) => s.addToast);

  const validateFile = (f: File): boolean => {
    if (!SUPPORTED_VIDEO_TYPES.includes(f.type) && !f.name.endsWith('.mkv')) {
      addToast({ type: 'error', message: 'Unsupported file type. Use MP4, WebM, or MKV.' });
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      addToast({ type: 'error', message: 'File too large. Maximum size is 3GB.' });
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && validateFile(selected)) {
      setFile(selected);
    }
  };

  const uploadFile = () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = JSON.parse(xhr.responseText);
        onUploadComplete(result.url);
        addToast({ type: 'success', message: 'Video uploaded successfully!' });
        setFile(null);
      } else {
        addToast({ type: 'error', message: 'Upload failed. Please try again.' });
      }
      setIsUploading(false);
    });

    xhr.addEventListener('error', () => {
      addToast({ type: 'error', message: 'Upload failed. Check your connection.' });
      setIsUploading(false);
    });

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    xhr.open('POST', `${socketUrl}/api/upload`);
    xhr.send(formData);
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
    setProgress(0);
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-3 p-8
          border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-200
          ${isDragOver
            ? 'border-accent-blue bg-accent-blue/10'
            : 'border-border-glass hover:border-white/20 hover:bg-white/5'}
        `}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            {isDragOver ? 'Drop video here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-text-muted mt-1">MP4, WebM, MKV • Max 3GB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/x-matroska,.mkv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File Info */}
      {file && !isUploading && (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-accent-blue">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            <span className="text-sm text-text-primary truncate">{file.name}</span>
            <span className="text-xs text-text-muted shrink-0">{formatSize(file.size)}</span>
          </div>
          <button
            onClick={uploadFile}
            className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-lg hover:brightness-110 transition-all"
          >
            Upload & Play
          </button>
        </div>
      )}

      {/* Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Uploading...</span>
            <span className="text-text-primary font-medium">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={cancelUpload}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
