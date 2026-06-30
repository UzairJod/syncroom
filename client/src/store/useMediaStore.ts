import { create } from 'zustand';
import type { MediaType, SubtitleState } from '@/types/media';

interface MediaStore {
  mediaSource: string;
  mediaType: MediaType;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  subtitleState: SubtitleState;
  setMediaSource: (source: string, type: MediaType) => void;
  setPlayState: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  setSubtitleState: (state: Partial<SubtitleState>) => void;
  reset: () => void;
}

const defaultSubtitleState: SubtitleState = {
  enabled: false,
  trackUrl: '',
  language: '',
  fontSize: 16,
  bgOpacity: 0.75,
  offset: 0,
};

export const useMediaStore = create<MediaStore>((set) => ({
  mediaSource: '',
  mediaType: 'none',
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
  volume: 1,
  isMuted: false,
  subtitleState: { ...defaultSubtitleState },

  setMediaSource: (source, type) =>
    set({ mediaSource: source, mediaType: type, isPlaying: false, currentTime: 0, duration: 0, playbackSpeed: 1 }),

  setPlayState: (isPlaying) => set({ isPlaying }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (time) => set({ duration: time }),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setVolume: (volume) => set({ volume }),

  setIsMuted: (isMuted) => set({ isMuted }),

  setSubtitleState: (state) =>
    set((prev) => ({ subtitleState: { ...prev.subtitleState, ...state } })),

  reset: () =>
    set({
      mediaSource: '',
      mediaType: 'none',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackSpeed: 1,
      subtitleState: { ...defaultSubtitleState },
    }),
}));
