'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';

// Configurable tenant-scoped roles (fleet_admin manages their own tenant users)
const CONFIGURABLE_ROLES: { value: string; label: string; color: string }[] = [
  { value: 'fleet_manager', label: 'Fleet Manager',  color: '#c4912a' },
  { value: 'dispatcher',    label: 'Dispatcher',     color: '#7c3aed' },
  { value: 'billing_admin', label: 'Billing Admin',  color: '#d97706' },
  { value: 'viewer',        label: 'Viewer',         color: '#6b7280' },
  { value: 'vehicle_owner', label: 'Vehicle Owner',  color: '#16a34a' },
];

// Nav structure mirroring Sidebar.tsx — only the items a Tenant Admin can
// meaningfully configure (platform ops items are super_admin-only and excluded)
const TENANT_NAV_SECTIONS = [
  {
    label: 'Real-time ops',
    items: [
      { id: 'real-time',    label: 'Live Dashboard',       defaultOn: { fleet_manager: true,  dispatcher: true,  billing_admin: false, viewer: true,  vehicle_owner: false } },
      { id: 'my-vehicle',   label: 'My Vehicle',           defaultOn: { fleet_manager: false, dispatcher: false, billing_admin: false, viewer: false, vehicle_owner: true  } },
      { id: 'map',          label: 'Live Map',             defaultOn: { fleet_manager: true,  dispatcher: true,  billing_admin: false, viewer: false, vehicle_owner: true  } },
      { id: 'playback',     label: 'Route Playback',       defaultOn: { fleet_manager: true,  dispatcher: true,  billing_admin: false, viewer: false, vehicle_owner: true  } },
      { id: 'alerts',       label: 'Alerts',               defaultOn: { fleet_manager: true,  dispatcher: true,  billing_admin: false, viewer: false, vehicle_owner: true  } },
    ],
  },
  {
    label: 'Fleet management',
    items: [
      { id: 'vehicles',     label: 'Vehicles',             defaultOn: { fleet_manager: true,  dispatcher: true,  billing_admin: false, viewer: false, vehicle_owner: false } },
      { id: 'drivers',      label: 'Driver Performance',defaultOn: { fleet_manager: true,  dispatcher: true,  billing_admin: false, viewer: false, vehicle_owner: false } },
      { id: 'routes',       label: 'Route Optimisation',   defaultOn: { fleet_manager: true,  dispatcher: false, billing_admin: false, viewer: false, vehicle_owner: true  } },
      { id: 'geofences',    label: 'Geofences',            defaultOn: { fleet_manager: true,  dispatcher: false, billing_admin: false, viewer: false, vehicle_owner: true  } },
      { id: 'unauthorized', label: 'Unauthorized Usage',   defaultOn: { fleet_manager: true,  dispatcher: false, billing_admin: false, viewer: false, vehicle_owner: true  } },
      { id: 'maintenance',  label: 'Maintenance',          defaultOn: { fleet_manager: true,  dispatcher: false, billing_admin: false, viewer: false, vehicle_owner: true  } },
    ],
  },
  {
    label: 'Cost & efficiency',
    items: [
      { id: 'analytics',    label: 'Analytics',            defaultOn: { fleet_manager: true,  dispatcher: false, billing_admin: false, viewer: false, vehicle_owner: true  } },
      { id: 'reports',      label: 'Reports',              defaultOn: { fleet_manager: true,  dispatcher: false, billing_admin: false, viewer: false, vehicle_owner: true  } },
    ],
  },
  {
    label: 'Billing',
    items: [
      { id: 'subscription', label: 'Subscription',         defaultOn: { fleet_manager: false, dispatcher: false, billing_admin: true,  viewer: false, vehicle_owner: true  } },
    ],
  },
];

// All nav item ids this page manages
const ALL_NAV_IDS = TENANT_NAV_SECTIONS.flatMap(s => s.items.map(i => i.id));

function getDefaultOn(navId: string, role: string): boolean {
  for (const sec of TENANT_NAV_SECTIONS) {
    const item = sec.items.find(i => i.id === navId);
    if (item) return (item.defaultOn as Record<string, boolean>)[role] ?? false;
  }
  return false;
}

// ── Mini sidebar preview ───────────────────────────────────────────────────────

function SidebarPreview({ tenantId, role }: { tenantId: string; role: string }) {
  const config = useConfigStore();
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 8, width: 160, overflow: 'hidden', fontSize: 11,
    }}>
      <div style={{ background: '#c4912a', color: '#fff', padding: '6px 10px', fontSize: 10, fontWeight: 700 }}>
        Sidebar preview
      </div>
      {TENANT_NAV_SECTIONS.map(sec => {
        const visItems = sec.items.filter(item => {
          const override = config.getTenantNavOverride(tenantId, role, item.id);
          return override !== null ? override : getDefaultOn(item.id, role);
        });
        if (!visItems.length) return null;
        return (
          <div key={sec.label}>
            <div style={{ padding: '5px 8px 2px', fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink3)' }}>
              {sec.label}
            </div>
            {visItems.map(item => (
              <div key={item.id} style={{ padding: '4px 10px', color: 'var(--ink2)', borderLeft: '2px solid transparent' }}>
                {item.label}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TenantNavPage() {
  const { user } = useAuthStore();
  const config = useConfigStore();

  const isAdmin = user?.role === 'tenant_admin' || user?.role === 'fleet_admin' || user?.role === 'super_admin';
  const tenantId = user?.tenantId ?? '1';

  const [selectedRole, setSelectedRole] = useState(CONFIGURABLE_ROLES[0].value);
  const [view, setView] = useState<'editor' | 'matrix'>('editor');
  const [toast, setToast] = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  // How many overrides exist for this role
  const overrideCount = useMemo(() => {
    return ALL_NAV_IDS.filter(id => config.getTenantNavOverride(tenantId, selectedRole, id) !== null).length;
  }, [tenantId, selectedRole, config]);

  function getEffectiveVisible(navId: string, role: string): boolean {
    const override = config.getTenantNavOverride(tenantId, role, navId);
    return override !== null ? override : getDefaultOn(navId, role);
  }

  function toggleItem(navId: string, role: string) {
    if (!isAdmin) return;
    const current = getEffectiveVisible(navId, role);
    config.setTenantNavVisible(tenantId, role, navId, !current);
  }

  function resetRole(role: string) {
    config.resetTenantNavRole(tenantId, role);
    showToast('Reset to system defaults');
  }

  const selectedRoleMeta = CONFIGURABLE_ROLES.find(r => r.value === selectedRole)!;
  const visibleCount = ALL_NAV_IDS.filter(id => getEffectiveVisible(id, selectedRole)).length;

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: '#1e293b', color: '#fff', borderRadius: 8,
          padding: '10px 18px', fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}>
          ✓ {toast}
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        border: '1px solid rgba(196,145,42,0.18)', borderRadius: 14,
        padding: '20px 24px', marginBottom: 20,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-layout-navbar" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Org Admin</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Navigation Visibility</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{user?.tenantName} · customise which menu items each role can see</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'Visible Items', value: String(visibleCount) },
            { label: 'Hidden',        value: String(ALL_NAV_IDS.length - visibleCount) },
            { label: 'Total Items',   value: String(ALL_NAV_IDS.length) },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '0 18px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {(['editor', 'matrix'] as const).map(t => (
          <button key={t} onClick={() => setView(t)} style={{
            padding: '8px 20px', border: 'none', background: 'none',
            borderBottom: `2px solid ${view === t ? '#c4912a' : 'transparent'}`,
            color: view === t ? '#c4912a' : 'var(--ink2)',
            fontSize: 13, fontWeight: view === t ? 600 : 400, cursor: 'pointer',
          }}>
            {t === 'editor' ? 'Per-role editor' : 'Full matrix'}
          </button>
        ))}
      </div>

      {/* ── Per-role editor ── */}
      {view === 'editor' && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 180px', gap: 20 }}>
          {/* Role selector */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {CONFIGURABLE_ROLES.map(r => {
              const vis = ALL_NAV_IDS.filter(id => getEffectiveVisible(id, r.value)).length;
              const active = selectedRole === r.value;
              return (
                <button key={r.value} onClick={() => setSelectedRole(r.value)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '12px 14px', border: 'none',
                  borderLeft: `3px solid ${active ? r.color : 'transparent'}`,
                  background: active ? r.color + '10' : '#fff',
                  cursor: 'pointer', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ fontWeight: active ? 700 : 400, fontSize: 13, color: active ? r.color : 'var(--ink)' }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>{vis} items visible</div>
                </button>
              );
            })}
          </div>

          {/* Toggle list */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px', background: 'var(--cream)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedRoleMeta.color }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{selectedRoleMeta.label}</span>
                <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{visibleCount} items showing</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isAdmin && overrideCount > 0 && (
                  <button onClick={() => resetRole(selectedRole)} style={{
                    fontSize: 11, padding: '5px 12px', border: '1px solid var(--border)',
                    borderRadius: 6, background: '#fff', cursor: 'pointer', color: 'var(--ink3)',
                  }}>
                    Reset defaults
                  </button>
                )}
              </div>
            </div>

            {TENANT_NAV_SECTIONS.map(sec => (
              <div key={sec.label}>
                <div style={{ padding: '8px 16px 4px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--ink3)', background: '#fafafa', borderBottom: '1px solid var(--border)' }}>
                  {sec.label}
                </div>
                {sec.items.map(item => {
                  const visible = getEffectiveVisible(item.id, selectedRole);
                  const hasOverride = config.getTenantNavOverride(tenantId, selectedRole, item.id) !== null;
                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '10px 16px', borderBottom: '1px solid var(--border)',
                      background: visible ? '#fff' : '#fafafa',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: visible ? 'var(--ink)' : 'var(--ink3)', fontWeight: visible ? 500 : 400 }}>
                            {item.label}
                          </span>
                          {hasOverride && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#dbeafe', color: '#2563eb' }}>
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'monospace' }}>{item.id}</div>
                      </div>
                      <div
                        onClick={() => toggleItem(item.id, selectedRole)}
                        style={{
                          width: 38, height: 22, borderRadius: 11, flexShrink: 0,
                          background: visible ? selectedRoleMeta.color : 'var(--border2)',
                          cursor: isAdmin ? 'pointer' : 'default',
                          position: 'relative', transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 3, left: visible ? 19 : 3,
                          width: 16, height: 16, borderRadius: '50%', background: '#fff',
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Preview */}
          <SidebarPreview tenantId={tenantId} role={selectedRole} />
        </div>
      )}

      {/* ── Full matrix ── */}
      {view === 'matrix' && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ background: 'var(--cream)', borderBottom: '2px solid var(--border)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink3)', width: 220 }}>
                  Nav item
                </th>
                {CONFIGURABLE_ROLES.map(r => (
                  <th key={r.value} style={{ textAlign: 'center', padding: '10px 8px', minWidth: 120, borderLeft: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{r.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TENANT_NAV_SECTIONS.map(sec => (
                <>
                  <tr key={sec.label + '__hdr'} style={{ background: '#f8fafc' }}>
                    <td colSpan={1 + CONFIGURABLE_ROLES.length} style={{ padding: '5px 14px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--ink3)' }}>
                      {sec.label}
                    </td>
                  </tr>
                  {sec.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 14px', fontWeight: 500 }}>
                        {item.label}
                        <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 9, color: 'var(--ink3)' }}>{item.id}</span>
                      </td>
                      {CONFIGURABLE_ROLES.map(r => {
                        const visible = getEffectiveVisible(item.id, r.value);
                        const hasOverride = config.getTenantNavOverride(tenantId, r.value, item.id) !== null;
                        return (
                          <td key={r.value} style={{ textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                            <div
                              onClick={() => toggleItem(item.id, r.value)}
                              style={{
                                display: 'inline-block', width: 34, height: 19, borderRadius: 10,
                                background: visible ? r.color : 'var(--border2)',
                                cursor: isAdmin ? 'pointer' : 'default',
                                position: 'relative', transition: 'background 0.2s',
                                outline: hasOverride ? `2px solid ${r.color}` : 'none',
                                outlineOffset: 1,
                              }}
                            >
                              <div style={{
                                position: 'absolute', top: 2, left: visible ? 17 : 2,
                                width: 15, height: 15, borderRadius: '50%', background: '#fff',
                                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              }} />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isAdmin && (
        <div style={{ marginTop: 20, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
          <i className="ti ti-lock" style={{ marginRight: 8 }} />
          Read-only view — Fleet Admin access required to modify navigation visibility.
        </div>
      )}
    </div>
  );
}
