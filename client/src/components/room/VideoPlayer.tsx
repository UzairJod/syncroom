'use client';

import { useEffect, useRef } from 'react';
import { useMediaStore } from '@/store/useMediaStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useMediaSync } from '@/hooks/useMediaSync';

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSyncingLocalRef = useRef(false);
  const { mediaSource, isPlaying, currentTime, playbackSpeed, subtitleState } = useMediaStore();
  const isHost = useRoomStore((s) => s.isHost);
  const { play, pause, seek, setSpeed, registerTimeGetter, isSyncing } = useMediaSync();

  // Build full video URL — relative paths like /api/uploads/xxx need the backend server prefix
  const videoSrc = mediaSource.startsWith('/') 
    ? `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}${mediaSource}` 
    : mediaSource;

  // Register time getter
  useEffect(() => {
    if (videoRef.current) {
      registerTimeGetter(() => videoRef.current?.currentTime ?? 0);
    }
  }, [registerTimeGetter]);

  // Host: emit events on player actions
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHost()) return;

    const onPlay = () => {
      if (!isSyncing.current && !isSyncingLocalRef.current) {
        play(video.currentTime);
      }
    };
    const onPause = () => {
      if (!isSyncing.current && !isSyncingLocalRef.current) {
        pause(video.currentTime);
      }
    };
    const onSeeked = () => {
      if (!isSyncing.current && !isSyncingLocalRef.current) {
        seek(video.currentTime);
      }
    };
    const onRateChange = () => {
      if (!isSyncing.current && !isSyncingLocalRef.current) {
        setSpeed(video.playbackRate);
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('ratechange', onRateChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('ratechange', onRateChange);
    };
  }, [isHost, play, pause, seek, setSpeed, isSyncing]);

  // Participant: apply sync state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isHost()) return;

    isSyncingLocalRef.current = true;

    const drift = Math.abs(video.currentTime - currentTime);
    if (drift > 0.5) {
      video.currentTime = currentTime;
    }

    if (isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }

    if (video.playbackRate !== playbackSpeed) {
      video.playbackRate = playbackSpeed;
    }

    setTimeout(() => {
      isSyncingLocalRef.current = false;
    }, 600);
  }, [isPlaying, currentTime, playbackSpeed, isHost]);

  // Apply subtitle settings
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Remove existing tracks
    while (video.textTracks.length > 0) {
      const track = video.querySelector('track');
      if (track) track.remove();
      else break;
    }

    if (subtitleState.enabled && subtitleState.trackUrl) {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = subtitleState.language || 'Subtitles';
      track.srclang = subtitleState.language || 'en';
      track.src = subtitleState.trackUrl;
      track.default = true;
      video.appendChild(track);

      // Apply styling
      if (video.textTracks[0]) {
        video.textTracks[0].mode = 'showing';
      }
    }
  }, [subtitleState]);

  return (
    <div className="relative w-full aspect-video bg-black">
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        className="w-full h-full"
        playsInline
        crossOrigin="anonymous"
        style={{
          // Custom subtitle styling via CSS
          ...(subtitleState.enabled
            ? {
                ['--subtitle-size' as string]: `${subtitleState.fontSize}px`,
                ['--subtitle-bg-opacity' as string]: subtitleState.bgOpacity,
              }
            : {}),
        }}
      />
    </div>
  );
}
