'use client';
import { create } from 'zustand';

export interface ActiveTenant {
  id: string;
  name: string;
  plan: string;
  domain: string;
  status: string;
  vehicles: number;
  users: number;
  adminEmail: string;
}

interface TenantStore {
  activeTenant: ActiveTenant | null;
  switchTenant: (tenant: ActiveTenant | null) => void;
}

export const useTenantStore = create<TenantStore>((set) => ({
  activeTenant: null,
  switchTenant: (tenant) => set({ activeTenant: tenant }),
}));
