'use client';

import { create } from 'zustand';
import type { Branch } from '@/lib/branches';

interface BranchesState {
  branches: Branch[];
  loading:  boolean;
  loaded:   boolean;
  loadBranches: (tenantId?: string | null) => Promise<void>;
  getByTenant:  (tenantId: string) => Branch[];
  getById:      (id: string)       => Branch | undefined;
}

export const useBranchesStore = create<BranchesState>((set, get) => ({
  branches: [],
  loading:  false,
  loaded:   false,

  loadBranches: async (tenantId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const url  = tenantId ? `/api/v1/branches?tenantId=${tenantId}` : '/api/v1/branches';
      const res  = await fetch(url);
      const data = await res.json();
      set({ branches: Array.isArray(data) ? data : [], loaded: true });
    } catch (err) {
      console.error('[branchesStore] load failed', err);
    } finally {
      set({ loading: false });
    }
  },

  getByTenant: (tenantId) => get().branches.filter(b => b.tenantId === tenantId),
  getById:     (id)       => get().branches.find(b => b.id === id),
}));
