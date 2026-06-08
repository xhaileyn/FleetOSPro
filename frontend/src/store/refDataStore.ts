'use client';
import { create } from 'zustand';
import { syncTenantsMetaFromDb } from '@/lib/vehiclesMaster';

export interface LookupEntry {
  value:  string;
  label:  string;
  parent: string | null;
  region: string | null;
}

export interface TenantMeta {
  name:    string;
  country: string;
  plan:    string;
  color:   string;
  status:  string;
}

interface RefDataState {
  loaded: boolean;
  loading: boolean;

  // Reference data by category
  countries:        LookupEntry[];
  industries:       LookupEntry[];
  cities:           LookupEntry[];
  vehicleCategories:LookupEntry[];
  fuelTypes:        LookupEntry[];
  deviceTypes:      LookupEntry[];
  deviceModels:     LookupEntry[];  // full list — filter by parent for device type
  telecomOperators: LookupEntry[];
  geofenceTypes:    LookupEntry[];

  // Tenant metadata (shortId → meta) — seeded from localStorage cache, replaced by DB on load
  tenantsMeta: Record<string, TenantMeta>;

  // Actions
  loadRefData: () => Promise<void>;

  // Helpers
  modelsForType:     (deviceType: string) => string[];
  citiesByCountry:   (country: string)    => string[];
  allCities:         () => string[];
  tenantMeta:        (shortId: string)    => TenantMeta | undefined;
}

const LS_TENANT_META = 'fleetOS_tenantsMeta';

function loadCachedTenantMeta(): Record<string, TenantMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_TENANT_META);
    return raw ? JSON.parse(raw) as Record<string, TenantMeta> : {};
  } catch { return {}; }
}

function saveCachedTenantMeta(meta: Record<string, TenantMeta>) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_TENANT_META, JSON.stringify(meta)); } catch { /* quota */ }
}

export const useRefDataStore = create<RefDataState>((set, get) => ({
  loaded:  false,
  loading: false,

  countries:         [],
  industries:        [],
  cities:            [],
  vehicleCategories: [],
  fuelTypes:         [],
  deviceTypes:       [],
  deviceModels:      [],
  telecomOperators:  [],
  geofenceTypes:     [],
  tenantsMeta:       loadCachedTenantMeta(),

  loadRefData: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const [refRes, metaRes] = await Promise.all([
        fetch('/api/v1/ref'),
        fetch('/api/v1/tenants/meta'),
      ]);

      if (refRes.ok) {
        const grouped = await refRes.json() as Record<string, LookupEntry[]>;
        set({
          countries:         grouped['country']          ?? [],
          industries:        grouped['industry']         ?? [],
          cities:            grouped['city']             ?? [],
          vehicleCategories: grouped['vehicle_category'] ?? [],
          fuelTypes:         grouped['fuel_type']        ?? [],
          deviceTypes:       grouped['device_type']      ?? [],
          deviceModels:      grouped['device_model']     ?? [],
          telecomOperators:  grouped['telecom_operator'] ?? [],
          geofenceTypes:     grouped['geofence_type']    ?? [],
        });
      }

      if (metaRes.ok) {
        const meta = await metaRes.json() as Record<string, TenantMeta>;
        if (Object.keys(meta).length > 0) {
          set({ tenantsMeta: meta });
          saveCachedTenantMeta(meta);          // persist for next load — no more hardcoded fallback
          syncTenantsMetaFromDb(meta);         // keep TENANTS_META import in legacy pages in sync
        }
      }

      set({ loaded: true });
    } catch (err) {
      console.error('[refDataStore] load failed', err);
    } finally {
      set({ loading: false });
    }
  },

  modelsForType: (deviceType) =>
    get().deviceModels
      .filter(m => m.parent === deviceType)
      .map(m => m.value),

  citiesByCountry: (country) =>
    get().cities
      .filter(c => c.parent === country)
      .map(c => c.value),

  allCities: () =>
    [...new Set(get().cities.map(c => c.value))].sort(),

  tenantMeta: (shortId) =>
    get().tenantsMeta[shortId],
}));
