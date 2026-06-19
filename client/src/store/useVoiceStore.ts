import { create } from 'zustand';

interface VoiceStore {
  isInVoice: boolean;
  isMuted: boolean;
  voiceUsers: string[];
  speakingUsers: Set<string>;
  volume: number;
  joinVoice: () => void;
  leaveVoice: () => void;
  toggleMute: () => void;
  addVoiceUser: (userId: string) => void;
  removeVoiceUser: (userId: string) => void;
  setSpeaking: (userId: string, isSpeaking: boolean) => void;
  setVolume: (volume: number) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  isInVoice: false,
  isMuted: false,
  voiceUsers: [],
  speakingUsers: new Set<string>(),
  volume: 0.8,

  joinVoice: () => set({ isInVoice: true, isMuted: false }),

  leaveVoice: () => set({ isInVoice: false, isMuted: false }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  addVoiceUser: (userId) =>
    set((state) => ({
      voiceUsers: state.voiceUsers.includes(userId)
        ? state.voiceUsers
        : [...state.voiceUsers, userId],
    })),

  removeVoiceUser: (userId) =>
    set((state) => ({
      voiceUsers: state.voiceUsers.filter((id) => id !== userId),
      speakingUsers: (() => {
        const next = new Set(state.speakingUsers);
        next.delete(userId);
        return next;
      })(),
    })),

  setSpeaking: (userId, isSpeaking) =>
    set((state) => {
      const next = new Set(state.speakingUsers);
      if (isSpeaking) next.add(userId);
      else next.delete(userId);
      return { speakingUsers: next };
    }),

  setVolume: (volume) => set({ volume }),

  reset: () =>
    set({
      isInVoice: false,
      isMuted: false,
      voiceUsers: [],
      speakingUsers: new Set<string>(),
      volume: 0.8,
    }),
}));
