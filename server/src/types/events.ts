import type { MediaState, SubtitleState } from './room.js';

// ──────────────────────────────────────────────────
// Client → Server (must match client socket-events.ts)
// ──────────────────────────────────────────────────
export interface ClientToServerEvents {
  // Room events
  'join-room': (data: { roomId: string; displayName: string }) => void;
  'leave-room': () => void;

  // Chat events
  'send-message': (data: { content: string }) => void;

  // Media events (host-only)
  'media-set-source': (data: { source: string; type: 'youtube' | 'video' | 'none' }) => void;
  'media-play': (data: { currentTime: number }) => void;
  'media-pause': (data: { currentTime: number }) => void;
  'media-seek': (data: { currentTime: number }) => void;
  'media-speed-change': (data: { speed: number }) => void;
  'media-time-sync': (data: { currentTime: number; isPlaying: boolean; timestamp: number }) => void;
  'request-sync': () => void;

  // Subtitle events (host-only)
  'subtitle-state-change': (data: SubtitleState) => void;

  // WebRTC signaling
  'webrtc-offer': (data: { targetId: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc-answer': (data: { targetId: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc-ice-candidate': (data: { targetId: string; candidate: RTCIceCandidateInit }) => void;

  // Voice chat
  'voice-join': () => void;
  'voice-leave': () => void;
  'voice-mute': (data: { isMuted: boolean }) => void;
  'voice-speaking': (data: { isSpeaking: boolean }) => void;

  // Screen share
  'screen-share-start': () => void;
  'screen-share-stop': () => void;

  // Screen share WebRTC signaling (separate from voice)
  'ss-ready': (data: { targetId: string }) => void;
  'ss-offer': (data: { targetId: string; offer: RTCSessionDescriptionInit }) => void;
  'ss-answer': (data: { targetId: string; answer: RTCSessionDescriptionInit }) => void;
  'ss-ice-candidate': (data: { targetId: string; candidate: RTCIceCandidateInit }) => void;
}

// ──────────────────────────────────────────────────
// Server → Client (must match client socket-events.ts)
// ──────────────────────────────────────────────────
export interface ServerToClientEvents {
  // Room events
  'room-state': (data: { id: string; users: Array<{ id: string; socketId: string; displayName: string; isHost: boolean; joinedAt: number }>; hostId: string; screenShare?: { active: boolean; sharerId: string | null; sharerName: string | null } }) => void;
  'user-joined': (data: { id: string; socketId: string; displayName: string; isHost: boolean; joinedAt: number }) => void;
  'user-left': (data: { userId: string }) => void;
  'host-changed': (data: { newHostId: string }) => void;
  'room-error': (data: { message: string }) => void;

  // Chat events
  'new-message': (data: { id: string; userId: string; displayName: string; content: string; timestamp: number; type: 'user' | 'system' }) => void;
  'chat-history': (data: { messages: Array<{ id: string; userId: string; displayName: string; content: string; timestamp: number; type: 'user' | 'system' }> }) => void;

  // Media events
  'media-source-set': (data: { source: string; type: 'youtube' | 'video' | 'none'; userId: string }) => void;
  'media-play': (data: { currentTime: number; userId: string }) => void;
  'media-pause': (data: { currentTime: number; userId: string }) => void;
  'media-seek': (data: { currentTime: number; userId: string }) => void;
  'media-speed-change': (data: { speed: number; userId: string }) => void;
  'media-state-sync': (data: { source: string; type: 'youtube' | 'video' | 'none'; isPlaying: boolean; currentTime: number; playbackSpeed: number; timestamp: number }) => void;
  'time-sync': (data: { currentTime: number; isPlaying: boolean; timestamp: number }) => void;

  // Subtitle events
  'subtitle-state-changed': (data: SubtitleState) => void;

  // WebRTC signaling
  'webrtc-offer': (data: { senderId: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc-answer': (data: { senderId: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc-ice-candidate': (data: { senderId: string; candidate: RTCIceCandidateInit }) => void;

  // Voice chat events
  'voice-user-joined': (data: { userId: string; displayName: string }) => void;
  'voice-user-left': (data: { userId: string }) => void;
  'voice-users': (data: { userIds: string[] }) => void;
  'voice-mute-changed': (data: { userId: string; isMuted: boolean }) => void;
  'voice-speaking-changed': (data: { userId: string; isSpeaking: boolean }) => void;

  // Screen share events
  'screen-share-started': (data: { userId: string; displayName: string }) => void;
  'screen-share-stopped': (data: { userId: string }) => void;

  // Screen share WebRTC signaling (separate from voice)
  'ss-ready': (data: { senderId: string }) => void;
  'ss-offer': (data: { senderId: string; offer: RTCSessionDescriptionInit }) => void;
  'ss-answer': (data: { senderId: string; answer: RTCSessionDescriptionInit }) => void;
  'ss-ice-candidate': (data: { senderId: string; candidate: RTCIceCandidateInit }) => void;
}

// ──────────────────────────────────────────────────
// Inter-Server (for future horizontal scaling)
// ──────────────────────────────────────────────────
export interface InterServerEvents {
  ping: () => void;
}

// ──────────────────────────────────────────────────
// Socket session data
// ──────────────────────────────────────────────────
export interface SocketData {
  userId: string;
  displayName: string;
  roomId: string | null;
  inVoice: boolean;
}
