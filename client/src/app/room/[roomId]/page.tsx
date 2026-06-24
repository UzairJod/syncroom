'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useRoom } from '@/hooks/useRoom';
import { useChat } from '@/hooks/useChat';
import { useMediaSync } from '@/hooks/useMediaSync';
import { useScreenShare } from '@/hooks/useScreenShare';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useRoomStore } from '@/store/useRoomStore';
import { useUIStore } from '@/store/useUIStore';
import RoomHeader from '@/components/room/RoomHeader';
import RoomToolbar from '@/components/room/RoomToolbar';
import MediaPlayer from '@/components/room/MediaPlayer';
import MediaSourceModal from '@/components/room/MediaSourceModal';
import Sidebar from '@/components/layout/Sidebar';
import MobileDrawer from '@/components/layout/MobileDrawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [displayName, setDisplayName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const { socket, isConnected } = useSocket();
  const { joinRoom, leaveRoom } = useRoom();
  useChat(true);
  useMediaSync(true);
  useScreenShare(true);
  const { isMobile } = useMediaQuery();
  const localUser = useRoomStore((s) => s.localUser);
  const isFullscreen = useUIStore((s) => s.isFullscreen);
  const showControls = useUIStore((s) => s.showControls);
  const setShowControls = useUIStore((s) => s.setShowControls);

  // Listen for successful join
  useEffect(() => {
    if (localUser && !hasJoined) {
      setHasJoined(true);
      setIsJoining(false);
    }
  }, [localUser, hasJoined]);

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (!isFullscreen || !showControls) return;
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isFullscreen, showControls, setShowControls]);

  const handleInteraction = () => {
    if (isFullscreen) {
      setShowControls(true);
    }
  };

  // Listen for room errors
  useEffect(() => {
    if (!socket) return;
    const handleError = (data: { message: string }) => {
      setError(data.message);
      setIsJoining(false);
    };
    socket.on('room-error', handleError);
    return () => { socket.off('room-error', handleError); };
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasJoined) leaveRoom();
    };
  }, [hasJoined, leaveRoom]);

  const handleJoin = () => {
    const name = displayName.trim();
    if (!name) {
      setError('Please enter a display name');
      return;
    }
    if (name.length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }
    setError('');
    setIsJoining(true);
    joinRoom(roomId, name);
  };

  // === Join Gate ===
  if (!hasJoined) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 relative">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary" />
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-accent-purple/10 rounded-full blur-[100px] animate-orb-1" />
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent-blue/10 rounded-full blur-[100px] animate-orb-2" />
        </div>

        <div className="w-full max-w-md animate-slide-up">
          <div className="bg-bg-secondary/80 backdrop-blur-xl border border-border-glass rounded-2xl p-8 shadow-2xl shadow-black/50">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                SyncRoom
              </span>
            </div>

            <h2 className="text-lg font-semibold text-text-primary text-center mb-1">Join Room</h2>
            <p className="text-sm text-text-muted text-center mb-6">
              Room: <span className="font-mono text-text-secondary">{roomId}</span>
            </p>

            <div className="space-y-4">
              <Input
                label="Display Name"
                placeholder="Enter your name..."
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                error={error}
                maxLength={20}
                autoFocus
              />

              <Button
                onClick={handleJoin}
                loading={isJoining}
                disabled={!isConnected}
                className="w-full"
                size="lg"
              >
                {!isConnected ? 'Connecting...' : 'Join Room'}
              </Button>

              {!isConnected && (
                <p className="text-xs text-yellow-400 text-center">
                  Connecting to server...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === Room View ===
  return (
    <div
      className={`h-dvh flex flex-col bg-bg-primary overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
    >
      <div className={`${isFullscreen ? 'hidden' : 'block'}`}>
        <RoomHeader />
      </div>

      <div className="flex-1 flex overflow-hidden relative bg-black">
        {/* Main content */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isFullscreen ? 'p-0' : 'p-4'}`}>
          <div className="flex-1 flex items-center justify-center">
            <div className={`w-full flex items-center justify-center ${isFullscreen ? 'h-full max-w-none' : 'max-w-5xl'}`}>
              <MediaPlayer />
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        {!isMobile && <Sidebar />}
      </div>

      <div
        className={`${
          isFullscreen
            ? `absolute bottom-0 left-0 right-0 z-50 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`
            : 'block'
        }`}
      >
        <RoomToolbar />
      </div>

      {/* Mobile drawer */}
      {isMobile && <MobileDrawer />}

      {/* Media source modal */}
      <MediaSourceModal />
    </div>
  );
}
