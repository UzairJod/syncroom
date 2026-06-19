import { nanoid, customAlphabet } from 'nanoid';

const ROOM_ID_LENGTH = 6;
const ROOM_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const generateRoomIdFn = customAlphabet(ROOM_ID_ALPHABET, ROOM_ID_LENGTH);

/** Generate a 6-character alphanumeric room ID */
export function generateRoomId(): string {
  return generateRoomIdFn();
}

/** Generate a unique message ID (21 chars, default nanoid) */
export function generateMessageId(): string {
  return nanoid();
}

/** Generate a unique user ID (21 chars, default nanoid) */
export function generateUserId(): string {
  return nanoid();
}
