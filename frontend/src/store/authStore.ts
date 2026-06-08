'use client';

import { create } from 'zustand';
import { AuthUser } from '@/lib/types';
import { saveAuth, clearAuth, getAuth } from '@/lib/auth';

interface AuthStore {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,

  login: (user) => {
    saveAuth(user);
    set({ user });
  },

  logout: () => {
    clearAuth();
    set({ user: null });
  },

  hydrate: () => {
    const user = getAuth();
    if (user) set({ user });
  },
}));
