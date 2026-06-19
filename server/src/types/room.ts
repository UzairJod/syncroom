export interface User {
  id: string;
  socketId: string;
  displayName: string;
  isHost: boolean;
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'system';
}

export interface MediaState {
  source: string;
  type: 'youtube' | 'video' | 'none';
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  lastSyncAt: Date;
}

export interface SubtitleState {
  enabled: boolean;
  trackUrl: string;
  language: string;
  fontSize: number;
  bgOpacity: number;
  offset: number;
}

export interface ScreenShareState {
  active: boolean;
  sharerId: string | null;
  sharerName: string | null;
}

export interface Room {
  id: string;
  users: Map<string, User>;
  hostId: string;
  chatHistory: ChatMessage[];
  mediaState: MediaState;
  subtitleState: SubtitleState;
  screenShareState: ScreenShareState;
  createdAt: Date;
  lastActivity: Date;
}

/** Serialized room state sent over the wire (Map converted to array) */
export interface RoomState {
  id: string;
  users: User[];
  hostId: string;
  chatHistory: ChatMessage[];
  mediaState: MediaState;
  subtitleState: SubtitleState;
  screenShareState: ScreenShareState;
  createdAt: string;
  lastActivity: string;
}
