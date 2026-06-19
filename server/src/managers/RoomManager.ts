import type { Room, User, ChatMessage, MediaState, SubtitleState, RoomState } from '../types/room.js';
import { generateRoomId } from '../utils/id.js';
import { logger } from '../utils/logger.js';

const STALE_ROOM_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;     // 5 minutes
const MAX_CHAT_HISTORY = 200;

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanup();
  }

  /** Create a new room with a unique ID */
  createRoom(preferredId?: string): Room {
    let roomId = preferredId ?? generateRoomId();

    // Ensure unique ID
    let attempts = 0;
    while (this.rooms.has(roomId) && attempts < 10) {
      roomId = generateRoomId();
      attempts++;
    }

    if (this.rooms.has(roomId)) {
      throw new Error('Failed to generate unique room ID');
    }

    const now = new Date();
    const room: Room = {
      id: roomId,
      users: new Map(),
      hostId: '',
      chatHistory: [],
      mediaState: {
        source: '',
        type: 'none',
        isPlaying: false,
        currentTime: 0,
        playbackSpeed: 1,
        lastSyncAt: now,
      },
      subtitleState: {
        enabled: false,
        trackUrl: '',
        language: 'en',
        fontSize: 16,
        bgOpacity: 0.8,
        offset: 0,
      },
      screenShareState: {
        active: false,
        sharerId: null,
        sharerName: null,
      },
      createdAt: now,
      lastActivity: now,
    };

    this.rooms.set(roomId, room);
    logger.info('Room created', { roomId });
    return room;
  }

  /** Get a room by ID */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /** Join a user to a room */
  joinRoom(roomId: string, user: User): { success: boolean; error?: string; room?: Room } {
    let room = this.rooms.get(roomId);

    if (!room) {
      // Auto-create room if it doesn't exist (allows joining via link)
      room = this.createRoom(roomId);
    }

    // Validate display name: non-empty, max 20 chars
    const trimmedName = user.displayName.trim();
    if (!trimmedName || trimmedName.length === 0) {
      return { success: false, error: 'Display name cannot be empty' };
    }
    if (trimmedName.length > 20) {
      return { success: false, error: 'Display name must be 20 characters or less' };
    }

    // Check for duplicate display names in the room
    for (const [, existingUser] of room.users) {
      if (existingUser.displayName.toLowerCase() === trimmedName.toLowerCase()) {
        return { success: false, error: 'Display name is already taken in this room' };
      }
    }

    // Update the user's display name to the trimmed version
    user.displayName = trimmedName;

    // If room has no host (first user), make this user the host
    if (room.users.size === 0 || !room.hostId) {
      user.isHost = true;
      room.hostId = user.id;
    }

    room.users.set(user.id, user);
    room.lastActivity = new Date();

    logger.info('User joined room', { roomId, userId: user.id, displayName: user.displayName });
    return { success: true, room };
  }

  /** Remove a user from a room. Returns the room (if it still exists) and new host ID if host changed. */
  leaveRoom(roomId: string, userId: string): { room?: Room; newHostId?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return {};

    const leavingUser = room.users.get(userId);
    if (!leavingUser) return { room };

    room.users.delete(userId);
    room.lastActivity = new Date();

    logger.info('User left room', { roomId, userId, displayName: leavingUser.displayName });

    // If room is now empty, keep it around (cleanup will handle stale rooms)
    if (room.users.size === 0) {
      room.hostId = '';
      // Clear screen share if sharer left
      if (room.screenShareState.active) {
        room.screenShareState = { active: false, sharerId: null, sharerName: null };
      }
      return { room };
    }

    // If the leaving user was the host, reassign to the oldest user
    let newHostId: string | undefined;
    if (leavingUser.isHost || room.hostId === userId) {
      let oldestUser: User | null = null;
      for (const [, u] of room.users) {
        if (!oldestUser || u.joinedAt < oldestUser.joinedAt) {
          oldestUser = u;
        }
      }

      if (oldestUser) {
        oldestUser.isHost = true;
        room.hostId = oldestUser.id;
        newHostId = oldestUser.id;
        logger.info('Host reassigned', { roomId, newHostId, newHostName: oldestUser.displayName });
      }
    }

    // Clear screen share if the sharer left
    if (room.screenShareState.active && room.screenShareState.sharerId === userId) {
      room.screenShareState = { active: false, sharerId: null, sharerName: null };
    }

    return { room, newHostId };
  }

  /** Update media state for a room */
  updateMediaState(roomId: string, state: Partial<MediaState>): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.mediaState = { ...room.mediaState, ...state, lastSyncAt: new Date() };
    room.lastActivity = new Date();
  }

  /** Update subtitle state for a room */
  updateSubtitleState(roomId: string, state: SubtitleState): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.subtitleState = state;
    room.lastActivity = new Date();
  }

  /** Add a chat message to a room's history */
  addChatMessage(roomId: string, message: ChatMessage): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.chatHistory.push(message);

    // Keep chat history bounded
    if (room.chatHistory.length > MAX_CHAT_HISTORY) {
      room.chatHistory = room.chatHistory.slice(-MAX_CHAT_HISTORY);
    }

    room.lastActivity = new Date();
  }

  /** Get the serializable room state (for sending to clients) */
  getRoomState(roomId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      users: Array.from(room.users.values()),
      hostId: room.hostId,
      chatHistory: room.chatHistory,
      mediaState: room.mediaState,
      subtitleState: room.subtitleState,
      screenShareState: room.screenShareState,
      createdAt: room.createdAt.toISOString(),
      lastActivity: room.lastActivity.toISOString(),
    };
  }

  /** Find user ID by socket ID in a specific room */
  findUserBySocketId(roomId: string, socketId: string): User | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    for (const [, user] of room.users) {
      if (user.socketId === socketId) {
        return user;
      }
    }
    return undefined;
  }

  /** Check if a user is the host of a room */
  isHost(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    return room.hostId === userId;
  }

  /** Get the total number of active rooms */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /** Clean up rooms that have been inactive for more than 1 hour and have no users */
  cleanupStaleRooms(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [roomId, room] of this.rooms) {
      const inactiveMs = now - room.lastActivity.getTime();
      if (inactiveMs > STALE_ROOM_TIMEOUT_MS && room.users.size === 0) {
        this.rooms.delete(roomId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Stale rooms cleaned up', { cleaned, remaining: this.rooms.size });
    }
  }

  /** Start the periodic cleanup interval */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleRooms();
    }, CLEANUP_INTERVAL_MS);

    // Allow the process to exit even if the timer is running
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /** Stop the periodic cleanup (for graceful shutdown) */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /** Destroy all rooms (for graceful shutdown) */
  destroy(): void {
    this.stopCleanup();
    this.rooms.clear();
    logger.info('RoomManager destroyed');
  }
}

/** Singleton instance */
export const roomManager = new RoomManager();
