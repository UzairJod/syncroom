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
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-bg-primary/95 backdrop-blur-xl border-b border-border-glass safe-area-top shadow-sm z-50">
      {/* Left: Logo + Room ID */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-md shadow-accent-purple/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="hidden sm:flex items-baseline gap-1.5">
            <span className="font-bold tracking-tight text-text-primary">SyncRoom</span>
            <span className="text-[10px] text-text-muted font-medium tracking-wide">by Uzair</span>
          </div>
        </div>
        <div className="h-4 w-[1px] bg-border-glass hidden sm:block" />
        <span className="text-xs sm:text-sm font-medium text-text-secondary font-mono tracking-wide max-w-[100px] sm:max-w-none truncate">{roomId}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {isHost() && <Badge variant="host">♛ Host</Badge>}

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-primary bg-bg-tertiary hover:bg-white/10 border border-border-glass rounded-full transition-all duration-200 shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          <span className="hidden sm:inline">Copy Link</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary bg-bg-tertiary border border-border-glass rounded-full shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          {users.length}
        </div>

        {/* Connection status */}
        <div className={`w-2.5 h-2.5 rounded-full ml-1 ${isConnected ? 'bg-accent-green shadow-[0_0_8px_rgba(34,211,167,0.6)]' : 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'}`} />
      </div>
    </header>
  );
}
