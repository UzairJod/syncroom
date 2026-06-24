'use client';

import { useRef, useEffect, useState } from 'react';
import { useUIStore } from '@/store/useUIStore';

interface ScreenShareViewProps {
  stream: MediaStream | null;
  sharerName: string;
}

export default function ScreenShareView({ stream, sharerName }: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [trackCount, setTrackCount] = useState(0); // Force re-renders if tracks change

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    console.log('[SS View] Setting srcObject. Tracks:', stream.getTracks().map(t => `${t.kind} (${t.readyState})`));
    
    // Clear and re-assign srcObject to force the video element to pick up new tracks
    video.srcObject = null;
    video.srcObject = stream;

    // Track listener to force re-evaluation when tracks are added/removed
    const updateTracks = () => {
      console.log('[SS View] Tracks updated:', stream.getTracks().map(t => `${t.kind} (${t.readyState})`));
      setTrackCount(stream.getTracks().length);
      // Re-assign srcObject on track change just to be safe
      if (video.srcObject !== stream) {
         video.srcObject = stream;
      }
    };

    stream.addEventListener('addtrack', updateTracks);
    stream.addEventListener('removetrack', updateTracks);
    
    // Initial track count setup
    setTrackCount(stream.getTracks().length);

    // Try playing — handle autoplay policy
    const tryPlay = async () => {
      try {
        await video.play();
        console.log('[SS View] ▶️ Video playing successfully');
      } catch (err) {
        // Autoplay blocked — try muted first, then unmute
        console.log('[SS View] Autoplay blocked, trying muted...', err);
        video.muted = true;
        try {
          await video.play();
          console.log('[SS View] ▶️ Video playing (muted)');
          // Unmute after a short delay
          setTimeout(() => { video.muted = false; }, 500);
        } catch (e2) {
          console.error('[SS View] Cannot play video at all:', e2);
        }
      }
    };

    tryPlay();

    return () => {
      stream.removeEventListener('addtrack', updateTracks);
      stream.removeEventListener('removetrack', updateTracks);
    };
  }, [stream]); // Runs when the stream object reference changes

  const showControls = useUIStore((s) => s.showControls);

  if (!stream) return null;

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-border-glass">
      {/* We use a key based on trackCount to force React to sometimes re-mount the video element if needed,
          but actually just updating srcObject is usually better. Let's just keep the video element stable. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        // Also adding these attributes helps on some mobile browsers
        controls={false}
      />
      <div 
        className={`absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-lg text-xs font-medium text-white z-10 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        🖥️ Screen shared by {sharerName}
      </div>
    </div>
  );
}
