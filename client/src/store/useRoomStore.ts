'use client';

import { create } from 'zustand';
import type { User } from '@/types/room';

interface RoomStore {
  roomId: string | null;
  users: User[];
  hostId: string | null;
  localUser: User | null;
  isConnected: boolean;

  // Computed
  isHost: () => boolean;

  // Actions
  setRoom: (roomId: string, users: User[], hostId: string) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  setHost: (hostId: string) => void;
  setLocalUser: (user: User | null) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: null,
  users: [],
  hostId: null,
  localUser: null,
  isConnected: false,

  isHost: () => {
    const { localUser, hostId } = get();
    return localUser?.id === hostId;
  },

  setRoom: (roomId, users, hostId) => set({ roomId, users, hostId }),

  addUser: (user) =>
    set((state) => ({
      users: state.users.some((u) => u.id === user.id)
        ? state.users.map((u) => (u.id === user.id ? user : u))
        : [...state.users, user],
    })),

  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    })),

  setHost: (hostId) => set({ hostId }),

  setLocalUser: (user) => set({ localUser: user }),

  setConnected: (connected) => set({ isConnected: connected }),

  reset: () =>
    set({
      roomId: null,
      users: [],
      hostId: null,
      localUser: null,
      isConnected: false,
    }),
}));
