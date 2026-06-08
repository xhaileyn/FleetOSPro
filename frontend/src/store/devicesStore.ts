'use client';

import { create } from 'zustand';
import type { GpsDevice } from '@/lib/devicesData';

interface DevicesState {
  devices:      GpsDevice[];
  loading:      boolean;
  loaded:       boolean;
  loadDevices:  (tenantId?: string | null) => Promise<void>;
  addDevice:    (d: GpsDevice) => void;
  updateDevice: (d: GpsDevice) => void;
  removeDevice: (id: string)   => void;
  getByTenant:  (tenantId: string)  => GpsDevice[];
  getByVehicle: (vehicleId: string) => GpsDevice[];
  getById:      (id: string)        => GpsDevice | undefined;
}

export const useDevicesStore = create<DevicesState>((set, get) => ({
  devices: [],
  loading: false,
  loaded:  false,

  loadDevices: async (tenantId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const url  = tenantId ? `/api/v1/devices?tenantId=${tenantId}` : '/api/v1/devices';
      const res  = await fetch(url);
      const data = await res.json();
      set({ devices: Array.isArray(data) ? data : [], loaded: true });
    } catch (err) {
      console.error('[devicesStore] load failed', err);
    } finally {
      set({ loading: false });
    }
  },

  addDevice:    (d)  => set(state => ({ devices: [d, ...state.devices] })),
  updateDevice: (d)  => set(state => ({ devices: state.devices.map(x => x.id === d.id ? d : x) })),
  removeDevice: (id) => set(state => ({ devices: state.devices.filter(x => x.id !== id) })),

  getByTenant:  (tenantId)  => get().devices.filter(d => d.tenantId  === tenantId),
  getByVehicle: (vehicleId) => get().devices.filter(d => d.vehicleId === vehicleId),
  getById:      (id)        => get().devices.find(d => d.id === id),
}));
