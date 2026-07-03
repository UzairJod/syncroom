'use client';

import { useMediaStore } from '@/store/useMediaStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useScreenShareStore } from '@/store/useScreenShareStore';
import { useUIStore } from '@/store/useUIStore';
import YouTubePlayer from './YouTubePlayer';
import VideoPlayer from './VideoPlayer';
import ScreenShareView from './ScreenShareView';
import MediaControlsOverlay from './MediaControlsOverlay';

export default function MediaPlayer() {
  const { mediaType, mediaSource } = useMediaStore();
  const isHost = useRoomStore((s) => s.isHost);
  const { isScreenSharing, localStream, remoteStream, sharerName } = useScreenShareStore();

  // Determine which stream to show for screen share
  const screenStream = localStream || remoteStream;

  // If screen share is active, show it in the media area
  if (isScreenSharing && screenStream) {
    return <ScreenShareView stream={screenStream} sharerName={sharerName || 'Someone'} />;
  }

  if (mediaType === 'none' || !mediaSource) {
    return (
      <div className="w-full aspect-video bg-bg-tertiary rounded-2xl border border-border-glass shadow-sm flex flex-col items-center justify-center gap-6 p-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,92,252,0.05),transparent_70%)] pointer-events-none" />
        <div className="w-20 h-20 rounded-2xl bg-bg-secondary border border-border-glass flex items-center justify-center shadow-lg shadow-black/20 z-10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-purple">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
            <line x1="17" y1="17" x2="22" y2="17" />
          </svg>
        </div>
        <div className="text-center z-10">
          <p className="text-text-primary font-bold text-lg tracking-tight mb-2">No media is playing</p>
          <p className="text-text-secondary text-sm max-w-[250px] mx-auto leading-relaxed">
            {isHost() ? 'Click the "Set Media" button below to start watching.' : 'Waiting for the host to select media to watch together.'}
          </p>
        </div>
      </div>
    );
  }

  const isFullscreen = useUIStore((s) => s.isFullscreen);

  return (
    <div className={`relative flex items-center justify-center w-full bg-black ${isFullscreen ? 'h-full' : 'aspect-video landscape:h-full landscape:aspect-auto rounded-2xl overflow-hidden border border-border-glass'}`}>
      {mediaType === 'youtube' && <YouTubePlayer />}
      {mediaType === 'video' && <VideoPlayer />}
      <MediaControlsOverlay />
    </div>
  );
}
