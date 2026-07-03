'use client';

import type { ChatMessage as ChatMessageType } from '@/types/chat';
import { generateColor, formatTimestamp } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.type === 'system') {
    return (
      <div className="py-3 px-2 text-center w-full flex justify-center">
        <span className="text-[11px] text-text-muted font-medium bg-bg-tertiary px-3 py-1 rounded-full border border-border-glass shadow-sm">{message.content}</span>
      </div>
    );
  }

  const nameColor = generateColor(message.displayName);

  return (
    <div className="group py-1 px-2 mb-3 flex flex-col items-start w-full animate-slide-up">
      <div className="flex items-center gap-2 mb-1 w-full pl-1">
        <span
          className="text-xs font-bold tracking-wide"
          style={{ color: nameColor }}
        >
          {message.displayName}
        </span>
        <span className="text-[10px] font-medium text-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto pr-1">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
      <div className="bg-bg-tertiary border border-border-glass px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-[13px] sm:text-sm text-text-primary break-words max-w-[90%] shadow-sm leading-relaxed">
        {message.content}
      </div>
    </div>
  );
}
