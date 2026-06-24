'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useMediaStore } from '@/store/useMediaStore';
import { useRoomStore } from '@/store/useRoomStore';
import { SYNC_INTERVAL_MS, MAX_DRIFT_MS } from '@/lib/constants';
import type { MediaType } from '@/types/media';

export function useMediaSync(registerListeners = false) {
  const isSyncingRef = useRef(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerTimeGetterRef = useRef<(() => number) | null>(null);
  const { mediaSource, mediaType, isPlaying, currentTime, playbackSpeed } = useMediaStore();
  const isHost = useRoomStore((s) => s.isHost);

  useEffect(() => {
    if (!registerListeners) return;
    const socket = getSocket();

    const handleMediaSourceSet = (data: any) => {
      useMediaStore.getState().setMediaSource(data.source, data.type);
    };

    const handleMediaPlay = (data: any) => {
      isSyncingRef.current = true;
      useMediaStore.getState().setPlayState(true);
      useMediaStore.getState().setCurrentTime(data.currentTime);
      setTimeout(() => { isSyncingRef.current = false; }, 600);
    };

    const handleMediaPause = (data: any) => {
      isSyncingRef.current = true;
      useMediaStore.getState().setPlayState(false);
      useMediaStore.getState().setCurrentTime(data.currentTime);
      setTimeout(() => { isSyncingRef.current = false; }, 600);
    };

    const handleMediaSeek = (data: any) => {
      isSyncingRef.current = true;
      useMediaStore.getState().setCurrentTime(data.currentTime);
      setTimeout(() => { isSyncingRef.current = false; }, 600);
    };

    const handleMediaSpeedChange = (data: any) => {
      isSyncingRef.current = true;
      useMediaStore.getState().setPlaybackSpeed(data.speed);
      setTimeout(() => { isSyncingRef.current = false; }, 600);
    };

    const handleTimeSync = (data: any) => {
      const store = useMediaStore.getState();
      const localTime = playerTimeGetterRef.current?.() ?? store.currentTime;
      const drift = Math.abs(localTime - data.currentTime);
      if (drift > MAX_DRIFT_MS / 1000) {
        isSyncingRef.current = true;
        store.setCurrentTime(data.currentTime);
        setTimeout(() => { isSyncingRef.current = false; }, 600);
      }
    };

    socket.on('media-source-set', handleMediaSourceSet);
    socket.on('media-play', handleMediaPlay);
    socket.on('media-pause', handleMediaPause);
    socket.on('media-seek', handleMediaSeek);
    socket.on('media-speed-change', handleMediaSpeedChange);
    socket.on('time-sync', handleTimeSync);

    return () => {
      socket.off('media-source-set', handleMediaSourceSet);
      socket.off('media-play', handleMediaPlay);
      socket.off('media-pause', handleMediaPause);
      socket.off('media-seek', handleMediaSeek);
      socket.off('media-speed-change', handleMediaSpeedChange);
      socket.off('time-sync', handleTimeSync);
    };
  }, [registerListeners]);

  // Host periodic time sync
  useEffect(() => {
    if (isHost() && isPlaying && mediaType !== 'none') {
      syncIntervalRef.current = setInterval(() => {
        const socket = getSocket();
        const time = playerTimeGetterRef.current?.() ?? useMediaStore.getState().currentTime;
        socket.emit('media-time-sync', {
          currentTime: time,
          isPlaying: true,
          timestamp: Date.now(),
        });
      }, SYNC_INTERVAL_MS);
    }
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [isHost, isPlaying, mediaType]);

  const setMediaSource = useCallback((source: string, type: MediaType) => {
    const socket = getSocket();
    socket.emit('media-set-source', { source, type });
    useMediaStore.getState().setMediaSource(source, type);
  }, []);

  const play = useCallback((time: number) => {
    if (isSyncingRef.current) return;
    const socket = getSocket();
    socket.emit('media-play', { currentTime: time });
  }, []);

  const pause = useCallback((time: number) => {
    if (isSyncingRef.current) return;
    const socket = getSocket();
    socket.emit('media-pause', { currentTime: time });
  }, []);

  const seek = useCallback((time: number) => {
    if (isSyncingRef.current) return;
    const socket = getSocket();
    socket.emit('media-seek', { currentTime: time });
  }, []);

  const setSpeed = useCallback((speed: number) => {
    if (isSyncingRef.current) return;
    const socket = getSocket();
    socket.emit('media-speed-change', { speed });
  }, []);

  const requestSync = useCallback(() => {
    const socket = getSocket();
    socket.emit('request-sync');
  }, []);

  const registerTimeGetter = useCallback((getter: () => number) => {
    playerTimeGetterRef.current = getter;
  }, []);

  return {
    setMediaSource,
    play,
    pause,
    seek,
    setSpeed,
    requestSync,
    registerTimeGetter,
    isSyncing: isSyncingRef,
    mediaSource,
    mediaType,
    isPlaying,
    currentTime,
    playbackSpeed,
  };
}
