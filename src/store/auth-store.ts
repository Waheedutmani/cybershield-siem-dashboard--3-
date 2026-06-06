import { create } from 'zustand';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: SessionUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null, isAuthenticated: false });
  },
}));
