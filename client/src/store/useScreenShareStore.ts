import { create } from 'zustand';

interface ScreenShareStore {
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  sharerId: string | null;
  sharerName: string | null;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setSharerInfo: (sharerId: string, sharerName: string) => void;
  startSharing: () => void;
  stopSharing: () => void;
  reset: () => void;
}

export const useScreenShareStore = create<ScreenShareStore>((set) => ({
  isScreenSharing: false,
  localStream: null,
  remoteStream: null,
  sharerId: null,
  sharerName: null,

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setSharerInfo: (sharerId, sharerName) => set({ sharerId, sharerName, isScreenSharing: true }),

  startSharing: () => set({ isScreenSharing: true }),
  stopSharing: () => set({
    isScreenSharing: false,
    localStream: null,
    remoteStream: null,
    sharerId: null,
    sharerName: null,
  }),

  reset: () => set({
    isScreenSharing: false,
    localStream: null,
    remoteStream: null,
    sharerId: null,
    sharerName: null,
  }),
}));
