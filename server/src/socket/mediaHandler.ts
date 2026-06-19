import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/events.js';
import { roomManager } from '../managers/RoomManager.js';
import { logger } from '../utils/logger.js';
import type { SubtitleState } from '../types/room.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/** Verify that the socket user is the host of the room */
function assertHost(socket: TypedSocket): boolean {
  const roomId = socket.data.roomId;
  const userId = socket.data.userId;
  if (!roomId || !userId) return false;
  return roomManager.isHost(roomId, userId);
}

export function registerMediaHandlers(io: TypedServer, socket: TypedSocket): void {
  // ── SET MEDIA SOURCE (host-only) ─────────────────
  socket.on('media-set-source', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    if (!assertHost(socket)) {
      socket.emit('room-error', { message: 'Only the host can control media' });
      return;
    }

    const { source, type } = data;
    roomManager.updateMediaState(roomId, {
      source,
      type,
      isPlaying: false,
      currentTime: 0,
      playbackSpeed: 1,
    });

    io.to(roomId).emit('media-source-set', { source, type, userId: socket.data.userId });
    logger.info('Media source changed', { roomId, type, source: source.slice(0, 100) });
  });

  // ── MEDIA PLAY (host-only) ───────────────────────
  socket.on('media-play', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !assertHost(socket)) return;

    roomManager.updateMediaState(roomId, { isPlaying: true, currentTime: data.currentTime });
    socket.to(roomId).emit('media-play', { currentTime: data.currentTime, userId: socket.data.userId });
    logger.debug('Media play', { roomId, currentTime: data.currentTime });
  });

  // ── MEDIA PAUSE (host-only) ──────────────────────
  socket.on('media-pause', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !assertHost(socket)) return;

    roomManager.updateMediaState(roomId, { isPlaying: false, currentTime: data.currentTime });
    socket.to(roomId).emit('media-pause', { currentTime: data.currentTime, userId: socket.data.userId });
    logger.debug('Media pause', { roomId, currentTime: data.currentTime });
  });

  // ── MEDIA SEEK (host-only) ───────────────────────
  socket.on('media-seek', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !assertHost(socket)) return;

    roomManager.updateMediaState(roomId, { currentTime: data.currentTime });
    socket.to(roomId).emit('media-seek', { currentTime: data.currentTime, userId: socket.data.userId });
    logger.debug('Media seek', { roomId, currentTime: data.currentTime });
  });

  // ── MEDIA SPEED CHANGE (host-only) ──────────────
  socket.on('media-speed-change', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !assertHost(socket)) return;

    roomManager.updateMediaState(roomId, { playbackSpeed: data.speed });
    socket.to(roomId).emit('media-speed-change', { speed: data.speed, userId: socket.data.userId });
    logger.debug('Media speed changed', { roomId, speed: data.speed });
  });

  // ── MEDIA TIME SYNC (host sends every ~3s) ──────
  socket.on('media-time-sync', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !assertHost(socket)) return;

    roomManager.updateMediaState(roomId, { currentTime: data.currentTime, isPlaying: data.isPlaying });
    socket.to(roomId).emit('time-sync', {
      currentTime: data.currentTime,
      isPlaying: data.isPlaying,
      timestamp: data.timestamp,
    });
  });

  // ── REQUEST SYNC (late joiner requests state) ───
  socket.on('request-sync', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = roomManager.getRoom(roomId);
    if (!room) return;

    socket.emit('media-state-sync', {
      source: room.mediaState.source,
      type: room.mediaState.type,
      isPlaying: room.mediaState.isPlaying,
      currentTime: room.mediaState.currentTime,
      playbackSpeed: room.mediaState.playbackSpeed,
      timestamp: Date.now(),
    });
  });

  // ── SUBTITLE CHANGE (host-only) ─────────────────
  socket.on('subtitle-state-change', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !assertHost(socket)) return;

    const subtitleState: SubtitleState = {
      enabled: data.enabled ?? false,
      trackUrl: data.trackUrl ?? '',
      language: data.language ?? 'en',
      fontSize: data.fontSize ?? 16,
      bgOpacity: data.bgOpacity ?? 0.75,
      offset: data.offset ?? 0,
    };

    roomManager.updateSubtitleState(roomId, subtitleState);
    io.to(roomId).emit('subtitle-state-changed', subtitleState);
    logger.debug('Subtitle state changed', { roomId });
  });
}
