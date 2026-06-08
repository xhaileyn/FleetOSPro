'use client';

import { create } from 'zustand';

export interface MaintenanceSchedule {
  id:             string;
  tenantId:       string;
  vehicleShortId: string;
  vehiclePlate:   string;
  vehicleMake:    string;
  serviceType:    string;
  lastDoneAt:     string | null;
  dueAt:          string | null;
  mileage:        string;
  status:         string;
  priority:       string;
  notes:          string;
  createdAt:      string;
}

interface MaintenanceState {
  schedules:        MaintenanceSchedule[];
  loading:          boolean;
  loaded:           boolean;
  loadSchedules:    (tenantId?: string | null) => Promise<void>;
  addSchedule:      (s: MaintenanceSchedule) => void;
  updateSchedule:   (s: MaintenanceSchedule) => void;
  getByTenant:      (tenantId: string) => MaintenanceSchedule[];
  getByVehicle:     (vehicleShortId: string) => MaintenanceSchedule[];
  getById:          (id: string) => MaintenanceSchedule | undefined;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  schedules: [],
  loading:   false,
  loaded:    false,

  loadSchedules: async (tenantId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const url  = tenantId ? `/api/v1/maintenance?tenantId=${tenantId}` : '/api/v1/maintenance';
      const res  = await fetch(url);
      const data = await res.json();
      set({ schedules: Array.isArray(data) ? data : [], loaded: true });
    } catch (err) {
      console.error('[maintenanceStore] load failed', err);
    } finally {
      set({ loading: false });
    }
  },

  addSchedule:    (s) => set(state => ({ schedules: [s, ...state.schedules] })),
  updateSchedule: (s) => set(state => ({ schedules: state.schedules.map(x => x.id === s.id ? s : x) })),

  getByTenant:  (tenantId)       => get().schedules.filter(s => s.tenantId        === tenantId),
  getByVehicle: (vehicleShortId) => get().schedules.filter(s => s.vehicleShortId  === vehicleShortId),
  getById:      (id)             => get().schedules.find(s => s.id === id),
}));
