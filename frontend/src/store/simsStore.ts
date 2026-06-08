'use client';

import { create } from 'zustand';
import type { SimCard } from '@/lib/sims';

interface SimsState {
  sims:        SimCard[];
  loading:     boolean;
  loaded:      boolean;
  loadSims:    (tenantId?: string | null) => Promise<void>;
  addSim:      (s: SimCard) => void;
  updateSim:   (s: SimCard) => void;
  removeSim:   (id: string) => void;
  getByTenant: (tenantId: string)  => SimCard[];
  getByVehicle:(vehicleId: string) => SimCard[];
  getById:     (id: string)        => SimCard | undefined;
}

export const useSimsStore = create<SimsState>((set, get) => ({
  sims:    [],
  loading: false,
  loaded:  false,

  loadSims: async (tenantId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const url  = tenantId ? `/api/v1/sims?tenantId=${tenantId}` : '/api/v1/sims';
      const res  = await fetch(url);
      const data = await res.json();
      set({ sims: Array.isArray(data) ? data : [], loaded: true });
    } catch (err) {
      console.error('[simsStore] load failed', err);
    } finally {
      set({ loading: false });
    }
  },

  addSim:    (s)  => set(state => ({ sims: [s, ...state.sims] })),
  updateSim: (s)  => set(state => ({ sims: state.sims.map(x => x.id === s.id ? s : x) })),
  removeSim: (id) => set(state => ({ sims: state.sims.filter(x => x.id !== id) })),

  getByTenant:  (tenantId)  => get().sims.filter(s => s.tenantId  === tenantId),
  getByVehicle: (vehicleId) => get().sims.filter(s => s.vehicleId === vehicleId),
  getById:      (id)        => get().sims.find(s => s.id === id),
}));
