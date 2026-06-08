'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';

/* ── Nav catalogue (mirrors Sidebar.tsx NAV array) ─────────────────────────── */
const NAV_ITEMS = [
  { id:'real-time',      label:'Live Dashboard',        section:'Real-time ops'    },
  { id:'my-vehicle',     label:'My Vehicle',             section:'Real-time ops'    },
  { id:'map',            label:'Live Map',               section:'Real-time ops'    },
  { id:'playback',       label:'Route Playback',         section:'Real-time ops'    },
  { id:'alerts',         label:'Alerts',                 section:'Real-time ops'    },
  { id:'customers',      label:'Customers',              section:'Fleet management' },
  { id:'vehicles',       label:'Vehicles',               section:'Fleet management' },
  { id:'devices',        label:'Devices & IoT',          section:'Fleet management' },
  { id:'drivers',        label:'Driver Performance',  section:'Fleet management' },
  { id:'routes',         label:'Route Optimisation',     section:'Fleet management' },
  { id:'geofences',      label:'Geofences',              section:'Fleet management' },
  { id:'unauthorized',   label:'Unauthorized Usage',     section:'Fleet management' },
  { id:'maintenance',    label:'Maintenance',            section:'Fleet management' },
  { id:'cost-savings',   label:'Cost Savings',           section:'Cost & efficiency'},
  { id:'analytics',      label:'Analytics',              section:'Cost & efficiency'},
  { id:'reports',        label:'Reports',                section:'Cost & efficiency'},
  { id:'subscription',   label:'Subscription',           section:'SaaS & billing'   },
  { id:'resellers',      label:'Resellers',              section:'SaaS & billing'   },
  { id:'integrations',   label:'Integrations',           section:'Enterprise'       },
  { id:'tenants',        label:'Tenants',                section:'Enterprise'       },
  { id:'branding',       label:'Portal Branding',        section:'Enterprise'       },
  { id:'auth-rbac',      label:'Access Control',         section:'Security & auth'  },
  { id:'auth-mfa',       label:'MFA Settings',           section:'Security & auth'  },
  { id:'auth-sso',       label:'OAuth / SSO',            section:'Security & auth'  },
  { id:'auth-sessions',  label:'Session Management',     section:'Security & auth'  },
  { id:'auth-devices',   label:'Device Auth',            section:'Security & auth'  },
  { id:'tenant-users',   label:'User Management',        section:'Tenant admin'     },
  { id:'tenant-roles',   label:'Custom Roles',           section:'Tenant admin'     },
  { id:'tenant-nav',     label:'Nav Visibility',         section:'Tenant admin'     },
  { id:'branches',       label:'Branch Management',      section:'Tenant admin'     },
  { id:'tenant-config',  label:'System Config',          section:'Tenant admin'     },
  { id:'global-monitor', label:'Global Monitoring',      section:'Platform ops'     },
  { id:'health',         label:'Health Dashboards',      section:'Platform ops'     },
  { id:'sys-config',     label:'System Config',          section:'Platform ops'     },
  { id:'tenant-mgmt',    label:'Tenant Suspension',      section:'Platform ops'     },
  { id:'global-alerts',  label:'Global Alerting',        section:'Platform ops'     },
  { id:'isolation',      label:'Isolation Center',       section:'Platform ops'     },
  { id:'password-policy',label:'Password Policy',        section:'Platform ops'     },
  { id:'module-config',  label:'Module Config',          section:'Platform ops'     },
  { id:'nav-config',     label:'System Role Config',     section:'Platform ops'     },
] as const;
type NavId = (typeof NAV_ITEMS)[number]['id'];
const NAV_SECTIONS = [...new Set(NAV_ITEMS.map(i => i.section))];

/* ── Roles that can be configured (super_admin always sees everything) ──────── */
const NAV_ROLES = [
  { id:'platform_admin', label:'Platform Admin', color:'#db2777' },
  { id:'tenant_admin',   label:'Tenant Admin',   color:'#6366f1' },
  { id:'fleet_admin',    label:'Fleet Admin',    color:'#c4912a' },
  { id:'fleet_manager',  label:'Fleet Manager',  color:'#0891b2' },
  { id:'dispatcher',     label:'Dispatcher',     color:'#2563eb' },
  { id:'billing_admin',  label:'Billing Admin',  color:'#d97706' },
  { id:'partner',        label:'Partner',        color:'#ea580c' },
  { id:'vehicle_owner',  label:'Vehicle Owner',  color:'#16a34a' },
  { id:'viewer',         label:'Viewer',         color:'#6b7280' },
];

/* ── Baseline deny-list (mirrors Sidebar.tsx RESTRICTED) ───────────────────── */
const RESTRICTED: Record<string, string[]> = {
  viewer: [
    'subscription','resellers','devices','integrations','tenants','branding',
    'global-monitor','health','sys-config','tenant-mgmt','global-alerts',
    'auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices',
    'unauthorized','maintenance','routes','map','playback','alerts',
    'analytics','reports','cost-savings','customers','isolation',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  dispatcher: [
    'subscription','resellers','tenants','branding',
    'global-monitor','health','sys-config','tenant-mgmt','global-alerts',
    'auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices',
    'cost-savings','reports','analytics','unauthorized','maintenance',
    'devices','integrations','isolation',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  partner: [
    'global-monitor','health','sys-config','tenant-mgmt','global-alerts',
    'vehicles','drivers','routes','geofences','unauthorized','maintenance',
    'devices','cost-savings','analytics','reports','auth-rbac','auth-mfa',
    'auth-sso','auth-sessions','auth-devices','isolation','tenants',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  billing_admin: [
    'map','playback','alerts','vehicles','drivers','routes','geofences',
    'unauthorized','maintenance','cost-savings','analytics','reports',
    'resellers','devices','integrations','tenants','branding','auth-rbac','auth-mfa',
    'auth-sso','auth-sessions','auth-devices','global-monitor','health',
    'sys-config','tenant-mgmt','global-alerts','isolation',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  fleet_manager: [
    'subscription','resellers','tenants',
    'global-monitor','health','sys-config','tenant-mgmt','global-alerts',
    'auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','devices','integrations',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  tenant_admin: [
    'my-vehicle',
    'resellers','tenants',
    'global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation',
    'nav-config','module-config','password-policy',
  ],
  fleet_admin: [
    'tenants','global-monitor','health','sys-config','tenant-mgmt',
    'global-alerts','isolation','auth-mfa','auth-sso',
    'auth-sessions','auth-devices',
    'nav-config','module-config','password-policy',
  ],
  platform_admin: [
    'subscription','resellers','tenants','global-monitor','health','sys-config',
    'tenant-mgmt','global-alerts','isolation','auth-rbac','auth-mfa',
    'auth-sso','auth-sessions','auth-devices',
    'nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
  vehicle_owner: [
    'real-time','customers','vehicles','devices','cost-savings',
    'resellers','integrations','tenants','branding',
    'auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices',
    'global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation',
    'nav-config','module-config','password-policy',
    'tenant-users','tenant-roles','tenant-nav','branches','tenant-config',
  ],
};

function getDefault(role: string, navId: string): boolean {
  return !(RESTRICTED[role] ?? []).includes(navId);
}

function buildDraft(
  role: string,
  globalNavDefaults: Record<string, boolean>,
): Record<NavId, boolean> {
  return Object.fromEntries(
    NAV_ITEMS.map(item => {
      const key = `${role}:${item.id}`;
      return [item.id, key in globalNavDefaults ? globalNavDefaults[key] : getDefault(role, item.id)];
    }),
  ) as Record<NavId, boolean>;
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════════════════════ */

type ViewMode = 'role' | 'matrix';

export default function NavConfigPage() {
  const { user }  = useAuthStore();
  const config    = useConfigStore();
  const isSA      = user?.role === 'super_admin';

  const [view,          setView]    = useState<ViewMode>('role');
  const [selectedRole,  setRole]    = useState(NAV_ROLES[0].id);
  const [draft,         setDraft]   = useState<Record<NavId, boolean>>(() =>
    buildDraft(NAV_ROLES[0].id, config.globalNavDefaults),
  );
  const [toast, setToast] = useState('');
  const [toastErr, setToastErr] = useState('');

  function showToast(m: string) { setToast(m);    setTimeout(() => setToast(''),    2500); }
  function showErr(m: string)   { setToastErr(m); setTimeout(() => setToastErr(''), 3500); }

  function handleSelectRole(roleId: string) {
    setRole(roleId);
    setDraft(buildDraft(roleId, config.globalNavDefaults));
  }

  function toggleItem(navId: NavId) {
    if (!isSA) return;
    setDraft(prev => ({ ...prev, [navId]: !prev[navId] }));
  }

  function toggleSection(section: string) {
    if (!isSA) return;
    const ids = NAV_ITEMS.filter(i => i.section === section).map(i => i.id) as NavId[];
    const allOn = ids.every(id => draft[id]);
    setDraft(prev => {
      const next = { ...prev };
      ids.forEach(id => { next[id] = !allOn; });
      return next;
    });
  }

  const overrideCount = useMemo(() =>
    NAV_ITEMS.filter(item => draft[item.id] !== getDefault(selectedRole, item.id)).length,
    [draft, selectedRole],
  );

  const visibleCount = useMemo(() => (Object.values(draft) as boolean[]).filter(Boolean).length, [draft]);

  const isDirty = useMemo(() => {
    return NAV_ITEMS.some(item => {
      const key = `${selectedRole}:${item.id}`;
      const saved = key in config.globalNavDefaults
        ? config.globalNavDefaults[key]
        : getDefault(selectedRole, item.id);
      return draft[item.id] !== saved;
    });
  }, [draft, selectedRole, config.globalNavDefaults]);

  function handleApply() {
    try {
      const withoutRole = Object.fromEntries(
        Object.entries(config.globalNavDefaults).filter(([k]) => !k.startsWith(`${selectedRole}:`)),
      );
      const deltas = Object.fromEntries(
        NAV_ITEMS
          .filter(item => draft[item.id] !== getDefault(selectedRole, item.id))
          .map(item => [`${selectedRole}:${item.id}`, draft[item.id]]),
      );
      config.setGlobalNavDefaults({ ...withoutRole, ...deltas });
      showToast(`Nav settings saved for ${NAV_ROLES.find(r => r.id === selectedRole)?.label}`);
    } catch {
      showErr('Failed to save — try again');
    }
  }

  function handleReset() {
    config.resetGlobalNavRole(selectedRole);
    setDraft(buildDraft(selectedRole, {}));
    showToast(`Reset to defaults for ${NAV_ROLES.find(r => r.id === selectedRole)?.label}`);
  }

  const roleColor = NAV_ROLES.find(r => r.id === selectedRole)?.color ?? '#6b7280';

  /* ── Matrix helpers ──────────────────────────────────────────────────────── */
  function matrixValue(roleId: string, navId: NavId): boolean {
    const key = `${roleId}:${navId}`;
    return key in config.globalNavDefaults
      ? config.globalNavDefaults[key]
      : getDefault(roleId, navId);
  }

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:2000, padding:'10px 18px', background:'#1e293b', color:'#fff', borderRadius:8, fontSize:13, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
          ✓ {toast}
        </div>
      )}
      {toastErr && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:2000, padding:'10px 18px', background:'#dc2626', color:'#fff', borderRadius:8, fontSize:13, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
          ✕ {toastErr}
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
            <i className="ti ti-layout-navbar-expand" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Org Admin</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>System Role Config</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Control which sidebar items are visible per role · Super Admin always sees everything</div>
          </div>
        </div>
        {isSA && view === 'role' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isDirty && <span style={{ fontSize: 11, color: '#f5d07a', fontWeight: 600 }}>● Unsaved changes</span>}
            <button onClick={handleReset} style={{ padding: '7px 14px', border: '1px solid rgba(196,145,42,0.35)', borderRadius: 7, background: 'rgba(196,145,42,0.08)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#f5d07a', fontWeight: 500 }}>
              Reset defaults
            </button>
            <button onClick={handleApply} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#c4912a,#d4a23a)', color: '#0d1b2a', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Apply changes
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Nav Items', value: String(NAV_ITEMS.length) },
              { label: 'Roles',     value: String(NAV_ROLES.length) },
            ].map((s, i) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '0 18px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isSA && (
        <div style={{ padding:'8px 14px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, fontSize:12, color:'#92400e', marginBottom:16 }}>
          🔒 Read-only — Super Admin required to modify navigation visibility defaults.
        </div>
      )}

      {/* View toggle */}
      <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:20 }}>
        {(['role','matrix'] as const).map(v => {
          const a = view === v;
          return (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding:'8px 18px', border:'none', fontFamily:'inherit', cursor:'pointer',
                background: a ? 'rgba(196,145,42,0.12)' : 'transparent',
                borderBottom:`2px solid ${a ? '#c4912a' : 'transparent'}`,
                fontSize:13, fontWeight: a ? 700 : 400,
                color: a ? '#c4912a' : 'var(--ink3)',
                borderRadius:'6px 6px 0 0',
              }}>
              {v === 'role' ? '👤 Role editor' : '🔲 Full matrix'}
            </button>
          );
        })}
      </div>

      {/* ── Role editor ─────────────────────────────────────────────────────── */}
      {view === 'role' && (
        <>
          {/* Role tabs */}
          <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:20, overflowX:'auto' }}>
            {NAV_ROLES.map(r => {
              const a = selectedRole === r.id;
              return (
                <button key={r.id} onClick={() => handleSelectRole(r.id)}
                  style={{
                    padding:'7px 14px', border:'none', fontFamily:'inherit', cursor:'pointer', whiteSpace:'nowrap',
                    background: a ? '#f8f8f8' : 'transparent',
                    borderBottom:`2px solid ${a ? r.color : 'transparent'}`,
                    fontSize:12, fontWeight: a ? 700 : 400,
                    color: a ? 'var(--ink)' : 'var(--ink3)',
                    borderRadius:'6px 6px 0 0',
                  }}>
                  <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:r.color, marginRight:6, verticalAlign:'middle' }} />
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:16, marginBottom:16, alignItems:'center' }}>
            <div style={{ fontSize:12, color:'var(--ink3)' }}>
              <strong style={{ color:'var(--ink)', fontSize:14 }}>{visibleCount}</strong>
              <span> / {NAV_ITEMS.length} items visible</span>
            </div>
            {overrideCount > 0 && (
              <span style={{ fontSize:11, padding:'2px 9px', borderRadius:10, background:'#fffbeb', color:'#92400e', border:'1px solid #fcd34d', fontWeight:600 }}>
                {overrideCount} custom override{overrideCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Nav item grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {NAV_SECTIONS.map(section => {
              const items = NAV_ITEMS.filter(i => i.section === section);
              const allOn = items.every(i => draft[i.id]);
              return (
                <div key={section} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', background:'var(--cream)', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--ink3)' }}>{section}</div>
                    {isSA && (
                      <button onClick={() => toggleSection(section)}
                        style={{ fontSize:9, padding:'2px 8px', borderRadius:4, border:'1px solid var(--border)', background:'transparent', color:'var(--ink3)', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                        {allOn ? 'Hide all' : 'Show all'}
                      </button>
                    )}
                  </div>
                  {items.map(item => {
                    const on         = draft[item.id] ?? false;
                    const isOverride = on !== getDefault(selectedRole, item.id);
                    return (
                      <div key={item.id}
                        onClick={() => toggleItem(item.id as NavId)}
                        style={{
                          display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                          borderBottom:'1px solid var(--border)',
                          cursor: isSA ? 'pointer' : 'default',
                          background: on ? '#fff' : '#fafafa',
                        }}
                        onMouseEnter={e => { if (isSA) (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = on ? '#fff' : '#fafafa'; }}>
                        {/* Toggle switch */}
                        <div style={{
                          width:32, height:17, borderRadius:10,
                          background: on ? roleColor : '#d1d5db',
                          position:'relative', flexShrink:0, transition:'background 0.15s',
                        }}>
                          <div style={{
                            position:'absolute', top:2, left: on ? 16 : 2, width:13, height:13,
                            borderRadius:'50%', background:'#fff', transition:'left 0.15s',
                            boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                          }} />
                        </div>
                        <span style={{ flex:1, fontSize:12, color: on ? 'var(--ink)' : 'var(--ink3)', fontWeight: on ? 500 : 400 }}>
                          {item.label}
                        </span>
                        {isOverride && (
                          <span style={{
                            fontSize:9, padding:'1px 6px', borderRadius:3, fontWeight:700,
                            background: on ? '#eff6ff' : '#fef2f2',
                            color:      on ? '#2563eb' : '#dc2626',
                          }}>
                            {on ? 'GRANTED' : 'REVOKED'}
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

      {/* ── Full matrix ─────────────────────────────────────────────────────── */}
      {view === 'matrix' && (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'auto' }}>
          <table style={{ borderCollapse:'collapse', minWidth:'100%' }}>
            <thead>
              <tr>
                <th style={{ padding:'8px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)', position:'sticky', left:0, background:'#fff', zIndex:2, minWidth:180, whiteSpace:'nowrap' }}>
                  Nav item
                </th>
                {NAV_ROLES.map(r => (
                  <th key={r.id} style={{ padding:'8px 10px', textAlign:'center', fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'1px solid var(--border)', minWidth:90, whiteSpace:'nowrap' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:r.color, display:'inline-block' }} />
                      <span style={{ color:'var(--ink)', fontSize:10 }}>{r.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NAV_SECTIONS.map(section => (
                <>
                  <tr key={`sec-${section}`} style={{ background:'var(--cream)' }}>
                    <td colSpan={NAV_ROLES.length + 1} style={{ padding:'5px 14px', fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'1px solid var(--border)' }}>
                      {section}
                    </td>
                  </tr>
                  {NAV_ITEMS.filter(i => i.section === section).map((item, idx) => (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : 'var(--cream)' }}>
                      <td style={{ padding:'8px 14px', fontSize:12, fontWeight:500, position:'sticky', left:0, background: idx % 2 === 0 ? '#fff' : 'var(--cream)', zIndex:1, borderBottom:'1px solid var(--border)', color:'var(--ink2)' }}>
                        {item.label}
                      </td>
                      {NAV_ROLES.map(r => {
                        const on       = matrixValue(r.id, item.id as NavId);
                        const override = on !== getDefault(r.id, item.id);
                        return (
                          <td key={r.id} style={{ padding:'8px 10px', textAlign:'center', borderBottom:'1px solid var(--border)' }}>
                            {on
                              ? <span style={{ fontSize:13, color: override ? r.color : '#c4912a', fontWeight: override ? 700 : 400 }}>✓</span>
                              : <span style={{ fontSize:12, color:'var(--border2)' }}>—</span>
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
          <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--ink3)' }}>
            Coloured ✓ indicates a custom override from the default. Switch to Role editor to make changes.
          </div>
        </div>
      )}
    </div>
  );
}
