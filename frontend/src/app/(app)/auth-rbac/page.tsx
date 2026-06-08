'use client';

import { useState, useEffect, Fragment } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';
import type { UserRole } from '@/lib/types';
import { api } from '@/lib/api';

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════════════════════════════════════ */

const th: React.CSSProperties = {
  padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1,
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = {
  padding: '11px 14px', fontSize: 13, color: 'var(--ink2)',
  borderBottom: '1px solid var(--border)', verticalAlign: 'middle',
};

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════════════ */

const SYS_MODULES = [
  { id:'real-time',     label:'Live Dashboard',       section:'Real-time ops'    },
  { id:'my-vehicle',    label:'My Vehicle',            section:'Real-time ops'    },
  { id:'map',           label:'Live Map',              section:'Real-time ops'    },
  { id:'playback',      label:'Route Playback',        section:'Real-time ops'    },
  { id:'alerts',        label:'Alerts',                section:'Real-time ops'    },
  { id:'customers',     label:'Customers',             section:'Fleet management' },
  { id:'vehicles',      label:'Vehicles',              section:'Fleet management' },
  { id:'devices',       label:'Devices & IoT',         section:'Fleet management' },
  { id:'drivers',       label:'Driver Performance', section:'Fleet management' },
  { id:'routes',        label:'Route Optimisation',    section:'Fleet management' },
  { id:'geofences',     label:'Geofences',             section:'Fleet management' },
  { id:'unauthorized',  label:'Unauthorized Usage',    section:'Fleet management' },
  { id:'maintenance',   label:'Maintenance',           section:'Fleet management' },
  { id:'analytics',     label:'Analytics',             section:'Analytics'        },
  { id:'reports',       label:'Reports',               section:'Analytics'        },
  { id:'subscription',  label:'Subscription',          section:'SaaS & Billing'   },
  { id:'resellers',     label:'Resellers',             section:'SaaS & Billing'   },
  { id:'integrations',  label:'Integrations',          section:'Enterprise'       },
  { id:'tenants',       label:'Tenants',               section:'Enterprise'       },
  { id:'branding',      label:'Portal Branding',       section:'Enterprise'       },
  { id:'auth-rbac',     label:'RBAC Roles',            section:'Security & Auth'  },
  { id:'auth-mfa',      label:'MFA Settings',          section:'Security & Auth'  },
  { id:'auth-sso',      label:'OAuth / SSO',           section:'Security & Auth'  },
  { id:'auth-sessions', label:'Session Management',    section:'Security & Auth'  },
  { id:'auth-devices',  label:'Device Auth',           section:'Security & Auth'  },
  { id:'tenant-users',  label:'User Management',       section:'User management'  },
  { id:'tenant-roles',  label:'Custom Roles',          section:'User management'  },
  { id:'tenant-nav',    label:'Nav Visibility',        section:'User management'  },
  { id:'branches',      label:'Branch Management',     section:'User management'  },
  { id:'tenant-config', label:'System Config',         section:'User management'  },
  { id:'global-monitor',label:'Global Monitoring',     section:'Platform ops'     },
  { id:'health',        label:'Health Dashboards',     section:'Platform ops'     },
  { id:'sys-config',    label:'System Config',         section:'Platform ops'     },
  { id:'tenant-mgmt',   label:'Tenant Suspension',     section:'Platform ops'     },
  { id:'global-alerts', label:'Global Alerting',       section:'Platform ops'     },
  { id:'isolation',     label:'Isolation Center',      section:'Platform ops'     },
  { id:'module-config',    label:'Module Config',      section:'Platform ops'     },
  { id:'nav-config',       label:'System Role Config', section:'Platform ops'     },
  { id:'password-policy',  label:'Password Policy',    section:'Platform ops'     },
];
const SYS_ALL_IDS  = SYS_MODULES.map(m => m.id);
const SYS_SECTIONS = [...new Set(SYS_MODULES.map(m => m.section))];

const SYS_DENIED: Record<string, string[]> = {
  super_admin:    [],
  platform_admin: ['subscription','resellers','tenants','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config'],
  tenant_admin:   ['resellers','tenants','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','nav-config','module-config','password-policy'],
  fleet_admin:    ['tenants','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','nav-config','password-policy'],
  fleet_manager:  ['subscription','resellers','tenants','global-monitor','health','sys-config','tenant-mgmt','global-alerts','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','devices','integrations','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  dispatcher:     ['subscription','resellers','tenants','branding','global-monitor','health','sys-config','tenant-mgmt','global-alerts','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','cost-savings','reports','analytics','unauthorized','maintenance','devices','integrations','isolation','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  vehicle_owner:  ['real-time','customers','vehicles','devices','cost-savings','resellers','integrations','tenants','branding','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  viewer:         ['subscription','resellers','devices','integrations','tenants','branding','global-monitor','health','sys-config','tenant-mgmt','global-alerts','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','unauthorized','maintenance','routes','map','playback','alerts','analytics','reports','cost-savings','customers','isolation','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  billing_admin:  ['map','playback','alerts','vehicles','drivers','routes','geofences','unauthorized','maintenance','cost-savings','analytics','reports','resellers','devices','integrations','tenants','branding','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','global-monitor','health','sys-config','tenant-mgmt','global-alerts','isolation','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
  partner:        ['global-monitor','health','sys-config','tenant-mgmt','global-alerts','vehicles','drivers','routes','geofences','unauthorized','maintenance','devices','cost-savings','analytics','reports','auth-rbac','auth-mfa','auth-sso','auth-sessions','auth-devices','isolation','tenants','my-vehicle','nav-config','tenant-users','tenant-roles','tenant-nav','branches','tenant-config','password-policy'],
};
function getSysAllowed(roleId: string) {
  const denied = new Set(SYS_DENIED[roleId] ?? []);
  return SYS_ALL_IDS.filter(id => !denied.has(id));
}

const COLOR_PALETTE = ['#7c3aed','#db2777','#c4912a','#2563eb','#16a34a','#d97706','#6b7280','#0891b2','#dc2626','#9333ea','#ea580c','#0f766e'];

interface SysRoleDef { id: string; label: string; color: string; description: string; isSystem: boolean; userCount: number; }
type SysRoleState = SysRoleDef & { allowed: string[] };

const SYSTEM_ROLES: SysRoleDef[] = [
  { id:'super_admin',    label:'Super Admin',    color:'#7c3aed', userCount:1,  isSystem:true, description:'Full unrestricted platform access. Manages all tenants, roles, and global system configuration.' },
  { id:'platform_admin', label:'Platform Admin', color:'#db2777', userCount:2,  isSystem:true, description:'Multi-tenant management and platform oversight. Cannot manage billing or sub-tenant isolation.' },
  { id:'tenant_admin',   label:'Tenant Admin',   color:'#6366f1', userCount:4,  isSystem:true, description:'Full administrator of a tenant organisation. Manages users, roles, billing, security, branding, and all fleet operations scoped to their tenant.' },
  { id:'fleet_admin',    label:'Fleet Admin',    color:'#c4912a', userCount:3,  isSystem:true, description:'Full fleet management including auth setup. Scoped to their tenant.' },
  { id:'fleet_manager',  label:'Fleet Manager',  color:'#0891b2', userCount:5,  isSystem:true, description:'Operational fleet management — vehicles, drivers, routes, and analytics.' },
  { id:'dispatcher',     label:'Dispatcher',     color:'#2563eb', userCount:4,  isSystem:true, description:'Live monitoring and real-time operations. No admin or financial controls.' },
  { id:'vehicle_owner',  label:'Vehicle Owner',  color:'#16a34a', userCount:12, isSystem:true, description:'Individual user scoped to their own vehicle. Can view own routes, geofences, and maintenance.' },
  { id:'viewer',         label:'Viewer',         color:'#6b7280', userCount:8,  isSystem:true, description:'Read-only access to vehicles and drivers. No operational controls.' },
  { id:'billing_admin',  label:'Billing Admin',  color:'#d97706', userCount:1,  isSystem:true, description:'Manages subscriptions and reporting. No fleet operational access.' },
  { id:'partner',        label:'Partner',        color:'#0891b2', userCount:2,  isSystem:true, description:'Reseller portal — vehicles, reports, and subscription management.' },
];

interface SysFormState { id: string; label: string; color: string; description: string; allowed: string[]; }
const SYS_EMPTY: SysFormState = { id:'', label:'', color:'#c4912a', description:'', allowed:[] };
function toKey(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function SysPermMatrix({ allowed, onChange, readonly }: { allowed: string[]; onChange?: (n: string[]) => void; readonly?: boolean }) {
  const set = new Set(allowed);
  const toggle = (id: string) => {
    if (readonly || !onChange) return;
    onChange(set.has(id) ? allowed.filter(x => x !== id) : [...allowed, id]);
  };
  const toggleSection = (sec: string) => {
    if (readonly || !onChange) return;
    const ids = SYS_MODULES.filter(m => m.section === sec).map(m => m.id);
    const allOn = ids.every(id => set.has(id));
    onChange(allOn ? allowed.filter(id => !ids.includes(id)) : [...new Set([...allowed, ...ids])]);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {SYS_SECTIONS.map(sec => {
        const mods = SYS_MODULES.filter(m => m.section === sec);
        const allOn = mods.every(m => set.has(m.id));
        return (
          <div key={sec}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8 }}>{sec}</div>
              {!readonly && <button onClick={() => toggleSection(sec)} style={{ fontSize:9, padding:'1px 6px', borderRadius:3, border:'1px solid var(--border)', background:'transparent', color:'var(--ink3)', cursor:'pointer', fontFamily:'inherit' }}>{allOn ? 'Clear' : 'All'}</button>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 8px' }}>
              {mods.map(m => (
                <label key={m.id} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, cursor: readonly ? 'default' : 'pointer', color: set.has(m.id) ? 'var(--ink)' : 'var(--ink3)' }}>
                  <input type="checkbox" checked={set.has(m.id)} onChange={() => toggle(m.id)} disabled={readonly} style={{ accentColor:'#c4912a', width:12, height:12 }} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SysRoleModal({ mode, initial, existingIds, onSave, onClose }: {
  mode: 'create' | 'edit'; initial: SysFormState; existingIds: string[];
  onSave: (f: SysFormState) => void; onClose: () => void;
}) {
  const [f, setF] = useState<SysFormState>(initial);
  const idValid = mode === 'edit' || (f.id.length >= 2 && !existingIds.includes(f.id));
  const canSave = f.label.trim() && idValid;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:14, width:'92vw', maxWidth:860, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:15, fontWeight:700 }}>{mode === 'create' ? '+ Create Role' : `✏ Edit — ${initial.label}`}</div>
          <button onClick={onClose} style={{ fontSize:18, color:'var(--ink3)', background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          <div style={{ width:280, flexShrink:0, padding:'18px 20px', borderRight:'1px solid var(--border)', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
            {mode === 'create' && (
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Role key *</label>
                <input value={f.id} onChange={e => setF(p => ({ ...p, id: toKey(e.target.value) }))} placeholder="e.g. field_agent"
                  style={{ width:'100%', padding:'8px 10px', border:`1px solid ${f.id && !idValid ? 'var(--red)' : 'var(--border)'}`, borderRadius:6, fontSize:13, fontFamily:'monospace', boxSizing:'border-box', outline:'none' }} />
                {f.id && existingIds.includes(f.id) && <div style={{ fontSize:10, color:'var(--red)', marginTop:3 }}>Key already exists</div>}
              </div>
            )}
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Display label *</label>
              <input value={f.label} onChange={e => setF(p => ({ ...p, label:e.target.value }))} placeholder="e.g. Field Agent"
                style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, fontFamily:'inherit', boxSizing:'border-box', outline:'none' }} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:6 }}>Colour</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {COLOR_PALETTE.map(c => (
                  <button key={c} onClick={() => setF(p => ({ ...p, color:c }))} style={{ width:26, height:26, borderRadius:'50%', background:c, border:`3px solid ${f.color === c ? '#fff' : c}`, outline: f.color === c ? `2px solid ${c}` : 'none', cursor:'pointer', flexShrink:0 }} />
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Description</label>
              <textarea value={f.description} onChange={e => setF(p => ({ ...p, description:e.target.value }))} rows={4} placeholder="Describe this role…"
                style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', outline:'none' }} />
            </div>
            <div style={{ padding:'10px 12px', background:'var(--cream)', borderRadius:8, fontSize:11, color:'var(--ink3)' }}>
              <strong style={{ color:'var(--ink2)' }}>{f.allowed.length}</strong> of {SYS_ALL_IDS.length} modules enabled
            </div>
          </div>
          <div style={{ flex:1, padding:'18px 20px', overflowY:'auto' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:14 }}>Module permissions</div>
            <SysPermMatrix allowed={f.allowed} onChange={next => setF(p => ({ ...p, allowed:next }))} />
          </div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10, background:'#fafafa' }}>
          <button onClick={onClose} style={{ padding:'8px 20px', fontSize:13, borderRadius:7, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={() => canSave && onSave(f)} disabled={!canSave} style={{ padding:'8px 22px', fontSize:13, fontWeight:600, borderRadius:7, border:'none', fontFamily:'inherit', background: canSave ? '#c4912a' : 'var(--border)', color: canSave ? '#fff' : 'var(--ink3)', cursor: canSave ? 'pointer' : 'not-allowed' }}>
            {mode === 'create' ? 'Create role' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SysDeleteModal({ role, onConfirm, onClose }: { role: SysRoleState; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:12, width:420, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:15, fontWeight:700 }}>Delete role</div>
        </div>
        <div style={{ padding:'20px' }}>
          <div style={{ padding:'12px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, fontSize:13, color:'#991b1b', marginBottom:16 }}>
            ⚠ Permanently delete <strong>{role.label}</strong>? Users lose access.
          </div>
          <div style={{ fontSize:13, color:'var(--ink2)' }}>
            <div><span style={{ color:'var(--ink3)' }}>Role key:</span> <code style={{ background:'var(--cream)', padding:'1px 5px', borderRadius:3 }}>{role.id}</code></div>
            <div style={{ marginTop:4 }}><span style={{ color:'var(--ink3)' }}>Assigned users:</span> <strong>{role.userCount}</strong></div>
          </div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10, background:'#fafafa' }}>
          <button onClick={onClose} style={{ padding:'8px 20px', fontSize:13, borderRadius:7, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:'8px 20px', fontSize:13, fontWeight:600, borderRadius:7, border:'none', background:'var(--red)', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>Delete role</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════════ */

type SubTab = 'roles' | 'matrix';

export default function RbacPage() {
  const { user }   = useAuthStore();
  const config     = useConfigStore();
  const isSuperAdmin = user?.role === 'super_admin';

  // Initialise with hardcoded system roles + any custom roles persisted in
  // configStore from previous sessions; API response overwrites permissions.
  const [sysRoles,      setSysRoles]      = useState<SysRoleState[]>(() => [
    ...SYSTEM_ROLES.map(r => ({ ...r, allowed: getSysAllowed(r.id) })),
    ...config.rbacCustomRoles.map(r => ({
      ...r, isSystem: false,
      // Use the persisted allowed list; fall back to empty (safe default) rather
      // than granting all modules to unknown role IDs via getSysAllowed.
      allowed: config.rbacAllowedModules[r.id] ?? [],
    })),
  ]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [activeTab,     setActiveTab]     = useState<SubTab>('roles');
  const [sysModal,      setSysModal]      = useState<{ mode:'create' } | { mode:'edit'; role:SysRoleState } | null>(null);
  const [sysDeleteRole, setSysDeleteRole] = useState<SysRoleState | null>(null);
  const [sysExpanded,   setSysExpanded]   = useState<string | null>(null);
  const [toast,         setToast]         = useState('');
  const [toastError,    setToastError]    = useState('');

  // ── Load permissions from API on mount ─────────────────────────────────
  useEffect(() => {
    api.rbac.getPermissions()
      .then(data => {
        const map = new Map(data.map(d => [d.roleId, d.allowedModules]));
        setSysRoles(prev => prev.map(r => ({
          ...r,
          allowed: map.get(r.id) ?? r.allowed,
        })));
      })
      .catch(() => { /* keep hardcoded defaults on API error */ })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }
  function showError(msg: string) { setToastError(msg); setTimeout(() => setToastError(''), 3500); }

  function handleSysSave(f: SysFormState) {
    // Optimistic local update — UI reflects immediately
    if (sysModal?.mode === 'create') {
      setSysRoles(r => [...r, { id:f.id, label:f.label, color:f.color, description:f.description, isSystem:false, userCount:0, allowed:f.allowed }]);
      showToast(`Role "${f.label}" created`);
    } else if (sysModal?.mode === 'edit') {
      setSysRoles(r => r.map(x => x.id === f.id ? { ...x, label:f.label, color:f.color, description:f.description, allowed:f.allowed } : x));
      showToast(`Role "${f.label}" updated`);
    }
    setSysModal(null);

    // Persist role definition to configStore so it survives page refresh
    // and is available for assignment in the User Management page.
    if (!SYSTEM_ROLES.some(r => r.id === f.id)) {
      config.upsertRbacCustomRole({
        id: f.id, label: f.label, color: f.color,
        description: f.description, userCount: 0,
      });
    }

    // Update configStore immediately so sidebar visibility reflects the change.
    config.updateRbacRole(f.id, f.allowed);

    // Persist to backend — fire and catch
    setSaving(true);
    api.rbac.updatePermissions(f.id, f.allowed)
      .catch(() => showError(`Failed to save "${f.label}" to database — try again`))
      .finally(() => setSaving(false));
  }
  function handleSysDelete() {
    if (!sysDeleteRole) return;
    setSysRoles(r => r.filter(x => x.id !== sysDeleteRole.id));
    showToast(`Role "${sysDeleteRole.label}" deleted`);
    // Remove from configStore if it was a custom role
    if (!sysDeleteRole.isSystem) {
      config.deleteRbacCustomRole(sysDeleteRole.id);
    }
    setSysDeleteRole(null);
  }

  function tabStyle(t: SubTab): React.CSSProperties {
    const a = activeTab === t;
    return {
      padding:'8px 18px', border:'none', fontFamily:'inherit', cursor:'pointer',
      background: a ? 'rgba(196,145,42,0.12)' : 'transparent',
      borderBottom:`2px solid ${a ? '#c4912a' : 'transparent'}`,
      fontSize:13, fontWeight: a ? 700 : 400,
      color: a ? '#c4912a' : 'var(--ink3)',
      borderRadius:'6px 6px 0 0',
    };
  }

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>

      {/* Success toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:2000, padding:'10px 18px', background:'#c4912a', color:'#fff', borderRadius:8, fontSize:13, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
          ✓ {toast}
        </div>
      )}
      {/* Error toast */}
      {toastError && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:2000, padding:'10px 18px', background:'var(--red)', color:'#fff', borderRadius:8, fontSize:13, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
          ✕ {toastError}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height:52, borderRadius:8, background:'var(--cream3)', animation:'pulse 1.4s ease-in-out infinite', opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      )}

      {!loading && <>

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 14,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:9, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-shield-lock" style={{ fontSize:20, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Security &amp; Auth</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#fff', lineHeight:1 }}>RBAC Roles</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2, display:'flex', alignItems:'center', gap:8 }}>
              {sysRoles.filter(r => r.isSystem).length} system · {sysRoles.filter(r => !r.isSystem).length} custom roles
              {saving && <span style={{ fontSize:10, color:'#f5d07a', fontWeight:600 }}>· saving…</span>}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {[
            { label:'Total',  value: sysRoles.length,                          icon:'ti-users-group' },
            { label:'System', value: sysRoles.filter(r => r.isSystem).length,  icon:'ti-lock' },
            { label:'Custom', value: sysRoles.filter(r => !r.isSystem).length, icon:'ti-pencil' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center', padding:'0 16px', borderLeft:'1px solid rgba(196,145,42,0.20)' }}>
              <i className={`ti ${s.icon}`} style={{ fontSize:12, color:'rgba(245,208,122,0.55)', display:'block', marginBottom:3 }} />
              <div style={{ fontSize:20, fontWeight:800, color:'#fff', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:9, color:'rgba(245,208,122,0.55)', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
          {isSuperAdmin && (
            <div style={{ paddingLeft:16, borderLeft:'1px solid rgba(196,145,42,0.20)', display:'flex', alignItems:'center' }}>
              <button onClick={() => setSysModal({ mode:'create' })} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'7px 14px', fontSize:12, fontWeight:600,
                borderRadius:7, border:'1px solid rgba(196,145,42,0.35)',
                background:'rgba(196,145,42,0.15)', color:'#f5d07a',
                cursor:'pointer', fontFamily:'inherit',
              }}>
                <i className="ti ti-plus" style={{ fontSize:13 }} /> New role
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Read-only banner for non-super-admins */}
      {!isSuperAdmin && (
        <div style={{ padding:'8px 14px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, fontSize:12, color:'#92400e', marginBottom:16 }}>
          🔒 Read-only — Super Admin required to create or modify system roles.
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:20 }}>
        <button style={tabStyle('roles')}  onClick={() => setActiveTab('roles')}>👤 Roles</button>
        <button style={tabStyle('matrix')} onClick={() => setActiveTab('matrix')}>🔲 Permission matrix</button>
      </div>

      {/* ── Roles list ─────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Role','Type','Users','Description','Access',''].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {sysRoles.map(r => {
                const isExp = sysExpanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr onClick={() => setSysExpanded(isExp ? null : r.id)}
                      style={{ cursor:'pointer', background: isExp ? 'rgba(196,145,42,0.12)' : '#fff', transition:'background 0.1s' }}
                      onMouseEnter={e => { if(!isExp)(e.currentTarget as HTMLElement).style.background='var(--cream)'; }}
                      onMouseLeave={e => { if(!isExp)(e.currentTarget as HTMLElement).style.background='#fff'; }}>
                      <td style={{ ...td, fontWeight:600 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <span style={{ width:10, height:10, borderRadius:'50%', background:r.color, flexShrink:0, display:'inline-block' }} />
                          <span style={{ color: isExp ? '#c4912a' : 'var(--ink)' }}>{r.label}</span>
                        </div>
                        <div style={{ fontSize:10, color:'var(--ink3)', marginLeft:19, fontFamily:'monospace', marginTop:1 }}>{r.id}</div>
                      </td>
                      <td style={td}>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, background: r.isSystem ? '#f5f3ff' : '#fffbeb', color: r.isSystem ? '#7c3aed' : '#d97706' }}>
                          {r.isSystem ? '🔒 System' : '✎ Custom'}
                        </span>
                      </td>
                      <td style={{ ...td, fontWeight: r.userCount > 0 ? 600 : 400, color: r.userCount > 0 ? 'var(--ink)' : 'var(--ink3)' }}>{r.userCount}</td>
                      <td style={{ ...td, maxWidth:260, color:'var(--ink3)', fontSize:12 }}>{r.description}</td>
                      <td style={td}>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                          {r.allowed.slice(0,4).map(id => {
                            const m = SYS_MODULES.find(x => x.id === id);
                            return m ? <span key={id} style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius:3, background:'rgba(196,145,42,0.12)', color:'#c4912a' }}>{m.label}</span> : null;
                          })}
                          {r.allowed.length > 4 && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:'var(--cream3)', color:'var(--ink3)' }}>+{r.allowed.length - 4}</span>}
                        </div>
                      </td>
                      <td style={td} onClick={e => e.stopPropagation()}>
                        {isSuperAdmin && (
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={() => setSysModal({ mode:'edit', role:r })}
                              style={{ padding:'5px 10px', border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                              <i className="ti ti-pencil" />
                            </button>
                            {!r.isSystem && (
                              <button onClick={() => setSysDeleteRole(r)}
                                style={{ padding:'5px 10px', border:'1px solid #fca5a5', borderRadius:6, background:'#fff', color:'#dc2626', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                                <i className="ti ti-trash" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    {isExp && (
                      <tr style={{ background:'var(--cream)' }}>
                        <td colSpan={6} style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)', marginBottom:10 }}>All module access ({r.allowed.length} of {SYS_ALL_IDS.length})</div>
                          <SysPermMatrix allowed={r.allowed} readonly />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Permission matrix ──────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'auto' }}>
          <table style={{ borderCollapse:'collapse', minWidth:'100%' }}>
            <thead>
              <tr>
                <th style={{ ...th, position:'sticky', left:0, background:'#fff', zIndex:2, minWidth:180 }}>Module</th>
                {sysRoles.map(r => (
                  <th key={r.id} style={{ ...th, textAlign:'center', minWidth:100 }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:r.color, display:'inline-block' }} />
                      <span style={{ fontSize:10, color:'var(--ink)', fontWeight:600 }}>{r.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SYS_SECTIONS.map(sec => (
                <Fragment key={sec}>
                  <tr style={{ background:'var(--cream)' }}>
                    <td colSpan={sysRoles.length + 1} style={{ padding:'6px 14px', fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'1px solid var(--border)' }}>{sec}</td>
                  </tr>
                  {SYS_MODULES.filter(m => m.section === sec).map((m, i) => (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : 'var(--cream)' }}>
                      <td style={{ ...td, fontWeight:500, position:'sticky', left:0, background: i % 2 === 0 ? '#fff' : 'var(--cream)', zIndex:1, fontSize:12 }}>{m.label}</td>
                      {sysRoles.map(r => {
                        const has = r.allowed.includes(m.id);
                        return (
                          <td key={r.id} style={{ ...td, textAlign:'center' }}>
                            {has ? <span style={{ fontSize:14, color:'#c4912a' }}>✓</span> : <span style={{ fontSize:12, color:'var(--border2)' }}>—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {sysModal?.mode === 'create' && (
        <SysRoleModal mode="create" initial={SYS_EMPTY} existingIds={sysRoles.map(r => r.id)} onSave={handleSysSave} onClose={() => setSysModal(null)} />
      )}
      {sysModal?.mode === 'edit' && (
        <SysRoleModal mode="edit"
          initial={{ id:sysModal.role.id, label:sysModal.role.label, color:sysModal.role.color, description:sysModal.role.description, allowed:sysModal.role.allowed }}
          existingIds={sysRoles.map(r => r.id).filter(id => id !== sysModal.role.id)}
          onSave={handleSysSave} onClose={() => setSysModal(null)} />
      )}
      {sysDeleteRole && <SysDeleteModal role={sysDeleteRole} onConfirm={handleSysDelete} onClose={() => setSysDeleteRole(null)} />}

      </>} {/* end !loading */}
    </div>
  );
}
