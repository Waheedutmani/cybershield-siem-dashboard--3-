import { create } from 'zustand';

export type PageType = 'dashboard' | 'logs' | 'alerts' | 'analytics' | 'simulation' | 'users' | 'settings' | 'attackmap' | 'timeline' | 'firewall' | 'monitoring' | 'search' | 'sessions' | 'statistics' | 'profile';
export type ThemeType = 'soc-dark' | 'neon-blue' | 'matrix-green';

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: string;
  timestamp: Date;
}

interface AppState {
  currentPage: PageType;
  sidebarOpen: boolean;
  notifications: Notification[];
  simulationActive: boolean;
  theme: ThemeType;
  socMode: boolean;
  bootComplete: boolean;
  soundsEnabled: boolean;
  openAIAssistant: boolean;
  setCurrentPage: (page: PageType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setSimulationActive: (active: boolean) => void;
  setTheme: (theme: ThemeType) => void;
  toggleSocMode: () => void;
  setSocMode: (mode: boolean) => void;
  setBootComplete: (complete: boolean) => void;
  toggleSounds: () => void;
  setSoundsEnabled: (enabled: boolean) => void;
  setOpenAIAssistant: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: true,
  notifications: [],
  simulationActive: false,
  theme: 'soc-dark',
  socMode: false,
  bootComplete: false,
  soundsEnabled: false,
  openAIAssistant: false,
  setCurrentPage: (currentPage) => set({ currentPage }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  addNotification: (notification) =>
    set((s) => ({
      notifications: [
        { ...notification, id: Math.random().toString(36).slice(2), timestamp: new Date() },
        ...s.notifications,
      ].slice(0, 8),
    })),
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),
  setSimulationActive: (simulationActive) => set({ simulationActive }),
  setTheme: (theme) => set({ theme }),
  toggleSocMode: () => set((s) => ({ socMode: !s.socMode })),
  setSocMode: (socMode) => set({ socMode }),
  setBootComplete: (bootComplete) => set({ bootComplete }),
  toggleSounds: () => set((s) => ({ soundsEnabled: !s.soundsEnabled })),
  setSoundsEnabled: (soundsEnabled) => set({ soundsEnabled }),
  setOpenAIAssistant: (openAIAssistant) => set({ openAIAssistant }),
}));
