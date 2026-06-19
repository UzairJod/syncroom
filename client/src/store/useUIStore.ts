import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

type SidebarTab = 'chat' | 'participants';

interface UIStore {
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  mediaModalOpen: boolean;
  subtitleSettingsOpen: boolean;
  isFullscreen: boolean;
  toasts: Toast[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  toggleMediaModal: () => void;
  setMediaModalOpen: (open: boolean) => void;
  toggleSubtitleSettings: () => void;
  toggleFullscreen: () => void;
  setFullscreen: (fs: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

let toastIdCounter = 0;

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  sidebarTab: 'chat',
  mediaModalOpen: false,
  subtitleSettingsOpen: false,
  isFullscreen: false,
  toasts: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  toggleMediaModal: () => set((s) => ({ mediaModalOpen: !s.mediaModalOpen })),
  setMediaModalOpen: (open) => set({ mediaModalOpen: open }),
  toggleSubtitleSettings: () => set((s) => ({ subtitleSettingsOpen: !s.subtitleSettingsOpen })),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
  setFullscreen: (fs) => set({ isFullscreen: fs }),

  addToast: (toast) => {
    const id = `toast-${++toastIdCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
