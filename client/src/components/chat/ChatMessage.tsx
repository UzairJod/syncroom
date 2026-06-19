'use client';

import type { ChatMessage as ChatMessageType } from '@/types/chat';
import { generateColor, formatTimestamp } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.type === 'system') {
    return (
      <div className="py-1 px-2 text-center">
        <span className="text-xs text-text-muted italic">{message.content}</span>
      </div>
    );
  }

  const nameColor = generateColor(message.displayName);

  return (
    <div className="group py-1 px-2 rounded-lg hover:bg-white/3 transition-colors">
      <div className="flex items-baseline gap-2">
        <span
          className="text-xs font-semibold shrink-0"
          style={{ color: nameColor }}
        >
          {message.displayName}
        </span>
        <span className="text-sm text-text-primary break-words min-w-0">{message.content}</span>
        <span className="text-[10px] text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
