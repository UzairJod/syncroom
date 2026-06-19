'use client';

import { useState } from 'react';
import { useSubtitles } from '@/hooks/useSubtitles';
import Button from '@/components/ui/Button';

export default function SubtitleControls() {
  const { subtitleState, setSubtitleEnabled, setFontSize, setBgOpacity, setOffset, loadSubtitleFile } = useSubtitles();
  const [isOpen, setIsOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadSubtitleFile(file);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={() => setIsOpen(!isOpen)}
        title="Subtitle Settings"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M7 15h4M13 15h4M7 11h2M11 11h6" />
          </svg>
        }
      />

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-bg-secondary/95 backdrop-blur-xl border border-border-glass rounded-xl shadow-2xl shadow-black/50 p-4 space-y-4 z-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Subtitles</span>
            <button
              onClick={() => setSubtitleEnabled(!subtitleState.enabled)}
              className={`w-10 h-5 rounded-full transition-colors duration-200 ${subtitleState.enabled ? 'bg-accent-blue' : 'bg-white/15'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${subtitleState.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">Upload Subtitle File (.srt, .vtt)</label>
            <input
              type="file"
              accept=".srt,.vtt"
              onChange={handleFileUpload}
              className="w-full text-xs text-text-muted file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-text-primary hover:file:bg-white/15"
            />
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">Font Size: {subtitleState.fontSize}px</label>
            <input
              type="range"
              min="8" max="32" step="1"
              value={subtitleState.fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-accent-blue"
            />
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">Background Opacity: {Math.round(subtitleState.bgOpacity * 100)}%</label>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={subtitleState.bgOpacity}
              onChange={(e) => setBgOpacity(Number(e.target.value))}
              className="w-full accent-accent-blue"
            />
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">Offset: {subtitleState.offset}s</label>
            <input
              type="range"
              min="-10" max="10" step="0.5"
              value={subtitleState.offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              className="w-full accent-accent-blue"
            />
          </div>
        </div>
      )}
    </div>
  );
}
