'use client';

import { create } from 'zustand';
import type { Customer } from '@/lib/customers';

interface CustomersState {
  customers: Customer[];
  loading:   boolean;
  loaded:    boolean;
  loadCustomers: (tenantId?: string | null) => Promise<void>;
  addCustomer:   (c: Customer) => void;
  getByTenant:   (tenantId: string) => Customer[];
  getById:       (id: string)       => Customer | undefined;
}

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  loading:   false,
  loaded:    false,

  loadCustomers: async (tenantId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const url  = tenantId ? `/api/v1/customers?tenantId=${tenantId}` : '/api/v1/customers';
      const res  = await fetch(url);
      const data = await res.json();
      set({ customers: Array.isArray(data) ? data : [], loaded: true });
    } catch (err) {
      console.error('[customersStore] load failed', err);
    } finally {
      set({ loading: false });
    }
  },

  addCustomer: (c) => set(state => ({ customers: [c, ...state.customers] })),

  getByTenant: (tenantId) => get().customers.filter(c => c.tenantId === tenantId),
  getById:     (id)       => get().customers.find(c => c.id === id),
}));
