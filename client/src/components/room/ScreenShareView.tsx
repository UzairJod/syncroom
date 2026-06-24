'use client';

import { useRef, useEffect } from 'react';

interface ScreenShareViewProps {
  stream: MediaStream | null;
  sharerName: string;
}

export default function ScreenShareView({ stream, sharerName }: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;

    // Try playing — handle autoplay policy
    const tryPlay = async () => {
      try {
        await video.play();
        console.log('[SS] ▶️ Video playing successfully');
      } catch {
        // Autoplay blocked — try muted first, then unmute
        console.log('[SS] Autoplay blocked, trying muted...');
        video.muted = true;
        try {
          await video.play();
          console.log('[SS] ▶️ Video playing (muted)');
          // Unmute after a short delay
          setTimeout(() => { video.muted = false; }, 500);
        } catch (e2) {
          console.error('[SS] Cannot play video at all:', e2);
        }
      }
    };

    tryPlay();

    // Log track states
    stream.getTracks().forEach(t => {
      console.log(`[SS] Track: ${t.kind} state=${t.readyState} enabled=${t.enabled}`);
    });
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-border-glass">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-lg text-xs font-medium text-white">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        🖥️ Screen shared by {sharerName}
      </div>
    </div>
  );
}
