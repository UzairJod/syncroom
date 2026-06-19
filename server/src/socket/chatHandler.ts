import type { Server, Socket } from 'socket.io';
import DOMPurify from 'isomorphic-dompurify';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/events.js';
import { roomManager } from '../managers/RoomManager.js';
import { RateLimiter } from '../managers/RateLimiter.js';
import { generateMessageId } from '../utils/id.js';
import { logger } from '../utils/logger.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// 5 messages per 5 seconds per socket
const chatLimiter = new RateLimiter(5, 5, 5000);

/** Strip HTML tags and trim content */
function sanitizeContent(content: string): string {
  const cleaned = DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return cleaned.trim().slice(0, 500);
}

export function registerChatHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('send-message', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId || !socket.data.userId) {
      socket.emit('room-error', { message: 'You are not in a room' });
      return;
    }

    const content = data?.content;
    if (!content || typeof content !== 'string') {
      socket.emit('room-error', { message: 'Invalid message' });
      return;
    }

    // Rate limit
    if (!chatLimiter.consume(socket.id)) {
      socket.emit('room-error', { message: 'Sending messages too fast. Please slow down.' });
      return;
    }

    // Sanitize
    const sanitized = sanitizeContent(content);
    if (!sanitized) {
      return;
    }

    const now = Date.now();
    const message = {
      id: generateMessageId(),
      userId: socket.data.userId,
      displayName: socket.data.displayName ?? 'Unknown',
      content: sanitized,
      timestamp: new Date(),
      type: 'user' as const,
    };

    // Store in room history
    roomManager.addChatMessage(roomId, message);

    // Broadcast to everyone in the room (including sender)
    io.to(roomId).emit('new-message', {
      id: message.id,
      userId: message.userId,
      displayName: message.displayName,
      content: message.content,
      timestamp: now,
      type: message.type,
    });

    logger.debug('Chat message sent', { roomId, userId: socket.data.userId, length: sanitized.length });
  });

  // Cleanup rate limiter on disconnect
  socket.on('disconnect', () => {
    chatLimiter.cleanup(socket.id);
  });
}
