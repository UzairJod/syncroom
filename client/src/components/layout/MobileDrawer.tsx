'use client';

import { useState, useRef, useCallback } from 'react';
import { useUIStore } from '@/store/useUIStore';
import ChatPanel from '@/components/chat/ChatPanel';
import ParticipantList from '@/components/participants/ParticipantList';

export default function MobileDrawer() {
  const { sidebarTab, setSidebarTab, sidebarOpen, setSidebarOpen } = useUIStore();
  const [height, setHeight] = useState(40); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(40);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startHeightRef.current = height;
  }, [height]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = startYRef.current - e.touches[0].clientY;
    const windowHeight = window.innerHeight;
    const deltaPercent = (diff / windowHeight) * 100;
    const newHeight = Math.min(85, Math.max(0, startHeightRef.current + deltaPercent));
    setHeight(newHeight);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (height < 20) {
      setSidebarOpen(false);
      setHeight(40); // reset for next open
    } else {
      setHeight(height > 60 ? 85 : 40);
    }
  }, [height, setSidebarOpen]);

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {height > 60 && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={() => setHeight(40)}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary/95 backdrop-blur-xl border-t border-border-glass rounded-t-2xl"
        style={{
          height: `${height}%`,
          transition: isDragging ? 'none' : 'height 0.3s ease-out',
        }}
      >
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        >
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-glass px-2">
          {(['chat', 'participants'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`
                flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-all
                ${sidebarTab === tab
                  ? 'text-accent-blue border-b-2 border-accent-blue'
                  : 'text-text-muted'}
              `}
            >
              {tab === 'chat' ? '💬 Chat' : '👥 Users'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
          {sidebarTab === 'chat' ? <ChatPanel /> : <ParticipantList />}
        </div>
      </div>
    </>
  );
}
