import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/events.js';
import { roomManager } from '../managers/RoomManager.js';
import { logger } from '../utils/logger.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerSignalingHandlers(io: TypedServer, socket: TypedSocket): void {
  // ── WebRTC Offer ──────────────────────────────────
  socket.on('webrtc-offer', (data) => {
    const { targetId, offer } = data;
    io.to(targetId).emit('webrtc-offer', {
      senderId: socket.id,
      offer,
    });
  });

  // ── WebRTC Answer ─────────────────────────────────
  socket.on('webrtc-answer', (data) => {
    const { targetId, answer } = data;
    io.to(targetId).emit('webrtc-answer', {
      senderId: socket.id,
      answer,
    });
  });

  // ── WebRTC ICE Candidate ──────────────────────────
  socket.on('webrtc-ice-candidate', (data) => {
    const { targetId, candidate } = data;
    io.to(targetId).emit('webrtc-ice-candidate', {
      senderId: socket.id,
      candidate,
    });
  });

  // ── Screen Share WebRTC Signaling (separate channel) ──
  socket.on('ss-ready', (data) => {
    const { targetId } = data;
    io.to(targetId).emit('ss-ready', {
      senderId: socket.id,
    });
    logger.debug('SS ready signal', { from: socket.id, to: targetId });
  });

  socket.on('ss-offer', (data) => {
    const { targetId, offer } = data;
    io.to(targetId).emit('ss-offer', {
      senderId: socket.id,
      offer,
    });
  });

  socket.on('ss-answer', (data) => {
    const { targetId, answer } = data;
    io.to(targetId).emit('ss-answer', {
      senderId: socket.id,
      answer,
    });
  });

  socket.on('ss-ice-candidate', (data) => {
    const { targetId, candidate } = data;
    io.to(targetId).emit('ss-ice-candidate', {
      senderId: socket.id,
      candidate,
    });
  });

  // ── Voice Join ────────────────────────────────────
  socket.on('voice-join', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !socket.data.userId) return;

    socket.data.inVoice = true;

    // Notify room that this user joined voice
    socket.to(roomId).emit('voice-user-joined', {
      userId: socket.data.userId,
      displayName: socket.data.displayName ?? 'Unknown',
    });

    // Send list of current voice users to the joiner
    const room = roomManager.getRoom(roomId);
    if (room) {
      const voiceUserIds: string[] = [];
      // We track voice status in socket data, so we need to check all sockets in the room
      const sockets = io.sockets.adapter.rooms.get(roomId);
      if (sockets) {
        for (const socketId of sockets) {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.data.inVoice && s.id !== socket.id) {
            voiceUserIds.push(s.data.userId);
          }
        }
      }
      socket.emit('voice-users', { userIds: voiceUserIds });
    }

    logger.debug('Voice join', { roomId, userId: socket.data.userId });
  });

  // ── Voice Leave ───────────────────────────────────
  socket.on('voice-leave', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !socket.data.userId) return;

    socket.data.inVoice = false;

    socket.to(roomId).emit('voice-user-left', {
      userId: socket.data.userId,
    });

    logger.debug('Voice leave', { roomId, userId: socket.data.userId });
  });

  // ── Voice Mute ────────────────────────────────────
  socket.on('voice-mute', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !socket.data.userId) return;

    socket.to(roomId).emit('voice-mute-changed', {
      userId: socket.data.userId,
      isMuted: data.isMuted,
    });
  });

  // ── Voice Speaking ────────────────────────────────
  socket.on('voice-speaking', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !socket.data.userId) return;

    socket.to(roomId).emit('voice-speaking-changed', {
      userId: socket.data.userId,
      isSpeaking: data.isSpeaking,
    });
  });

  // ── Screen Share Start ────────────────────────────
  socket.on('screen-share-start', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !socket.data.userId) return;
    if (!roomManager.isHost(roomId, socket.data.userId)) {
      socket.emit('room-error', { message: 'Only the host can share screen' });
      return;
    }

    const room = roomManager.getRoom(roomId);
    if (room) {
      room.screenShareState = {
        active: true,
        sharerId: socket.data.userId,
        sharerName: socket.data.displayName ?? 'Unknown',
      };
    }

    io.to(roomId).emit('screen-share-started', {
      userId: socket.data.userId,
      displayName: socket.data.displayName ?? 'Unknown',
    });

    logger.info('Screen share started', { roomId, userId: socket.data.userId });
  });

  // ── Screen Share Stop ─────────────────────────────
  socket.on('screen-share-stop', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !socket.data.userId) return;

    const room = roomManager.getRoom(roomId);
    if (room) {
      room.screenShareState = { active: false, sharerId: null, sharerName: null };
    }

    io.to(roomId).emit('screen-share-stopped', {
      userId: socket.data.userId,
    });

    logger.info('Screen share stopped', { roomId, userId: socket.data.userId });
  });
}
