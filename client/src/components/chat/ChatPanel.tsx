'use client';

import { useRef, useEffect, useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatPanel() {
  const { messages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasNewMessages(false);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    } else {
      setHasNewMessages(true);
    }
  }, [messages, autoScroll]);

  // Detect scroll position
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setAutoScroll(isAtBottom);
    if (isAtBottom) setHasNewMessages(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-text-muted text-sm">No messages yet</p>
            <p className="text-text-muted text-xs mt-1">Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* New messages indicator */}
      {hasNewMessages && (
        <button
          onClick={scrollToBottom}
          className="mx-3 mb-2 py-1.5 text-xs font-medium text-accent-blue bg-accent-blue/10 border border-accent-blue/20 rounded-lg hover:bg-accent-blue/15 transition-colors text-center"
        >
          ↓ New messages
        </button>
      )}

      {/* Input */}
      <ChatInput />
    </div>
  );
}
