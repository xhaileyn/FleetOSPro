'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type TenantUser, TENANT_USERS } from '@/lib/tenantUsers';

/* ── server sync helpers ──────────────────────────────────────────── */

function syncCreate(user: TenantUser) {
  fetch('/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }).catch(() => {});
}

function syncUpdate(user: TenantUser) {
  fetch(`/api/v1/users/${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }).catch(() => {});
}

function syncDelete(id: string) {
  fetch(`/api/v1/users/${id}`, { method: 'DELETE' }).catch(() => {});
}

/* ── store ────────────────────────────────────────────────────────── */

interface UsersState {
  users: TenantUser[];
  loadUsers:  (tenantId: string | null) => Promise<void>;
  addUser:    (user: TenantUser) => void;
  updateUser: (user: TenantUser) => void;
  deleteUser: (id: string)       => void;
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: TENANT_USERS,

      loadUsers: async (tenantId) => {
        try {
          const url = tenantId
            ? `/api/v1/users?tenantId=${encodeURIComponent(tenantId)}`
            : '/api/v1/users';
          const res = await fetch(url);
          if (!res.ok) return;
          const dbUsers: TenantUser[] = await res.json();

          // DB is authoritative for users that exist there.
          // Any user only in localStorage (e.g. newly created before DB was ready)
          // is preserved until it syncs.
          const dbIds     = new Set(dbUsers.map(u => u.id));
          const localOnly = get().users.filter(u => !dbIds.has(u.id));
          set({ users: [...dbUsers, ...localOnly] });
        } catch {
          // Keep whatever is already in the store on network/DB errors
        }
      },

      addUser: (user) => {
        set(s => ({ users: [user, ...s.users] }));
        syncCreate(user);
      },

      updateUser: (user) => {
        set(s => ({ users: s.users.map(u => u.id === user.id ? user : u) }));
        syncUpdate(user);
      },

      deleteUser: (id) => {
        set(s => ({ users: s.users.filter(u => u.id !== id) }));
        syncDelete(id);
      },
    }),
    {
      name: 'fleet:users',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
