'use client';

import type { User } from '@/types/room';
import { useRoomStore } from '@/store/useRoomStore';
import { useVoiceStore } from '@/store/useVoiceStore';
import { generateColor } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

interface ParticipantItemProps {
  user: User;
}

export default function ParticipantItem({ user }: ParticipantItemProps) {
  const localUser = useRoomStore((s) => s.localUser);
  const hostId = useRoomStore((s) => s.hostId);
  const voiceUsers = useVoiceStore((s) => s.voiceUsers);
  const speakingUsers = useVoiceStore((s) => s.speakingUsers);
  const isMe = localUser?.id === user.id;
  const isHost = hostId === user.id;
  const isInVoice = voiceUsers.includes(user.id);
  const isSpeaking = speakingUsers.has(user.id);

  const initials = user.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColor = generateColor(user.displayName);

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isMe ? 'bg-white/5' : 'hover:bg-white/3'}`}>
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        {isSpeaking && (
          <div className="absolute -inset-1 rounded-full border-2 border-green-400 animate-pulse" />
        )}
      </div>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-text-primary truncate">{user.displayName}</span>
          {isMe && <span className="text-[10px] text-text-muted">(you)</span>}
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-1 shrink-0">
        {isHost && <Badge variant="host">♛</Badge>}
        {isInVoice && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-green">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
          </svg>
        )}
      </div>
    </div>
  );
}
