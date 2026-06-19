'use client';

import { useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useMediaStore } from '@/store/useMediaStore';
import { srtToVtt, createSubtitleBlobUrl, revokeSubtitleUrl } from '@/lib/subtitles';
import type { SubtitleState } from '@/types/media';

export function useSubtitles() {
  const blobUrlRef = useRef<string | null>(null);
  const { subtitleState, setSubtitleState } = useMediaStore();

  const loadSubtitleFile = useCallback(async (file: File) => {
    // Revoke old blob URL
    if (blobUrlRef.current) {
      revokeSubtitleUrl(blobUrlRef.current);
    }

    const text = await file.text();
    const isVtt = file.name.endsWith('.vtt');
    const vttContent = isVtt ? text : srtToVtt(text);
    const url = createSubtitleBlobUrl(vttContent, 'vtt');
    blobUrlRef.current = url;

    const newState: Partial<SubtitleState> = {
      enabled: true,
      trackUrl: url,
      language: 'en',
    };
    setSubtitleState(newState);

    const socket = getSocket();
    socket.emit('subtitle-state-change', { ...useMediaStore.getState().subtitleState, ...newState });
  }, [setSubtitleState]);

  const setSubtitleEnabled = useCallback((enabled: boolean) => {
    setSubtitleState({ enabled });
    const socket = getSocket();
    socket.emit('subtitle-state-change', { ...useMediaStore.getState().subtitleState, enabled });
  }, [setSubtitleState]);

  const setFontSize = useCallback((fontSize: number) => {
    setSubtitleState({ fontSize });
    const socket = getSocket();
    socket.emit('subtitle-state-change', { ...useMediaStore.getState().subtitleState, fontSize });
  }, [setSubtitleState]);

  const setBgOpacity = useCallback((bgOpacity: number) => {
    setSubtitleState({ bgOpacity });
    const socket = getSocket();
    socket.emit('subtitle-state-change', { ...useMediaStore.getState().subtitleState, bgOpacity });
  }, [setSubtitleState]);

  const setOffset = useCallback((offset: number) => {
    setSubtitleState({ offset });
    const socket = getSocket();
    socket.emit('subtitle-state-change', { ...useMediaStore.getState().subtitleState, offset });
  }, [setSubtitleState]);

  return {
    loadSubtitleFile,
    setSubtitleEnabled,
    setFontSize,
    setBgOpacity,
    setOffset,
    subtitleState,
    subtitleTrackUrl: blobUrlRef.current,
  };
}
