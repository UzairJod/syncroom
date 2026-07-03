'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaStore } from '@/store/useMediaStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useMediaSync } from '@/hooks/useMediaSync';
import { useUIStore } from '@/store/useUIStore';
import Button from '@/components/ui/Button';

// Utility to format seconds to mm:ss or hh:mm:ss
const formatTime = (seconds: number) => {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function MediaControlsOverlay() {
  const { 
    mediaSource, isPlaying, currentTime, duration, 
    volume, isMuted, playbackSpeed, 
    setPlayState, setVolume, setIsMuted, setPlaybackSpeed 
  } = useMediaStore();
  const isHost = useRoomStore((s) => s.isHost);
  const { play, pause, seek, setSpeed } = useMediaSync();
  const { isFullscreen, toggleFullscreen, toggleMediaModal } = useUIStore();
  
  const [isVisible, setIsVisible] = useState(true);
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setIsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    
    // Only auto-hide if playing and not hovering timeline
    if (isPlaying && !isHoveringTimeline) {
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
  }, [isPlaying, isHoveringTimeline]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Don't render controls if no media is playing
  if (!mediaSource) return null;

  const handlePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isHost()) return;
    
    if (isPlaying) {
      pause(currentTime);
      setPlayState(false);
    } else {
      play(currentTime);
      setPlayState(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost()) return;
    const newTime = Number(e.target.value);
    seek(newTime);
    // Don't update local state here if it causes jumping, 
    // rely on the player's timeupdate to sync back to store, 
    // but for immediate feedback we could.
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (newVol > 0 && isMuted) setIsMuted(false);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleFullscreenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      if (!isFullscreen) toggleFullscreen();
    } else {
      document.exitFullscreen().catch(() => {});
      if (isFullscreen) toggleFullscreen();
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isHost()) return;
    const speed = Number(e.target.value);
    setPlaybackSpeed(speed);
    setSpeed(speed);
  };

  return (
    <div 
      className={`absolute inset-0 z-20 flex flex-col justify-end transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 cursor-none'}`}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={() => isHost() && handlePlayPause()}
    >
      {/* Gradient Background for text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Controls Container */}
      <div 
        className="relative z-30 px-4 pb-2 pt-4 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()} // Prevent clicking controls from toggling play/pause
      >
        {/* Timeline */}
        <div 
          className="flex items-center gap-3 w-full group"
          onMouseEnter={() => setIsHoveringTimeline(true)}
          onMouseLeave={() => setIsHoveringTimeline(false)}
        >
          <span className="text-xs text-white font-medium min-w-[40px] text-right drop-shadow-md">
            {formatTime(currentTime)}
          </span>
          
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime || 0}
            onChange={handleSeek}
            disabled={!isHost()}
            className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-accent-purple hover:h-2 transition-all duration-300"
            style={{
              background: `linear-gradient(to right, #7C5CFC ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />

          <span className="text-xs text-white/80 font-medium min-w-[40px] drop-shadow-md">
            {formatTime(duration)}
          </span>
        </div>

        {/* Bottom Row Controls */}
        <div className="flex items-center justify-between">
          
          {/* Left: Play/Pause, Volume */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={handlePlayPause}
              disabled={!isHost()}
              className="text-white hover:bg-white/20"
              icon={
                isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )
              }
            />

            <div className="flex items-center gap-1 sm:gap-2 relative">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={handleToggleMute}
                className="text-white hover:bg-white/20"
                icon={
                  isMuted || volume === 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  ) : volume < 0.5 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  )
                }
              />
              <div className="w-16 sm:w-20 transition-all duration-300 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>

          {/* Right: Settings, Speed, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isHost() && (
              <select 
                value={playbackSpeed} 
                onChange={handleSpeedChange}
                className="bg-transparent text-white text-xs font-medium outline-none cursor-pointer hover:bg-white/20 rounded p-1"
              >
                <option value={0.5} className="text-black">0.5x</option>
                <option value={1} className="text-black">1.0x</option>
                <option value={1.25} className="text-black">1.25x</option>
                <option value={1.5} className="text-black">1.5x</option>
                <option value={2} className="text-black">2.0x</option>
              </select>
            )}

            {isHost() && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={() => toggleMediaModal()}
                className="text-white hover:bg-white/20"
                title="Media Settings"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                }
              />
            )}

            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={handleFullscreenClick}
              className="text-white hover:bg-white/20"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isFullscreen ? (
                    <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                  ) : (
                    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                  )}
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
