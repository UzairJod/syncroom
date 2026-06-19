'use client';

import { useState, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useUIStore } from '@/store/useUIStore';
import { MAX_MESSAGE_LENGTH } from '@/lib/constants';
import EmojiPicker from './EmojiPicker';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChat();
  const addToast = useUIStore((s) => s.addToast);

  const handleSend = () => {
    if (!message.trim()) return;
    const result = sendMessage(message);
    if (result.success) {
      setMessage('');
    } else if (result.error) {
      addToast({ type: 'error', message: result.error });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
    setShowEmoji(false);
  };

  return (
    <div className="relative px-3 py-2 border-t border-border-glass">
      {showEmoji && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmoji(false)}
        />
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="shrink-0 text-text-muted hover:text-text-primary transition-colors text-lg"
          title="Emoji"
        >
          😊
        </button>

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          maxLength={MAX_MESSAGE_LENGTH}
          className="flex-1 bg-white/5 border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue/40 transition-all"
        />

        {message.length > MAX_MESSAGE_LENGTH - 50 && (
          <span className={`text-[10px] shrink-0 ${message.length >= MAX_MESSAGE_LENGTH ? 'text-red-400' : 'text-text-muted'}`}>
            {message.length}/{MAX_MESSAGE_LENGTH}
          </span>
        )}

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-r from-accent-blue to-accent-purple flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
