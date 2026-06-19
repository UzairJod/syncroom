'use client';

import { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😂', '🥹', '😍', '🤩', '😎', '🤔', '😴', '🤯', '😱', '🥳', '😤', '👀', '💀', '🔥', '✨'],
  'Hands': ['👍', '👎', '👋', '🙌', '👏', '🤝', '✌️', '🤞', '💪', '🫶', '❤️‍🔥', '🫡'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💖', '💝'],
  'Reactions': ['🎉', '🎊', '💯', '⭐', '🌟', '💫', '⚡', '🚀', '🎬', '🍿', '🎵', '🎶'],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const allEmojis = Object.entries(EMOJI_CATEGORIES);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 right-0 mb-2 bg-bg-secondary/95 backdrop-blur-xl border border-border-glass rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      <div className="p-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="w-full bg-white/5 border border-border-glass rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
        />
      </div>

      <div className="max-h-48 overflow-y-auto scrollbar-thin px-2 pb-2">
        {allEmojis.map(([category, emojis]) => (
          <div key={category}>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-1 py-1">{category}</p>
            <div className="grid grid-cols-8 gap-0.5">
              {emojis
                .filter((e) => !search || e.includes(search))
                .map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg rounded-md hover:bg-white/10 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
