'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';

/* ── Module catalogue ───────────────────────────────────────────────────────── */
const ALL_MODULES = [
  { id:'real-time',      label:'Live Dashboard',      section:'Real-time ops'    },
  { id:'my-vehicle',     label:'My Vehicle',           section:'Real-time ops'    },
  { id:'map',            label:'Live Map',             section:'Real-time ops'    },
  { id:'playback',       label:'Route Playback',       section:'Real-time ops'    },
  { id:'alerts',         label:'Alerts',               section:'Real-time ops'    },
  { id:'customers',      label:'Customers',            section:'Fleet management' },
  { id:'vehicles',       label:'Vehicles',             section:'Fleet management' },
  { id:'devices',        label:'Devices & IoT',        section:'Fleet management' },
  { id:'drivers',        label:'Driver Performance',   section:'Fleet management' },
  { id:'routes',         label:'Route Optimisation',   section:'Fleet management' },
  { id:'geofences',      label:'Geofences',            section:'Fleet management' },
  { id:'unauthorized',   label:'Unauthorized Usage',   section:'Fleet management' },
  { id:'maintenance',    label:'Maintenance',          section:'Fleet management' },
  { id:'cost-savings',   label:'Cost Savings',         section:'Analytics'        },
  { id:'analytics',      label:'Analytics',            section:'Analytics'        },
  { id:'reports',        label:'Reports',              section:'Analytics'        },
  { id:'auth-rbac',      label:'RBAC',                 section:'Security and auth'},
  { id:'auth-mfa',       label:'MFA Settings',         section:'Security and auth'},
  { id:'auth-sso',       label:'OAuth / SSO',          section:'Security and auth'},
  { id:'auth-sessions',  label:'Session Management',   section:'Security and auth'},
  { id:'auth-devices',   label:'Device Auth',          section:'Security and auth'},
  { id:'password-policy',label:'Password Policy',      section:'Security and auth'},
  { id:'tenant-users',   label:'User Management',      section:'Org admin'        },
  { id:'tenant-roles',   label:'Custom Roles',         section:'Org admin'        },
  { id:'branches',       label:'Branch Management',    section:'Org admin'        },
  { id:'tenant-nav',     label:'Nav Visibility',       section:'Org admin'        },
  { id:'tenant-config',  label:'System Config',        section:'Org admin'        },
  { id:'module-config',  label:'Module Config',        section:'Org admin'        },
  { id:'nav-config',     label:'Navigation Config',    section:'Org admin'        },
  { id:'integrations',   label:'Integrations',         section:'Enterprise'       },
  { id:'tenants',        label:'Tenants',              section:'Enterprise'       },
  { id:'branding',       label:'Portal Branding',      section:'Enterprise'       },
  { id:'subscription',   label:'Subscription',         section:'SaaS and billing' },
  { id:'resellers',      label:'Resellers',            section:'SaaS and billing' },
  { id:'global-monitor', label:'Global Monitoring',    section:'Platform ops'     },
  { id:'health',         label:'Health Dashboards',    section:'Platform ops'     },
  { id:'sys-config',     label:'Platform Config',      section:'Platform ops'     },
  { id:'tenant-mgmt',    label:'Tenant Suspension',    section:'Platform ops'     },
  { id:'global-alerts',  label:'Global Alerting',      section:'Platform ops'     },
  { id:'isolation',      label:'Isolation Center',     section:'Platform ops'     },
];

/* Default sidebar section order (matches NAV in Sidebar.tsx) */
const DEFAULT_SECTION_ORDER = [
  'Real-time ops',
  'Fleet management',
  'Analytics',
  'Security and auth',
  'Org admin',
  'Enterprise',
  'SaaS and billing',
  'Platform ops',
];

const SECTIONS = DEFAULT_SECTION_ORDER;

/* ── Section icons ────────────────────────────────────────────────────────── */
const SECTION_ICON: Record<string, string> = {
  'Real-time ops':    'ti-layout-dashboard',
  'Fleet management': 'ti-truck',
  'Analytics':        'ti-chart-bar',
  'Security and auth':'ti-shield-lock',
  'Org admin':        'ti-building-community',
  'Enterprise':       'ti-building',
  'SaaS and billing': 'ti-credit-card',
  'Platform ops':     'ti-world',
};

/* ── Drag-and-drop section order editor ─────────────────────────────────── */
function SectionOrderEditor({ order, onChange, readOnly }: {
  order: string[];
  onChange: (o: string[]) => void;
  readOnly: boolean;
}) {
  const dragIdx  = useRef<number | null>(null);
  const overIdx  = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over,     setOver]     = useState<number | null>(null);

  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...order];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  }
  function moveDown(i: number) {
    if (i === order.length - 1) return;
    const next = [...order];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  }

  function onDragStart(i: number) { dragIdx.current = i; setDragging(i); }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    overIdx.current = i;
    setOver(i);
  }
  function onDrop() {
    const from = dragIdx.current;
    const to   = overIdx.current;
    if (from === null || to === null || from === to) { reset(); return; }
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    reset();
  }
  function reset() { dragIdx.current = null; overIdx.current = null; setDragging(null); setOver(null); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {order.map((section, i) => (
        <div
          key={section}
          draggable={!readOnly}
          onDragStart={() => onDragStart(i)}
          onDragOver={e => onDragOver(e, i)}
          onDrop={onDrop}
          onDragEnd={reset}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: over === i && dragging !== i ? '#e0f2fe'
              : dragging === i ? '#f0fdf4'
              : '#fff',
            border: `1px solid ${over === i && dragging !== i ? '#7dd3fc' : 'var(--border)'}`,
            borderRadius: 8,
            cursor: readOnly ? 'default' : 'grab',
            transition: 'background 0.12s, border-color 0.12s',
            userSelect: 'none',
            opacity: dragging === i ? 0.6 : 1,
          }}
        >
          {/* Drag handle */}
          {!readOnly && (
            <span style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>
              <i className="ti ti-grip-vertical" />
            </span>
          )}

          {/* Position badge */}
          <span style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            background: 'rgba(196,145,42,0.12)', color: '#c4912a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>
            {i + 1}
          </span>

          <i className={`ti ${SECTION_ICON[section] ?? 'ti-circle'}`}
            style={{ fontSize: 14, color: '#c4912a', flexShrink: 0 }} />

          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            {section}
          </span>

          {/* Up / Down buttons */}
          {!readOnly && (
            <div style={{ display: 'flex', gap: 3 }}>
              <button
                onClick={() => moveUp(i)}
                disabled={i === 0}
                title="Move up"
                style={{
                  width: 24, height: 24, border: '1px solid var(--border)', borderRadius: 5,
                  background: '#fff', cursor: i === 0 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: i === 0 ? '#d1d5db' : 'var(--ink3)', fontSize: 12,
                }}
              ><i className="ti ti-chevron-up" /></button>
              <button
                onClick={() => moveDown(i)}
                disabled={i === order.length - 1}
                title="Move down"
                style={{
                  width: 24, height: 24, border: '1px solid var(--border)', borderRadius: 5,
                  background: '#fff', cursor: i === order.length - 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: i === order.length - 1 ? '#d1d5db' : 'var(--ink3)', fontSize: 12,
                }}
              ><i className="ti ti-chevron-down" /></button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function ModuleConfigPage() {
  const { user }  = useAuthStore();
  const config    = useConfigStore();
  const isSA      = user?.role === 'super_admin';

  const [tab, setTab] = useState<'modules' | 'order'>('modules');

  // Section order state — initialise from store or default
  const [localOrder, setLocalOrder] = useState<string[]>(() =>
    config.sectionOrder.length > 0 ? config.sectionOrder : DEFAULT_SECTION_ORDER,
  );
  const [orderSaved, setOrderSaved] = useState(false);

  const disabledCount = config.globalDisabledModules.length;
  const enabledCount  = ALL_MODULES.length - disabledCount;

  function toggle(id: string) {
    if (!isSA) return;
    const enabled = !config.globalDisabledModules.includes(id);
    config.setGlobalModuleEnabled(id, !enabled);
  }

  function toggleSection(section: string) {
    if (!isSA) return;
    const ids  = ALL_MODULES.filter(m => m.section === section).map(m => m.id);
    const allOn = ids.every(id => !config.globalDisabledModules.includes(id));
    ids.forEach(id => config.setGlobalModuleEnabled(id, !allOn));
  }

  function saveOrder() {
    config.setSectionOrder(localOrder);
    setOrderSaved(true);
    setTimeout(() => setOrderSaved(false), 2000);
  }

  function resetOrder() {
    setLocalOrder(DEFAULT_SECTION_ORDER);
    config.setSectionOrder([]);
  }

  const isCustomOrder = JSON.stringify(localOrder) !== JSON.stringify(DEFAULT_SECTION_ORDER);

  const sectionStats = useMemo(() =>
    Object.fromEntries(
      SECTIONS.map(s => {
        const ids = ALL_MODULES.filter(m => m.section === s).map(m => m.id);
        const on  = ids.filter(id => !config.globalDisabledModules.includes(id)).length;
        return [s, { on, total: ids.length }];
      }),
    ), [config.globalDisabledModules]);

  const tabBtn = (key: 'modules' | 'order', label: string, icon: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 16px', fontSize: 13, fontWeight: 500,
        borderRadius: 6, border: 'none', cursor: 'pointer',
        background: tab === key ? '#c4912a' : 'transparent',
        color: tab === key ? '#fff' : 'var(--ink3)',
        transition: 'background 0.12s',
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 13 }} />
      {label}
    </button>
  );

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

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
            <i className="ti ti-package" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Org Admin</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Module Config</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Enable/disable modules globally and control sidebar section order</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'Enabled',  value: String(enabledCount) },
            { label: 'Disabled', value: String(ALL_MODULES.length - enabledCount) },
            { label: 'Total',    value: String(ALL_MODULES.length) },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '0 18px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {tabBtn('modules', 'Module visibility', 'ti-package')}
        {tabBtn('order',   'Section order',     'ti-arrows-sort')}
      </div>

      {!isSA && (
        <div style={{ padding: '8px 14px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 12, color: '#92400e', marginBottom: 16 }}>
          🔒 Read-only — Super Admin required to modify global configuration.
        </div>
      )}

      {/* ── Module visibility tab ──────────────────────────────────────── */}
      {tab === 'modules' && (
        <>
          {disabledCount > 0 && (
            <div style={{ padding: '8px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#991b1b', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⚠ <strong>{disabledCount}</strong> module{disabledCount !== 1 ? 's' : ''} currently disabled globally.</span>
              {isSA && (
                <button
                  onClick={() => ALL_MODULES.forEach(m => config.setGlobalModuleEnabled(m.id, true))}
                  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fff', color: '#991b1b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  Enable all
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {SECTIONS.map(section => {
              const mods  = ALL_MODULES.filter(m => m.section === section);
              const stats = sectionStats[section];
              const allOn = stats.on === stats.total;
              return (
                <div key={section} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <i className={`ti ${SECTION_ICON[section] ?? 'ti-circle'}`} style={{ fontSize: 13, color: '#c4912a' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink3)' }}>{section}</span>
                      <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{stats.on}/{stats.total}</span>
                    </div>
                    {isSA && (
                      <button onClick={() => toggleSection(section)}
                        style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        {allOn ? 'Disable all' : 'Enable all'}
                      </button>
                    )}
                  </div>

                  {mods.map(mod => {
                    const enabled = !config.globalDisabledModules.includes(mod.id);
                    return (
                      <div key={mod.id}
                        onClick={() => toggle(mod.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                          borderBottom: '1px solid var(--border)',
                          cursor: isSA ? 'pointer' : 'default',
                          background: enabled ? '#fff' : '#fafafa',
                        }}
                        onMouseEnter={e => { if (isSA) (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = enabled ? '#fff' : '#fafafa'; }}>

                        <div style={{
                          width: 32, height: 17, borderRadius: 10,
                          background: enabled ? '#c4912a' : '#d1d5db',
                          position: 'relative', flexShrink: 0, transition: 'background 0.15s',
                        }}>
                          <div style={{
                            position: 'absolute', top: 2, left: enabled ? 16 : 2, width: 13, height: 13,
                            borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }} />
                        </div>

                        <i className={`ti ti-${moduleIcon(mod.id)}`} style={{ fontSize: 13, color: enabled ? '#c4912a' : 'var(--ink3)', opacity: enabled ? 1 : 0.45, flexShrink: 0 }} />

                        <span style={{ flex: 1, fontSize: 12, color: enabled ? 'var(--ink)' : 'var(--ink3)', fontWeight: enabled ? 500 : 400 }}>
                          {mod.label}
                        </span>

                        {!enabled && (
                          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}>
                            DISABLED
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Section order tab ─────────────────────────────────────────── */}
      {tab === 'order' && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Sidebar section sequence</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
                  {isSA ? 'Drag rows or use arrows to reorder. Changes apply instantly after saving.' : 'Read-only. Contact Super Admin to change section order.'}
                </div>
              </div>
              {config.sectionOrder.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#e0f2fe', color: '#0369a1' }}>
                  Custom order active
                </span>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <SectionOrderEditor
                order={localOrder}
                onChange={isSA ? setLocalOrder : () => {}}
                readOnly={!isSA}
              />
            </div>
          </div>

          {isSA && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={saveOrder}
                style={{
                  padding: '9px 22px', fontSize: 13, fontWeight: 600,
                  background: '#c4912a', color: '#fff',
                  border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {orderSaved ? '✓ Saved' : 'Apply order'}
              </button>
              {isCustomOrder && (
                <button
                  onClick={resetOrder}
                  style={{
                    padding: '9px 16px', fontSize: 13, fontWeight: 500,
                    background: '#fff', color: 'var(--ink3)',
                    border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Reset to default
                </button>
              )}
              {isCustomOrder && (
                <span style={{ fontSize: 12, color: 'var(--ink3)' }}>Unsaved changes</span>
              )}
            </div>
          )}

          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 12, color: '#15803d' }}>
            <strong>Tip:</strong> Drag a row or use the ▲ ▼ buttons to change position. Click <em>Apply order</em> to save. The sidebar updates immediately across all sessions for all users.
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Icon mapping ────────────────────────────────────────────────────────────── */
function moduleIcon(id: string): string {
  const map: Record<string, string> = {
    'real-time':     'layout-dashboard',
    'my-vehicle':    'car',
    'map':           'map-pin',
    'playback':      'player-play',
    'alerts':        'bell',
    'customers':     'building-store',
    'vehicles':      'truck',
    'devices':       'device-analytics',
    'drivers':       'user',
    'routes':        'route',
    'geofences':     'polygon',
    'unauthorized':  'shield-off',
    'maintenance':   'tool',
    'cost-savings':  'trending-down',
    'analytics':     'chart-bar',
    'reports':       'file-analytics',
    'subscription':  'credit-card',
    'resellers':     'building-store',
    'integrations':  'plug',
    'tenants':       'building',
    'branding':      'palette',
    'auth-rbac':     'shield-lock',
    'auth-mfa':      'device-mobile',
    'auth-sso':      'key',
    'auth-sessions': 'lock-access',
    'auth-devices':  'devices',
    'tenant-users':  'users',
    'tenant-roles':  'users-group',
    'tenant-nav':    'layout-navbar',
    'branches':      'building',
    'global-monitor':'world',
    'health':        'heart-rate-monitor',
    'sys-config':    'adjustments-horizontal',
    'tenant-mgmt':   'users-group',
    'global-alerts': 'alert-octagon',
    'isolation':     'shield-check',
    'password-policy':'lock',
    'module-config': 'package',
    'nav-config':    'layout-navbar-expand',
    'tenant-config': 'adjustments-horizontal',
  };
  return map[id] ?? 'circle';
}
