'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useChatStore } from '@/store/useChatStore';
import { sanitizeMessage } from '@/lib/sanitize';
import { CHAT_RATE_LIMIT, MAX_MESSAGE_LENGTH } from '@/lib/constants';

export function useChat(registerListeners = false) {
  const { addMessage, messages } = useChatStore();
  const messageTimestamps = useRef<number[]>([]);

  useEffect(() => {
    if (!registerListeners) return;
    const socket = getSocket();

    const handleNewMessage = (data: any) => {
      addMessage(data);
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [registerListeners, addMessage]);

  const sendMessage = useCallback((content: string): { success: boolean; error?: string } => {
    const trimmed = sanitizeMessage(content);
    if (!trimmed) return { success: false, error: 'Message cannot be empty' };
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return { success: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` };
    }

    // Client-side rate limiting
    const now = Date.now();
    messageTimestamps.current = messageTimestamps.current.filter(
      (ts) => now - ts < CHAT_RATE_LIMIT.windowMs,
    );
    if (messageTimestamps.current.length >= CHAT_RATE_LIMIT.maxMessages) {
      return { success: false, error: 'Slow down! Too many messages.' };
    }
    messageTimestamps.current.push(now);

    const socket = getSocket();
    socket.emit('send-message', { content: trimmed });
    return { success: true };
  }, []);

  return { sendMessage, messages };
}
