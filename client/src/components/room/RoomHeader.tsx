'use client';

import { useRoomStore } from '@/store/useRoomStore';
import { useUIStore } from '@/store/useUIStore';
import { copyToClipboard } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

export default function RoomHeader() {
  const { roomId, users, isConnected } = useRoomStore();
  const isHost = useRoomStore((s) => s.isHost);
  const addToast = useUIStore((s) => s.addToast);

  const handleCopyLink = async () => {
    const url = window.location.href;
    const success = await copyToClipboard(url);
    addToast({
      type: success ? 'success' : 'error',
      message: success ? 'Invite link copied!' : 'Failed to copy link',
    });
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-bg-glass backdrop-blur-xl border-b border-border-glass">
      {/* Left: Logo + Room ID */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="font-bold text-text-primary hidden sm:inline">SyncRoom</span>
        </div>
        <div className="h-5 w-px bg-border-glass hidden sm:block" />
        <span className="text-sm text-text-secondary font-mono">{roomId}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {isHost() && <Badge variant="host">♛ Host</Badge>}

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-primary bg-white/5 hover:bg-white/10 border border-border-glass rounded-lg transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          <span className="hidden sm:inline">Copy Link</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-secondary bg-white/5 rounded-lg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          {users.length}
        </div>

        {/* Connection status */}
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-green-400/50 shadow-sm' : 'bg-red-400 shadow-red-400/50 shadow-sm animate-pulse'}`} />
      </div>
    </header>
  );
}
