'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket, type TypedSocket } from '@/lib/socket';
import { useRoomStore } from '@/store/useRoomStore';

export function useSocket(roomId?: string) {
  const socketRef = useRef<TypedSocket | null>(null);
  const setConnected = useRoomStore((s) => s.setConnected);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: Error) => {
      console.error('[Socket] Connection error:', err.message);
      setConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [setConnected]);

  const disconnect = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
    setConnected(false);
  }, [setConnected]);

  return {
    socket: socketRef.current,
    isConnected: useRoomStore((s) => s.isConnected),
    disconnect,
  };
}
