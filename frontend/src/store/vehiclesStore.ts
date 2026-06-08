'use client';

import { create } from 'zustand';
import type { VehicleMaster } from '@/lib/vehiclesMaster';

interface VehiclesState {
  vehicles: VehicleMaster[];
  loading: boolean;
  loaded: boolean;
  loadVehicles:  (tenantId?: string | null) => Promise<void>;
  addVehicle:    (v: VehicleMaster) => void;
  updateVehicle: (id: string, patch: Partial<VehicleMaster>) => void;
  getByTenant:   (tenantId: string) => VehicleMaster[];
  getById:       (id: string)       => VehicleMaster | undefined;
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: [],
  loading:  false,
  loaded:   false,

  loadVehicles: async (tenantId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const url = tenantId ? `/api/v1/vehicles?tenantId=${tenantId}` : '/api/v1/vehicles';
      const res  = await fetch(url);
      const data = await res.json();
      set({ vehicles: Array.isArray(data) ? data : [], loaded: true });
    } catch (err) {
      console.error('[vehiclesStore] load failed', err);
    } finally {
      set({ loading: false });
    }
  },

  addVehicle:    (v) => set(state => ({ vehicles: [v, ...state.vehicles] })),
  updateVehicle: (id, patch) => set(state => ({
    vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...patch } : v),
  })),

  getByTenant: (tenantId) => get().vehicles.filter(v => v.tenantId === tenantId),
  getById:     (id)       => get().vehicles.find(v => v.id === id),
}));
