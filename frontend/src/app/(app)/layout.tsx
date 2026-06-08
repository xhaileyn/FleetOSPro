'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { useConfigStore } from '@/store/configStore';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useDriversStore } from '@/store/driversStore';
import { useCustomersStore } from '@/store/customersStore';
import { useBranchesStore } from '@/store/branchesStore';
import { useDevicesStore } from '@/store/devicesStore';
import { useSimsStore } from '@/store/simsStore';
import { useTripsStore } from '@/store/tripsStore';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useUsersStore } from '@/store/usersStore';
import { useRefDataStore } from '@/store/refDataStore';
import { api } from '@/lib/api';
import { hydrateSubscriptionsFromDb, hydrateCustomPlansFromDb } from '@/lib/subscriptions';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { type BrandConfig, darkenHex, lightenHex } from '@/components/BrandingEditor';
import { useUIStore } from '@/store/uiStore';
import { ChatBot } from '@/components/chat/ChatBot';
import { FleetOSLockup } from '@/components/layout/FleetOSMark';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);
  const { user, hydrate }              = useAuthStore();
  const { activeTenant, switchTenant } = useTenantStore();
  const config                         = useConfigStore();
  const router                         = useRouter();

  const loadVehicles  = useVehiclesStore(s => s.loadVehicles);
  const loadDrivers   = useDriversStore(s => s.loadDrivers);
  const loadCustomers = useCustomersStore(s => s.loadCustomers);
  const loadBranches  = useBranchesStore(s => s.loadBranches);
  const loadDevices      = useDevicesStore(s => s.loadDevices);
  const loadSims         = useSimsStore(s => s.loadSims);
  const loadTrips        = useTripsStore(s => s.loadTrips);
  const loadSchedules    = useMaintenanceStore(s => s.loadSchedules);
  const loadUsers        = useUsersStore(s => s.loadUsers);
  const loadRefData      = useRefDataStore(s => s.loadRefData);

  const colorTheme  = useConfigStore(s => s.colorTheme);

  /* Original design palette — authoritative baseline, always applied first.
     These values match globals.css :root and must never be overridden by
     stale brand configs from a previous colour-scheme experiment. */
  const ORIGINAL_PALETTE = {
    '--teal':      '#c4912a',  // logo gold — primary brand
    '--teal-dk':   '#7a5c1a',  // dark gold
    '--teal-lt':   '#fdf6e8',  // light gold tint
    '--gold':      '#c4912a',
    '--cream':     '#faf8f5',
    '--cream2':    '#f3f0eb',
    '--cream3':    '#e8e3dc',
    '--ink':       '#0d1b2a',  // logo navy
    '--ink2':      '#243b55',  // mid navy
    '--ink3':      '#8a8078',
    '--border':    '#ddd8d0',
    '--border2':   '#cac4bb',
    // Dark chrome — sidebar, topbar, hero header backgrounds
    '--chrome':    '#0f172a',  // sidebar flat bg
    '--chrome-lt': '#1c2b44',  // topbar / hero lighter stop
    '--hero-s':    '#0d1b2a',  // hero gradient start
    '--hero-m':    '#162033',  // hero gradient mid
    '--hero-e':    '#1c2b44',  // hero gradient end
  } as const;

  /* ── Color theme overrides (applied after ORIGINAL_PALETTE reset) ── */
  const THEME_PALETTES: Record<string, Partial<Record<keyof typeof ORIGINAL_PALETTE, string>>> = {
    gold: {},   // default — no overrides needed
    slate: {
      // Accent — royal blue replaces gold
      '--teal':      '#2563eb',
      '--teal-dk':   '#1d4ed8',
      '--teal-lt':   '#eff6ff',
      '--gold':      '#2563eb',
      // Surfaces — cool blue-tinted
      '--cream':     '#f0f6ff',
      '--cream2':    '#e3edf8',
      '--cream3':    '#cfddf0',
      '--ink':       '#0b1929',
      '--ink2':      '#1a3048',
      '--ink3':      '#5a7090',
      '--border':    '#b8cfe8',
      '--border2':   '#96b4d4',
      // Chrome — blue-tinted dark
      '--chrome':    '#0c1630',
      '--chrome-lt': '#142244',
      '--hero-s':    '#0a142c',
      '--hero-m':    '#101f3e',
      '--hero-e':    '#162448',
    },
    forest: {
      // Accent — forest green replaces gold
      '--teal':      '#16a34a',
      '--teal-dk':   '#15803d',
      '--teal-lt':   '#f0fdf4',
      '--gold':      '#16a34a',
      // Surfaces — sage-tinted
      '--cream':     '#edf7f1',
      '--cream2':    '#ddeee5',
      '--cream3':    '#c8e2d4',
      '--ink':       '#0d2018',
      '--ink2':      '#1d3a28',
      '--ink3':      '#5a8068',
      '--border':    '#aed4bc',
      '--border2':   '#8cbfa5',
      // Chrome — green-tinted dark
      '--chrome':    '#0b1a0e',
      '--chrome-lt': '#142b1a',
      '--hero-s':    '#09150e',
      '--hero-m':    '#101f16',
      '--hero-e':    '#16281e',
    },
  };

  /* Apply brand theme on every tenant switch.
     Step 1 — reset every CSS var to the original palette so no stale
               localStorage entry from a previous global colour experiment
               bleeds through.
     Step 2 — apply only the tenant's logo / font / explicit brand colour
               on top (if the tenant has saved a custom brand config). */
  useEffect(() => {
    const root = document.documentElement;

    // Step 1 — enforce original design as baseline for all tenants
    for (const [k, v] of Object.entries(ORIGINAL_PALETTE)) {
      root.style.setProperty(k, v);
    }
    document.body.style.fontFamily = '';   // reset any persisted font override

    // Step 1b — apply color theme overrides on top of baseline
    const themeOverrides = THEME_PALETTES[colorTheme] ?? {};
    for (const [k, v] of Object.entries(themeOverrides)) {
      root.style.setProperty(k, v);
    }

    // Step 2 — apply saved tenant brand config (logo + intentional overrides only)
    try {
      const tenantKey = user?.tenantId ? `fleetBrand_tenant_${user.tenantId}` : null;
      const raw = (tenantKey && localStorage.getItem(tenantKey)) ?? localStorage.getItem('fleetBrand');
      if (!raw) return;
      const brand: Partial<BrandConfig> = JSON.parse(raw);
      if (brand.primaryColor) {
        root.style.setProperty('--teal',    brand.primaryColor);
        root.style.setProperty('--teal-dk', darkenHex(brand.primaryColor));
        root.style.setProperty('--teal-lt', lightenHex(brand.primaryColor));
      }
      if (brand.accentColor) root.style.setProperty('--gold', brand.accentColor);
      if (brand.fontFamily)  document.body.style.fontFamily = brand.fontFamily;
    } catch { /* ignore parse errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId, colorTheme]);

  useEffect(() => { hydrate(); }, [hydrate]);

  // Load all entity data whenever the authenticated user (or their tenant) changes
  useEffect(() => {
    if (!user) return;
    const tid = user.tenantId ?? null;  // null = super_admin/platform_admin → load all
    loadVehicles(tid);
    loadDrivers(tid);
    loadCustomers(tid);
    loadBranches(tid);
    loadDevices(tid);
    loadSims(tid);
    loadTrips(tid);
    loadSchedules(tid);
    loadUsers(tid);
    hydrateSubscriptionsFromDb(tid);
    hydrateCustomPlansFromDb(tid);
    loadRefData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId]);

  // Load RBAC permissions on every app mount so the sidebar visibility
  // reflects the latest role→module grants from the API.
  useEffect(() => {
    api.rbac.getPermissions()
      .then(perms => config.setRbacPermissions(perms as { roleId: string; allowedModules: string[] }[]))
      .catch(() => { /* keep cached/default values on error */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user === null) {
      const t = setTimeout(() => {
        const stored = localStorage.getItem('fleetos_user');
        if (!stored) router.push('/login');
      }, 50);
      return () => clearTimeout(t);
    }
  }, [user, router]);

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--ink3)', fontSize: 12 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `${sidebarCollapsed ? 52 : 228}px 1fr`,
      gridTemplateRows: activeTenant ? '64px 38px 1fr auto' : '64px 1fr auto',
      minHeight: '100vh',
      transition: 'grid-template-columns 0.22s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <TopBar />

      {/* ── Tenant impersonation banner ─────────────────────────────────── */}
      {activeTenant && (
        <div style={{
          gridColumn: '1 / -1',
          background: 'linear-gradient(90deg, #78350f 0%, #92400e 100%)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: 10,
          borderBottom: '1px solid #b45309',
          zIndex: 90,
        }}>
          {/* Icon */}
          <span style={{ fontSize: 13 }}>⚡</span>

          {/* Context text */}
          <span style={{ fontSize: 12, color: '#fef3c7', fontWeight: 500 }}>
            Viewing as
          </span>
          <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>
            {activeTenant.name}
          </span>
          <span style={{ fontSize: 11, color: '#d97706' }}>
            ·
          </span>
          <span style={{ fontSize: 11, color: '#fcd34d' }}>
            {activeTenant.plan}
          </span>
          <span style={{ fontSize: 11, color: '#d97706' }}>
            ·
          </span>
          <span style={{ fontSize: 11, color: '#d97706', fontFamily: 'monospace' }}>
            {activeTenant.domain}
          </span>
          <span style={{ fontSize: 11, color: '#d97706' }}>
            · {activeTenant.vehicles} vehicles · {activeTenant.users} users
          </span>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Warning badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
            background: 'rgba(251,191,36,0.2)', color: '#fbbf24',
            border: '1px solid rgba(251,191,36,0.3)', letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            Impersonating
          </span>

          {/* Exit button */}
          <button
            onClick={() => switchTenant(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', fontSize: 11, fontWeight: 600,
              background: 'rgba(255,255,255,0.12)', color: '#fef3c7',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 5,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ✕ Exit tenant view
          </button>
        </div>
      )}

      <Sidebar />
      <ChatBot />
      <main style={{ background: 'var(--cream)', overflowY: 'auto' }}>
        {children}
      </main>

      {/* ── Footer — full-width dark bar matching TopBar ──────────────── */}
      <footer style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(0deg, var(--chrome-lt) 0%, var(--chrome) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.3)',
        padding: '0 20px',
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        flexShrink: 0,
      }}>
        {/* Left — brand lockup */}
        <FleetOSLockup size={18} />

        {/* Centre — copyright */}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', letterSpacing: '0.2px' }}>
          &copy; {new Date().getFullYear()} FleetOS Pro · All rights reserved · Fleet intelligence, redefined.
        </div>

        {/* Right — links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {[
            { label: 'Privacy', icon: 'ti-lock' },
            { label: 'Terms',   icon: 'ti-file-description' },
            { label: 'Support', icon: 'ti-headset' },
          ].map(({ label, icon }) => (
            <span key={label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 500,
              cursor: 'default', letterSpacing: '0.2px',
              transition: 'color 0.15s',
            }}>
              <i className={`ti ${icon}`} style={{ fontSize: 10 }} />
              {label}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
