'use client';

import { useRef, useEffect } from 'react';

interface ScreenShareViewProps {
  stream: MediaStream | null;
  sharerName: string;
}

export default function ScreenShareView({ stream, sharerName }: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-border-glass">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        className="w-full h-full object-contain"
      />
      <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-lg text-xs font-medium text-white">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        🖥️ Screen shared by {sharerName}
      </div>
    </div>
  );
}
