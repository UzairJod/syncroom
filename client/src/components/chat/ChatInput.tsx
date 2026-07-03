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
    <div className="relative px-4 py-3 border-t border-border-glass bg-bg-secondary/80 backdrop-blur-xl safe-area-bottom z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      {showEmoji && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmoji(false)}
        />
      )}

      <div className="flex items-center gap-2 bg-bg-tertiary border border-border-glass rounded-xl p-1 shadow-inner focus-within:border-accent-purple/40 focus-within:ring-2 focus-within:ring-accent-purple/20 transition-all duration-200">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="shrink-0 w-9 h-9 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors text-lg"
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
          className="flex-1 bg-transparent border-none px-2 py-2 text-[13px] sm:text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-0"
        />

        {message.length > MAX_MESSAGE_LENGTH - 50 && (
          <span className={`text-[10px] font-medium shrink-0 mr-1 ${message.length >= MAX_MESSAGE_LENGTH ? 'text-danger' : 'text-text-muted'}`}>
            {message.length}/{MAX_MESSAGE_LENGTH}
          </span>
        )}

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-r from-accent-purple to-accent-blue flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(124,92,252,0.4)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-0.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
