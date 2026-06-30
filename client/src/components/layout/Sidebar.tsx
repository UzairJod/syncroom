'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';
import ChatPanel from '@/components/chat/ChatPanel';
import ParticipantList from '@/components/participants/ParticipantList';

export default function Sidebar() {
  const { sidebarOpen, sidebarTab, setSidebarTab, setSidebarOpen, toggleSidebar } = useUIStore();

  // Auto-open sidebar on desktop mount
  useEffect(() => {
    setSidebarOpen(true);
  }, [setSidebarOpen]);

  return (
    <>
      {/* Sidebar panel */}
      <aside
        className={`
          relative z-30
          bg-bg-glass backdrop-blur-xl border-border-glass
          flex flex-col transition-all duration-300 ease-in-out
          
          /* Mobile Portrait (Default) */
          w-full flex-1 border-t
          
          /* Landscape & Desktop Base */
          landscape:flex-none landscape:h-[100dvh] landscape:border-t-0 landscape:border-l
          md:flex-none md:h-full md:border-t-0 md:border-l
          
          /* State logic */
          ${sidebarOpen 
            ? 'landscape:w-[40vw] landscape:max-w-[350px] md:w-[300px] lg:w-[350px]' 
            : 'landscape:w-0 md:w-0'
          }
        `}
      >
        {/* Toggle button (hidden on mobile portrait, visible on all landscape/tablet/desktop screens) */}
        <button
          onClick={toggleSidebar}
          className="hidden landscape:flex md:flex absolute top-1/2 -left-6 -translate-y-1/2 w-6 h-12 bg-bg-glass backdrop-blur-xl border border-border-glass border-r-0 rounded-l-lg items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {sidebarOpen ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>

        {/* Inner Content Container */}
        <div className={`flex flex-col w-full h-full transition-opacity duration-300 ${!sidebarOpen ? 'landscape:opacity-0 landscape:overflow-hidden md:opacity-0 md:overflow-hidden' : 'opacity-100'}`}>
        {/* Tabs */}
        <div className="flex border-b border-border-glass shrink-0">
          {(['chat', 'participants'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`
                flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200
                ${sidebarTab === tab
                  ? 'text-accent-blue border-b-2 border-accent-blue'
                  : 'text-text-muted hover:text-text-secondary'}
              `}
            >
              {tab === 'chat' ? '💬 Chat' : '👥 Users'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {sidebarTab === 'chat' ? <ChatPanel /> : <ParticipantList />}
        </div>
        </div>
      </aside>
    </>
  );
}
