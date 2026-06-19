'use client';

import { useMediaStore } from '@/store/useMediaStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useScreenShareStore } from '@/store/useScreenShareStore';
import YouTubePlayer from './YouTubePlayer';
import VideoPlayer from './VideoPlayer';
import ScreenShareView from './ScreenShareView';

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
      <div className="w-full aspect-video bg-bg-secondary/50 rounded-2xl border border-border-glass flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-text-secondary font-medium">No media playing</p>
          <p className="text-text-muted text-sm mt-1">
            {isHost() ? 'Click "Set Media" to start watching' : 'Waiting for the host to set media...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border-glass bg-black">
      {mediaType === 'youtube' && <YouTubePlayer />}
      {mediaType === 'video' && <VideoPlayer />}
    </div>
  );
}
