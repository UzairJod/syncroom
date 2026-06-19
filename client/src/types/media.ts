export type MediaType = 'youtube' | 'video' | 'none';

export interface MediaState {
  source: string;
  type: MediaType;
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  lastSyncAt: number;
}

export interface SubtitleState {
  enabled: boolean;
  trackUrl: string;
  language: string;
  fontSize: number;
  bgOpacity: number;
  offset: number;
}
