'use client';

import { useUIStore } from '@/store/useUIStore';
import ChatPanel from '@/components/chat/ChatPanel';
import ParticipantList from '@/components/participants/ParticipantList';

export default function Sidebar() {
  const { sidebarOpen, sidebarTab, setSidebarTab, toggleSidebar } = useUIStore();

  return (
    <>
      {/* Toggle button (always visible) */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -translate-y-1/2 right-0 z-30 w-6 h-12 bg-bg-glass backdrop-blur-xl border border-border-glass border-r-0 rounded-l-lg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors lg:hidden"
        style={{ right: sidebarOpen ? '350px' : '0' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {sidebarOpen ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
        </svg>
      </button>

      {/* Sidebar panel */}
      <aside
        className={`
          h-full bg-bg-glass backdrop-blur-xl border-l border-border-glass
          flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-[350px]' : 'w-0 overflow-hidden'}
        `}
      >
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
      </aside>
    </>
  );
}
