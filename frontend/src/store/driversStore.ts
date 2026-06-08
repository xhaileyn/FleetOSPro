'use client';

import { create } from 'zustand';
import type { DriverRecord } from '@/lib/driversData';

interface DriversState {
  drivers: DriverRecord[];
  loading: boolean;
  loaded:  boolean;
  loadDrivers: (tenantId?: string | null) => Promise<void>;
  getByTenant: (tenantId: string) => DriverRecord[];
  getById:     (id: string)       => DriverRecord | undefined;
}

export const useDriversStore = create<DriversState>((set, get) => ({
  drivers: [],
  loading: false,
  loaded:  false,

  loadDrivers: async (tenantId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const url  = tenantId ? `/api/v1/drivers?tenantId=${tenantId}` : '/api/v1/drivers';
      const res  = await fetch(url);
      const data = await res.json();
      set({ drivers: Array.isArray(data) ? data : [], loaded: true });
    } catch (err) {
      console.error('[driversStore] load failed', err);
    } finally {
      set({ loading: false });
    }
  },

  getByTenant: (tenantId) => get().drivers.filter(d => d.tenantId === tenantId),
  getById:     (id)       => get().drivers.find(d => d.id === id),
}));
