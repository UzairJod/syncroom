'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMediaStore } from '@/store/useMediaStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useMediaSync } from '@/hooks/useMediaSync';
import { useUIStore } from '@/store/useUIStore';
import { extractYouTubeId } from '@/lib/youtube';

// YouTube IFrame API types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

declare namespace YT {
  class Player {
    constructor(elementId: string, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getPlayerState(): number;
    setPlaybackRate(rate: number): void;
    getPlaybackRate(): number;
    destroy(): void;
  }
  interface PlayerOptions {
    height?: string | number;
    width?: string | number;
    videoId?: string;
    playerVars?: Record<string, unknown>;
    events?: {
      onReady?: (event: { target: Player }) => void;
      onStateChange?: (event: { data: number; target: Player }) => void;
    };
  }
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
}

export default function YouTubePlayer() {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSyncingLocalRef = useRef(false);
  const { mediaSource, isPlaying, currentTime, playbackSpeed } = useMediaStore();
  const isHost = useRoomStore((s) => s.isHost);
  const { play, pause, seek, setSpeed, registerTimeGetter, isSyncing } = useMediaSync();

  const videoId = extractYouTubeId(mediaSource);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // Initialize player
  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('yt-player', {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: isHost() ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            registerTimeGetter(() => event.target.getCurrentTime());
            if (currentTime > 0) {
              event.target.seekTo(currentTime, true);
            }
            if (playbackSpeed !== 1) {
              event.target.setPlaybackRate(playbackSpeed);
            }
          },
          onStateChange: handleStateChange,
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  const handleStateChange = useCallback(
    (event: { data: number; target: YT.Player }) => {
      if (isSyncing.current || isSyncingLocalRef.current || !isHost()) return;

      const time = event.target.getCurrentTime();
      switch (event.data) {
        case 1: // PLAYING
          play(time);
          break;
        case 2: // PAUSED
          pause(time);
          break;
      }
    },
    [isHost, play, pause, isSyncing],
  );

  // Sync: apply remote play/pause/seek
  useEffect(() => {
    if (!playerRef.current || isHost()) return;

    isSyncingLocalRef.current = true;
    const player = playerRef.current;

    try {
      const playerTime = player.getCurrentTime();
      const drift = Math.abs(playerTime - currentTime);
      if (drift > 0.5) {
        player.seekTo(currentTime, true);
      }

      const state = player.getPlayerState();
      if (isPlaying && state !== 1) {
        player.playVideo();
      } else if (!isPlaying && state === 1) {
        player.pauseVideo();
      }

      if (player.getPlaybackRate() !== playbackSpeed) {
        player.setPlaybackRate(playbackSpeed);
      }
    } catch {
      // Player might not be ready
    }

    setTimeout(() => {
      isSyncingLocalRef.current = false;
    }, 600);
  }, [isPlaying, currentTime, playbackSpeed, isHost]);

  const isFullscreen = useUIStore((s) => s.isFullscreen);

  return (
    <div ref={containerRef} className={`relative w-full bg-black ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
      <div id="yt-player" className="absolute inset-0 w-full h-full" />
    </div>
  );
}
