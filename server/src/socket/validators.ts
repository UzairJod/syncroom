import { z } from 'zod';

// ──────────────────────────────────────────────────
// Room events
// ──────────────────────────────────────────────────
export const joinRoomSchema = z.object({
  roomId: z.string().min(1).max(20).trim(),
  displayName: z.string().min(1).max(20).trim(),
});

// ──────────────────────────────────────────────────
// Chat events
// ──────────────────────────────────────────────────
export const sendMessageSchema = z.object({
  roomId: z.string().min(1).max(20),
  content: z.string().min(1).max(500),
});

// ──────────────────────────────────────────────────
// Media events
// ──────────────────────────────────────────────────
export const setMediaSourceSchema = z.object({
  roomId: z.string().min(1).max(20),
  source: z.string().max(2048),
  type: z.enum(['youtube', 'video', 'none']),
});

export const mediaControlSchema = z.object({
  roomId: z.string().min(1).max(20),
  currentTime: z.number().min(0),
});

export const mediaSpeedChangeSchema = z.object({
  roomId: z.string().min(1).max(20),
  speed: z.number().min(0.25).max(4),
});

export const timeSyncSchema = z.object({
  roomId: z.string().min(1).max(20),
  currentTime: z.number().min(0),
  isPlaying: z.boolean(),
  timestamp: z.number(),
});

export const requestSyncSchema = z.object({
  roomId: z.string().min(1).max(20),
});

// ──────────────────────────────────────────────────
// Subtitle events
// ──────────────────────────────────────────────────
export const subtitleStateSchema = z.object({
  roomId: z.string().min(1).max(20),
  subtitleState: z.object({
    enabled: z.boolean(),
    trackUrl: z.string().max(2048).nullable().transform((v) => v ?? ''),
    language: z.string().max(10).default('en'),
    fontSize: z.number().min(8).max(72).default(16),
    bgOpacity: z.number().min(0).max(1).default(0.8),
    offset: z.number().min(-30).max(30).default(0),
  }).transform((s) => ({
    enabled: s.enabled,
    trackUrl: s.trackUrl,
    language: s.language,
    fontSize: s.fontSize,
    bgOpacity: s.bgOpacity,
    offset: s.offset,
  })),
});

// ──────────────────────────────────────────────────
// WebRTC signaling events
// ──────────────────────────────────────────────────
export const webrtcOfferSchema = z.object({
  targetSocketId: z.string().min(1),
  offer: z.object({
    type: z.literal('offer'),
    sdp: z.string().optional(),
  }),
});

export const webrtcAnswerSchema = z.object({
  targetSocketId: z.string().min(1),
  answer: z.object({
    type: z.literal('answer'),
    sdp: z.string().optional(),
  }),
});

export const webrtcIceCandidateSchema = z.object({
  targetSocketId: z.string().min(1),
  candidate: z.object({
    candidate: z.string().optional(),
    sdpMid: z.string().nullable().optional(),
    sdpMLineIndex: z.number().nullable().optional(),
    usernameFragment: z.string().nullable().optional(),
  }),
});

// ──────────────────────────────────────────────────
// Screen share events
// ──────────────────────────────────────────────────
export const screenShareSchema = z.object({
  roomId: z.string().min(1).max(20),
});

// ──────────────────────────────────────────────────
// Voice events
// ──────────────────────────────────────────────────
export const voiceSchema = z.object({
  roomId: z.string().min(1).max(20),
});

/**
 * Helper to validate data against a Zod schema.
 * Returns the parsed data or null if validation fails.
 */
export function validateEvent<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data };
  }
  const errorMessage = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
  return { error: errorMessage };
}
