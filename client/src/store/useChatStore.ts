'use client';

import { create } from 'zustand';
import type { ChatMessage } from '@/types/chat';

const MAX_MESSAGES = 200;

interface ChatStore {
  messages: ChatMessage[];
  unreadCount: number;

  // Actions
  addMessage: (message: ChatMessage) => void;
  addSystemMessage: (content: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  resetUnread: () => void;
  clear: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  unreadCount: 0,

  addMessage: (message) =>
    set((state) => {
      const newMessages = [...state.messages, message];
      // FIFO: cap at MAX_MESSAGES
      if (newMessages.length > MAX_MESSAGES) {
        newMessages.splice(0, newMessages.length - MAX_MESSAGES);
      }
      return {
        messages: newMessages,
        unreadCount: state.unreadCount + 1,
      };
    }),

  addSystemMessage: (content) =>
    set((state) => {
      const systemMessage: ChatMessage = {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: 'system',
        displayName: 'System',
        content,
        timestamp: Date.now(),
        type: 'system',
      };
      const newMessages = [...state.messages, systemMessage];
      if (newMessages.length > MAX_MESSAGES) {
        newMessages.splice(0, newMessages.length - MAX_MESSAGES);
      }
      return { messages: newMessages };
    }),

  setMessages: (messages) => set({ messages: messages.slice(-MAX_MESSAGES) }),

  resetUnread: () => set({ unreadCount: 0 }),

  clear: () => set({ messages: [], unreadCount: 0 }),
}));
