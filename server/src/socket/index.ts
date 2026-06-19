import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/events.js';
import { registerRoomHandlers, handleLeaveRoom } from './roomHandler.js';
import { registerChatHandlers } from './chatHandler.js';
import { registerMediaHandlers } from './mediaHandler.js';
import { registerSignalingHandlers } from './signalingHandler.js';
import { logger } from '../utils/logger.js';

export type TypedIOServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function createSocketServer(httpServer: HTTPServer): TypedIOServer {
  const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: clientUrl.split(',').map((u) => u.trim()),
        methods: ['GET', 'POST'],
        credentials: true,
      },
      maxHttpBufferSize: 1e6, // 1MB max payload
      pingTimeout: 30000,
      pingInterval: 25000,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      },
    },
  );

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    // Initialize socket data
    socket.data.userId = '';
    socket.data.displayName = '';
    socket.data.roomId = null;
    socket.data.inVoice = false;

    // Register all event handlers
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerMediaHandlers(io, socket);
    registerSignalingHandlers(io, socket);

    // ── DISCONNECT ────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, reason });

      const roomId = socket.data.roomId;
      if (roomId) {
        // Handle voice leave if in voice
        if (socket.data.inVoice && socket.data.userId) {
          socket.to(roomId).emit('voice-user-left', {
            userId: socket.data.userId,
          });
        }

        // Handle room leave (also cleans up screen share)
        handleLeaveRoom(io, socket, roomId);
      }
    });
  });

  logger.info('Socket.IO server created', { corsOrigin: clientUrl });

  return io;
}
