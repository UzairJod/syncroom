'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useMediaStore } from '@/store/useMediaStore';
import { useRoomStore } from '@/store/useRoomStore';
import { SYNC_INTERVAL_MS, MAX_DRIFT_MS } from '@/lib/constants';
import type { MediaType } from '@/types/media';

export function useMediaSync() {
  const isSyncingRef = useRef(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerTimeGetterRef = useRef<(() => number) | null>(null);
  const { mediaSource, mediaType, isPlaying, currentTime, playbackSpeed } = useMediaStore();
  const isHost = useRoomStore((s) => s.isHost);

  useEffect(() => {
    const socket = getSocket();

    socket.on('media-source-set', (data) => {
      useMediaStore.getState().setMediaSource(data.source, data.type);
    });

    socket.on('media-play', (data) => {
      isSyncingRef.current = true;
      useMediaStore.getState().setPlayState(true);
      useMediaStore.getState().setCurrentTime(data.currentTime);
      setTimeout(() => { isSyncingRef.current = false; }, 600);
    });

    socket.on('media-pause', (data) => {
      isSyncingRef.current = true;
      useMediaStore.getState().setPlayState(false);
      useMediaStore.getState().setCurrentTime(data.currentTime);
      setTimeout(() => { isSyncingRef.current = false; }, 600);
    });

    socket.on('media-seek', (data) => {
      isSyncingRef.current = true;
      useMediaStore.getState().setCurrentTime(data.currentTime);
      setTimeout(() => { isSyncingRef.current = false; }, 600);
    });

    socket.on('media-speed-change', (data) => {
      isSyncingRef.current = true;
      useMediaStore.getState().setPlaybackSpeed(data.speed);
      setTimeout(() => { isSyncingRef.current = false; }, 600);
    });

    socket.on('time-sync', (data) => {
      const store = useMediaStore.getState();
      const localTime = playerTimeGetterRef.current?.() ?? store.currentTime;
      const drift = Math.abs(localTime - data.currentTime);
      if (drift > MAX_DRIFT_MS / 1000) {
        isSyncingRef.current = true;
        store.setCurrentTime(data.currentTime);
        setTimeout(() => { isSyncingRef.current = false; }, 600);
      }
    });

    return () => {
      socket.off('media-source-set');
      socket.off('media-play');
      socket.off('media-pause');
      socket.off('media-seek');
      socket.off('media-speed-change');
      socket.off('time-sync');
    };
  }, []);

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
