'use client';

import { useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useRoomStore } from '@/store/useRoomStore';
import { useChatStore } from '@/store/useChatStore';
import { useMediaStore } from '@/store/useMediaStore';
import { useUIStore } from '@/store/useUIStore';
import { useScreenShareStore } from '@/store/useScreenShareStore';
import type { User } from '@/types/room';

export function useRoom() {
  const { setRoom, addUser, removeUser, setHost, setLocalUser, users, hostId, localUser } =
    useRoomStore();
  const { setMessages } = useChatStore();
  const { setMediaSource, setPlayState, setCurrentTime, setPlaybackSpeed, setSubtitleState } =
    useMediaStore();
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    const socket = getSocket();

    socket.on('room-state', (data) => {
      setRoom(data.id, data.users, data.hostId);
      // Find the local user in the room state
      const me = data.users.find((u: User) => u.socketId === socket.id);
      if (me) {
        setLocalUser(me);
      }

      // Handle late joiner screen share
      if (data.screenShare && data.screenShare.active && data.screenShare.sharerId) {
        useScreenShareStore.getState().setSharerInfo(data.screenShare.sharerId, data.screenShare.sharerName || 'Someone');
        // Tell the host we are ready to receive the stream!
        const sharer = data.users.find((u: User) => u.id === data.screenShare!.sharerId);
        if (sharer) {
          socket.emit('ss-ready', { targetId: sharer.socketId });
        }
      }
    });

    socket.on('chat-history', (data) => {
      setMessages(data.messages);
    });

    socket.on('media-state-sync', (data) => {
      setMediaSource(data.source, data.type);
      setPlayState(data.isPlaying);
      setCurrentTime(data.currentTime);
      setPlaybackSpeed(data.playbackSpeed);
    });

    socket.on('subtitle-state-changed', (data) => {
      setSubtitleState(data);
    });

    socket.on('user-joined', (data) => {
      addUser({
        id: data.id,
        socketId: data.socketId,
        displayName: data.displayName,
        isHost: data.isHost,
        joinedAt: data.joinedAt,
      });
      addToast({ type: 'info', message: `${data.displayName} joined the room` });
    });

    socket.on('user-left', (data) => {
      const leavingUser = useRoomStore.getState().users.find((u) => u.id === data.userId);
      removeUser(data.userId);
      if (leavingUser) {
        addToast({ type: 'info', message: `${leavingUser.displayName} left the room` });
      }
    });

    socket.on('host-changed', (data) => {
      setHost(data.newHostId);
      const newHost = useRoomStore.getState().users.find((u) => u.id === data.newHostId);
      if (newHost) {
        addToast({ type: 'info', message: `${newHost.displayName} is now the host` });
      }
    });

    socket.on('room-error', (data) => {
      addToast({ type: 'error', message: data.message });
    });

    return () => {
      socket.off('room-state');
      socket.off('chat-history');
      socket.off('media-state-sync');
      socket.off('subtitle-state-changed');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('host-changed');
      socket.off('room-error');
    };
  }, [setRoom, addUser, removeUser, setHost, setLocalUser, setMessages, setMediaSource, setPlayState, setCurrentTime, setPlaybackSpeed, setSubtitleState, addToast]);

  const joinRoom = useCallback((roomId: string, displayName: string) => {
    const socket = getSocket();
    socket.emit('join-room', { roomId, displayName });
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit('leave-room');
  }, []);

  return {
    joinRoom,
    leaveRoom,
    users,
    hostId,
    localUser,
    isHost: useRoomStore((s) => s.isHost),
  };
}
