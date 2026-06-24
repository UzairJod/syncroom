'use client';

import { useRoomStore } from '@/store/useRoomStore';
import { useUIStore } from '@/store/useUIStore';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useScreenShare } from '@/hooks/useScreenShare';
import Button from '@/components/ui/Button';

export default function RoomToolbar() {
  const isHost = useRoomStore((s) => s.isHost);
  const { toggleMediaModal, toggleFullscreen, isFullscreen, sidebarOpen, setSidebarOpen } = useUIStore();
  const { joinVoice, leaveVoice, toggleMute, isInVoice, isMuted } = useVoiceChat();
  const { startScreenShare, stopScreenShare, isScreenSharing } = useScreenShare();

  const handleLeaveRoom = () => {
    window.location.href = '/';
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      toggleFullscreen();
    } else {
      document.exitFullscreen();
      toggleFullscreen();
    }
  };

  return (
    <div className="flex items-center justify-start sm:justify-center gap-2 px-4 py-3 bg-bg-glass backdrop-blur-xl border-t border-border-glass overflow-x-auto [&::-webkit-scrollbar]:hidden">
      {/* Mobile Chat Toggle */}
      <div className="sm:hidden">
        <Button
          variant={sidebarOpen ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          }
        >
          <span className="hidden sm:inline">Chat</span>
        </Button>
      </div>

      {/* Voice Controls */}
      <Button
        variant={isInVoice ? 'secondary' : 'primary'}
        size="sm"
        onClick={isInVoice ? leaveVoice : joinVoice}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isInVoice ? (
              <>
                <path d="M1 1l22 22" />
                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .88-.16 1.73-.46 2.5" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </>
            ) : (
              <>
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </>
            )}
          </svg>
        }
      >
        <span className="hidden sm:inline">{isInVoice ? 'Leave Voice' : 'Join Voice'}</span>
      </Button>

      {isInVoice && (
        <Button
          variant={isMuted ? 'danger' : 'secondary'}
          size="sm"
          iconOnly
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMuted ? (
                <>
                  <path d="M1 1l22 22" />
                  <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                  <path d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .88-.16 1.73-.46 2.5" />
                </>
              ) : (
                <>
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                </>
              )}
            </svg>
          }
        />
      )}

      <div className="h-6 w-px bg-border-glass mx-1" />

      {/* Screen Share (host only) */}
      {isHost() && (
        <Button
          variant={isScreenSharing ? 'danger' : 'secondary'}
          size="sm"
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          }
        >
          <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
        </Button>
      )}

      {/* Set Media (host only) */}
      {isHost() && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toggleMediaModal()}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
              <line x1="17" y1="17" x2="22" y2="17" />
            </svg>
          }
        >
          <span className="hidden sm:inline">Set Media</span>
        </Button>
      )}

      <div className="h-6 w-px bg-border-glass mx-1" />

      {/* Fullscreen */}
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={handleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isFullscreen ? (
              <>
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              </>
            ) : (
              <>
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
              </>
            )}
          </svg>
        }
      />

      {/* Leave Room */}
      <Button variant="danger" size="sm" onClick={handleLeaveRoom} icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      }>
        <span className="hidden sm:inline">Leave</span>
      </Button>
    </div>
  );
}
