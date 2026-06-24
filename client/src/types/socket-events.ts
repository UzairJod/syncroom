import type { ChatMessage } from './chat';
import type { MediaType, SubtitleState } from './media';
import type { RoomState } from './room';

export interface ClientToServerEvents {
  // Room events
  'join-room': (data: { roomId: string; displayName: string }) => void;
  'leave-room': () => void;

  // Chat events
  'send-message': (data: { content: string }) => void;

  // Media events
  'media-set-source': (data: { source: string; type: MediaType }) => void;
  'media-play': (data: { currentTime: number }) => void;
  'media-pause': (data: { currentTime: number }) => void;
  'media-seek': (data: { currentTime: number }) => void;
  'media-speed-change': (data: { speed: number }) => void;
  'media-time-sync': (data: { currentTime: number; isPlaying: boolean; timestamp: number }) => void;
  'request-sync': () => void;

  // Subtitle events
  'subtitle-state-change': (data: SubtitleState) => void;

  // WebRTC signaling events
  'webrtc-offer': (data: { targetId: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc-answer': (data: { targetId: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc-ice-candidate': (data: { targetId: string; candidate: RTCIceCandidateInit }) => void;

  // Voice chat events
  'voice-join': () => void;
  'voice-leave': () => void;
  'voice-mute': (data: { isMuted: boolean }) => void;
  'voice-speaking': (data: { isSpeaking: boolean }) => void;

  // Screen share events
  'screen-share-start': () => void;
  'screen-share-stop': () => void;

  // Screen share WebRTC signaling (separate from voice)
  'ss-ready': (data: { targetId: string }) => void;
  'ss-offer': (data: { targetId: string; offer: RTCSessionDescriptionInit }) => void;
  'ss-answer': (data: { targetId: string; answer: RTCSessionDescriptionInit }) => void;
  'ss-ice-candidate': (data: { targetId: string; candidate: RTCIceCandidateInit }) => void;
}

export interface ServerToClientEvents {
  // Room events
  'room-state': (data: RoomState) => void;
  'user-joined': (data: { id: string; socketId: string; displayName: string; isHost: boolean; joinedAt: number }) => void;
  'user-left': (data: { userId: string }) => void;
  'host-changed': (data: { newHostId: string }) => void;
  'room-error': (data: { message: string }) => void;

  // Chat events
  'new-message': (data: ChatMessage) => void;
  'chat-history': (data: { messages: ChatMessage[] }) => void;

  // Media events
  'media-source-set': (data: { source: string; type: MediaType; userId: string }) => void;
  'media-play': (data: { currentTime: number; userId: string }) => void;
  'media-pause': (data: { currentTime: number; userId: string }) => void;
  'media-seek': (data: { currentTime: number; userId: string }) => void;
  'media-speed-change': (data: { speed: number; userId: string }) => void;
  'media-state-sync': (data: { source: string; type: MediaType; isPlaying: boolean; currentTime: number; playbackSpeed: number; timestamp: number }) => void;
  'time-sync': (data: { currentTime: number; isPlaying: boolean; timestamp: number }) => void;

  // Subtitle events
  'subtitle-state-changed': (data: SubtitleState) => void;

  // WebRTC signaling events
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
