'use client';

import { create } from 'zustand';
import type { Trip } from '@/lib/trips';

interface TripsState {
  trips:       Trip[];
  loading:     boolean;
  loaded:      boolean;
  loadTrips:   (tenantId?: string | null) => Promise<void>;
  getByVehicle:(vehicleId: string) => Trip[];
  getById:     (id: string) => Trip | undefined;
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips:   [],
  loading: false,
  loaded:  false,

  loadTrips: async (tenantId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const url  = tenantId ? `/api/v1/trips?tenantId=${tenantId}` : '/api/v1/trips';
      const res  = await fetch(url);
      const data = await res.json();
      set({ trips: Array.isArray(data) ? data : [], loaded: true });
    } catch (err) {
      console.error('[tripsStore] load failed', err);
    } finally {
      set({ loading: false });
    }
  },

  getByVehicle: (vehicleId) => get().trips.filter(t => t.vehicleId === vehicleId),
  getById:      (id)        => get().trips.find(t => t.id === id),
}));
