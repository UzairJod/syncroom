import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/events.js';
import type { User } from '../types/room.js';
import { roomManager } from '../managers/RoomManager.js';
import { generateRoomId, generateUserId, generateMessageId } from '../utils/id.js';
import { logger } from '../utils/logger.js';
import { joinRoomSchema, validateEvent } from './validators.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {
  // ── JOIN ROOM ────────────────────────────────────
  socket.on('join-room', (data) => {
    const validation = validateEvent(joinRoomSchema, data);
    if ('error' in validation) {
      socket.emit('room-error', { message: validation.error });
      return;
    }

    const { roomId, displayName } = validation.data;

    // Prevent joining multiple rooms
    if (socket.data.roomId) {
      socket.emit('room-error', { message: 'Already in a room. Leave current room first.' });
      return;
    }

    const userId = generateUserId();
    const user: User = {
      id: userId,
      socketId: socket.id,
      displayName,
      isHost: false,
      joinedAt: new Date(),
    };

    const result = roomManager.joinRoom(roomId, user);

    if (!result.success) {
      socket.emit('room-error', { message: result.error ?? 'Failed to join room' });
      return;
    }

    // Store user data on socket
    socket.data.userId = userId;
    socket.data.displayName = user.displayName;
    socket.data.roomId = roomId;
    socket.data.inVoice = false;

    // Join the Socket.IO room
    socket.join(roomId);

    // Get full room state for the joiner
    const roomState = roomManager.getRoomState(roomId);
    if (!roomState) {
      socket.emit('room-error', { message: 'Room state unavailable' });
      return;
    }

    // Send room state to the joining user (serialize dates to epoch ms)
    socket.emit('room-state', {
      id: roomState.id,
      users: roomState.users.map((u) => ({
        id: u.id,
        socketId: u.socketId,
        displayName: u.displayName,
        isHost: u.isHost,
        joinedAt: u.joinedAt instanceof Date ? u.joinedAt.getTime() : u.joinedAt,
      })),
      hostId: roomState.hostId,
      screenShare: roomState.screenShareState,
    });

    // Send chat history (serialize timestamps)
    socket.emit('chat-history', {
      messages: roomState.chatHistory.map((m) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.displayName,
        content: m.content,
        timestamp: m.timestamp instanceof Date ? m.timestamp.getTime() : m.timestamp,
        type: m.type,
      })),
    });

    // Send current media state
    socket.emit('media-state-sync', {
      source: roomState.mediaState.source,
      type: roomState.mediaState.type,
      isPlaying: roomState.mediaState.isPlaying,
      currentTime: roomState.mediaState.currentTime,
      playbackSpeed: roomState.mediaState.playbackSpeed,
      timestamp: Date.now(),
    });

    // Send current subtitle state
    socket.emit('subtitle-state-changed', roomState.subtitleState);

    // Broadcast user-joined to everyone else in the room
    socket.to(roomId).emit('user-joined', {
      id: user.id,
      socketId: user.socketId,
      displayName: user.displayName,
      isHost: user.isHost,
      joinedAt: user.joinedAt.getTime(),
    });

    // Add system message for the join
    const systemMessage = {
      id: generateMessageId(),
      userId: 'system',
      displayName: 'System',
      content: `${user.displayName} joined the room`,
      timestamp: new Date(),
      type: 'system' as const,
    };
    roomManager.addChatMessage(roomId, systemMessage);
    io.to(roomId).emit('new-message', {
      id: systemMessage.id,
      userId: systemMessage.userId,
      displayName: systemMessage.displayName,
      content: systemMessage.content,
      timestamp: systemMessage.timestamp.getTime(),
      type: systemMessage.type,
    });

    logger.info('User joined room via socket', { roomId, userId, displayName: user.displayName });
  });

  // ── LEAVE ROOM ───────────────────────────────────
  socket.on('leave-room', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !socket.data.userId) return;

    handleLeaveRoom(io, socket, roomId);
  });
}

/** Shared leave/disconnect logic */
export function handleLeaveRoom(io: TypedServer, socket: TypedSocket, roomId: string): void {
  const userId = socket.data.userId;
  if (!userId) return;

  const displayName = socket.data.displayName ?? 'Unknown';
  const room = roomManager.getRoom(roomId);

  // Stop screen share if the leaving user was sharing
  if (room?.screenShareState.active && room.screenShareState.sharerId === userId) {
    room.screenShareState = { active: false, sharerId: null, sharerName: null };
    io.to(roomId).emit('screen-share-stopped', { userId });
  }

  const result = roomManager.leaveRoom(roomId, userId);

  // Leave the Socket.IO room
  socket.leave(roomId);

  // Clear socket data
  socket.data.roomId = null;
  socket.data.userId = '';
  socket.data.displayName = '';
  socket.data.inVoice = false;

  // Broadcast user-left
  io.to(roomId).emit('user-left', { userId });

  // Add system message for the leave
  const systemMessage = {
    id: generateMessageId(),
    userId: 'system',
    displayName: 'System',
    content: `${displayName} left the room`,
    timestamp: new Date(),
    type: 'system' as const,
  };
  roomManager.addChatMessage(roomId, systemMessage);
  io.to(roomId).emit('new-message', {
    id: systemMessage.id,
    userId: systemMessage.userId,
    displayName: systemMessage.displayName,
    content: systemMessage.content,
    timestamp: systemMessage.timestamp.getTime(),
    type: systemMessage.type,
  });

  // If host changed, broadcast
  if (result.newHostId && result.room) {
    const newHost = result.room.users.get(result.newHostId);
    if (newHost) {
      io.to(roomId).emit('host-changed', { newHostId: result.newHostId });

      // System message for host change
      const hostMessage = {
        id: generateMessageId(),
        userId: 'system',
        displayName: 'System',
        content: `${newHost.displayName} is now the host`,
        timestamp: new Date(),
        type: 'system' as const,
      };
      roomManager.addChatMessage(roomId, hostMessage);
      io.to(roomId).emit('new-message', {
        id: hostMessage.id,
        userId: hostMessage.userId,
        displayName: hostMessage.displayName,
        content: hostMessage.content,
        timestamp: hostMessage.timestamp.getTime(),
        type: hostMessage.type,
      });
    }
  }

  logger.info('User left room', { roomId, userId, displayName });
}
