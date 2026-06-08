'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';
import type { TenantCustomRole, ModulePermission } from '@/lib/tenantRoles';
import {
  TENANT_MODULES, MODULE_FEATURES,
  emptyPermissions, emptyFeaturePermissions, defaultFeaturePermissions,
} from '@/lib/tenantRoles';

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const SECTIONS = [...new Set(TENANT_MODULES.map(m => m.section))];
const COLOR_PALETTE = [
  '#7c3aed','#db2777','#c4912a','#2563eb','#16a34a',
  '#d97706','#6b7280','#0891b2','#dc2626','#9333ea','#ea580c','#0f766e',
];

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

type CrudKey = 'create' | 'read' | 'update' | 'delete';
const CRUD: CrudKey[] = ['create','read','update','delete'];
const CRUD_LABEL: Record<CrudKey, string> = { create:'C', read:'R', update:'U', delete:'D' };

function getPerm(permissions: ModulePermission[], moduleId: string): ModulePermission {
  return permissions.find(p => p.moduleId === moduleId)
    ?? { moduleId, create:false, read:false, update:false, delete:false };
}

function setPerm(
  permissions: ModulePermission[],
  moduleId: string,
  key: CrudKey,
  value: boolean,
): ModulePermission[] {
  const existing = getPerm(permissions, moduleId);
  const updated  = { ...existing, [key]: value };
  const others   = permissions.filter(p => p.moduleId !== moduleId);
  return [...others, updated];
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const th: React.CSSProperties = {
  padding:'7px 10px', textAlign:'left', fontSize:10, fontWeight:700,
  color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8,
  borderBottom:'1px solid var(--border)', whiteSpace:'nowrap',
};

/* ── Permission matrix component ────────────────────────────────────────────── */
function TenantPermMatrix({
  permissions, onChange, readonly,
}: {
  permissions: ModulePermission[];
  onChange?: (next: ModulePermission[]) => void;
  readonly?: boolean;
}) {
  function toggleAll(moduleId: string) {
    if (readonly || !onChange) return;
    const p   = getPerm(permissions, moduleId);
    const on  = CRUD.every(k => p[k]);
    let updated = permissions;
    CRUD.forEach(k => { updated = setPerm(updated, moduleId, k, !on); });
    onChange(updated);
  }
  function toggleCrud(moduleId: string, key: CrudKey) {
    if (readonly || !onChange) return;
    const p = getPerm(permissions, moduleId);
    onChange(setPerm(permissions, moduleId, key, !p[key]));
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 26px 26px 26px 26px', gap:4, padding:'5px 10px', background:'var(--cream)', borderBottom:'1px solid var(--border)', fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8 }}>
        <div>Module</div>
        {CRUD.map(k => <div key={k} style={{ textAlign:'center' }}>{CRUD_LABEL[k]}</div>)}
      </div>

      {SECTIONS.map(sec => (
        <div key={sec}>
          <div style={{ padding:'4px 10px', background:'#f5f5f5', fontSize:9, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)' }}>
            {sec}
          </div>
          {TENANT_MODULES.filter(m => m.section === sec).map((mod, idx) => {
            const p   = getPerm(permissions, mod.id);
            const all = CRUD.every(k => p[k]);
            return (
              <div key={mod.id}
                style={{ display:'grid', gridTemplateColumns:'1fr 26px 26px 26px 26px', gap:4, padding:'6px 10px', alignItems:'center', background: idx % 2 === 0 ? '#fff' : 'var(--cream)', borderBottom:'1px solid var(--border)' }}>
                <span
                  onClick={() => toggleAll(mod.id)}
                  style={{ fontSize:11, color: all ? 'var(--ink)' : 'var(--ink3)', fontWeight: all ? 500 : 400, cursor: readonly ? 'default' : 'pointer' }}>
                  {mod.label}
                </span>
                {CRUD.map(k => (
                  <div key={k} style={{ display:'flex', justifyContent:'center' }}>
                    <input
                      type="checkbox"
                      checked={!!p[k]}
                      disabled={readonly}
                      onChange={() => toggleCrud(mod.id, k)}
                      style={{ accentColor:'#c4912a', width:13, height:13, cursor: readonly ? 'default' : 'pointer' }}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── Feature permissions panel ──────────────────────────────────────────────── */
function FeaturePanel({
  featurePermissions, onChange, readonly,
}: {
  featurePermissions: Record<string, boolean>;
  onChange?: (next: Record<string, boolean>) => void;
  readonly?: boolean;
}) {
  const moduleIds = Object.keys(MODULE_FEATURES) as (keyof typeof MODULE_FEATURES)[];

  function toggle(featureId: string) {
    if (readonly || !onChange) return;
    onChange({ ...featurePermissions, [featureId]: !featurePermissions[featureId] });
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {moduleIds.map(modId => {
        const features = MODULE_FEATURES[modId];
        if (!features?.length) return null;
        return (
          <div key={modId} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
            <div style={{ padding:'7px 12px', background:'var(--cream)', borderBottom:'1px solid var(--border)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, color:'var(--ink3)' }}>
              {TENANT_MODULES.find(m => m.id === modId)?.label ?? modId}
            </div>
            {features.map(f => {
              const on = featurePermissions[f.id] ?? false;
              return (
                <div key={f.id}
                  onClick={() => toggle(f.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderBottom:'1px solid var(--border)', cursor: readonly ? 'default' : 'pointer' }}
                  onMouseEnter={e => { if (!readonly) (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}>
                  <div style={{ width:28, height:15, borderRadius:8, background: on ? '#c4912a' : '#d1d5db', position:'relative', flexShrink:0, transition:'background 0.15s' }}>
                    <div style={{ position:'absolute', top:1.5, left: on ? 13 : 1.5, width:12, height:12, borderRadius:'50%', background:'#fff', transition:'left 0.15s', boxShadow:'0 1px 2px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight: on ? 600 : 400, color: on ? 'var(--ink)' : 'var(--ink3)' }}>{f.label}</div>
                    <div style={{ fontSize:10, color:'var(--ink3)', marginTop:1 }}>{f.description}</div>
                  </div>
                  <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background: on ? 'rgba(196,145,42,0.12)' : '#f3f4f6', color: on ? '#c4912a' : 'var(--ink3)', fontWeight:700, textTransform:'uppercase' }}>
                    {f.crudType}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ── Role modal ─────────────────────────────────────────────────────────────── */
type ModalTab = 'modules' | 'features';

interface RoleForm {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  permissions: ModulePermission[];
  featurePermissions: Record<string, boolean>;
}

function RoleModal({
  mode, initial, existingIds, tenantId,
  onSave, onClose,
}: {
  mode: 'create' | 'edit';
  initial: RoleForm;
  existingIds: string[];
  tenantId: string;
  onSave: (f: RoleForm) => void;
  onClose: () => void;
}) {
  const [f,    setF]   = useState<RoleForm>(initial);
  const [tab,  setTab] = useState<ModalTab>('modules');

  const slugValid  = mode === 'edit' || (f.slug.length >= 2 && !existingIds.includes(f.slug));
  const canSave    = f.name.trim().length > 0 && slugValid;
  const enabledCnt = f.permissions.filter(p => CRUD.some(k => p[k])).length;
  const featureCnt = Object.values(f.featurePermissions).filter(Boolean).length;

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:14, width:'96vw', maxWidth:920, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>

        {/* Modal header */}
        <div style={{ padding:'15px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:15, fontWeight:700 }}>
            {mode === 'create' ? '+ New Custom Role' : `✏ Edit — ${initial.name}`}
          </div>
          <button onClick={onClose} style={{ fontSize:18, color:'var(--ink3)', background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Left: metadata */}
          <div style={{ width:260, flexShrink:0, padding:'16px 18px', borderRight:'1px solid var(--border)', overflowY:'auto', display:'flex', flexDirection:'column', gap:13 }}>

            {mode === 'create' && (
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Slug *</label>
                <input value={f.slug}
                  onChange={e => setF(p => ({ ...p, slug: toSlug(e.target.value) }))}
                  placeholder="e.g. field_agent"
                  style={{ width:'100%', padding:'7px 9px', border:`1px solid ${f.slug && !slugValid ? 'var(--red)' : 'var(--border)'}`, borderRadius:6, fontSize:12, fontFamily:'monospace', boxSizing:'border-box', outline:'none' }} />
                {f.slug && existingIds.includes(f.slug) && (
                  <div style={{ fontSize:10, color:'var(--red)', marginTop:2 }}>Slug already exists</div>
                )}
              </div>
            )}

            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Role name *</label>
              <input value={f.name}
                onChange={e => setF(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Field Agent"
                style={{ width:'100%', padding:'7px 9px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, fontFamily:'inherit', boxSizing:'border-box', outline:'none' }} />
            </div>

            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:6 }}>Colour</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {COLOR_PALETTE.map(c => (
                  <button key={c} onClick={() => setF(p => ({ ...p, color: c }))}
                    style={{ width:24, height:24, borderRadius:'50%', background:c, border:`3px solid ${f.color === c ? '#fff' : c}`, outline: f.color === c ? `2px solid ${c}` : 'none', cursor:'pointer', flexShrink:0 }} />
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Description</label>
              <textarea value={f.description}
                onChange={e => setF(p => ({ ...p, description: e.target.value }))}
                rows={3} placeholder="Describe this role…"
                style={{ width:'100%', padding:'7px 9px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', outline:'none' }} />
            </div>

            {/* Stats */}
            <div style={{ padding:'10px 12px', background:'var(--cream)', borderRadius:8, fontSize:11, color:'var(--ink3)', display:'flex', flexDirection:'column', gap:4 }}>
              <div><strong style={{ color:'var(--ink2)' }}>{enabledCnt}</strong> of {TENANT_MODULES.length} modules have access</div>
              <div><strong style={{ color:'var(--ink2)' }}>{featureCnt}</strong> sub-features enabled</div>
            </div>

            {/* Quick-fill buttons */}
            <div style={{ display:'flex', gap:6 }}>
              <button
                onClick={() => setF(p => ({ ...p, permissions: TENANT_MODULES.map(m => ({ moduleId:m.id, create:true, read:true, update:true, delete:true })), featurePermissions: defaultFeaturePermissions() }))}
                style={{ flex:1, padding:'5px 8px', fontSize:10, borderRadius:5, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', fontFamily:'inherit', color:'var(--ink3)', fontWeight:600 }}>
                All access
              </button>
              <button
                onClick={() => setF(p => ({ ...p, permissions: emptyPermissions(), featurePermissions: emptyFeaturePermissions() }))}
                style={{ flex:1, padding:'5px 8px', fontSize:10, borderRadius:5, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', fontFamily:'inherit', color:'var(--ink3)', fontWeight:600 }}>
                No access
              </button>
            </div>
          </div>

          {/* Right: permissions tabs */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--border)', padding:'0 16px' }}>
              {(['modules','features'] as ModalTab[]).map(t => {
                const a = tab === t;
                return (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ padding:'9px 14px', border:'none', fontFamily:'inherit', cursor:'pointer', background:'transparent', borderBottom:`2px solid ${a ? '#c4912a' : 'transparent'}`, fontSize:12, fontWeight: a ? 700 : 400, color: a ? '#c4912a' : 'var(--ink3)', borderRadius:'6px 6px 0 0' }}>
                    {t === 'modules' ? 'Module access (CRUD)' : 'Sub-features'}
                  </button>
                );
              })}
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'0' }}>
              {tab === 'modules' && (
                <TenantPermMatrix
                  permissions={f.permissions}
                  onChange={next => setF(p => ({ ...p, permissions: next }))}
                />
              )}
              {tab === 'features' && (
                <div style={{ padding:'12px 16px' }}>
                  <FeaturePanel
                    featurePermissions={f.featurePermissions}
                    onChange={next => setF(p => ({ ...p, featurePermissions: next }))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10, background:'#fafafa' }}>
          <button onClick={onClose}
            style={{ padding:'8px 20px', fontSize:13, borderRadius:7, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={() => canSave && onSave(f)} disabled={!canSave}
            style={{ padding:'8px 22px', fontSize:13, fontWeight:600, borderRadius:7, border:'none', fontFamily:'inherit', background: canSave ? '#c4912a' : 'var(--border)', color: canSave ? '#fff' : 'var(--ink3)', cursor: canSave ? 'pointer' : 'not-allowed' }}>
            {mode === 'create' ? 'Create role' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirmation ─────────────────────────────────────────────────────── */
function DeleteModal({ role, onConfirm, onClose }: { role: TenantCustomRole; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:12, width:420, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' }}>
        <div style={{ padding:'15px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:15, fontWeight:700 }}>Delete custom role</div>
        </div>
        <div style={{ padding:'20px' }}>
          <div style={{ padding:'10px 13px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, fontSize:13, color:'#991b1b', marginBottom:14 }}>
            ⚠ Permanently delete <strong>{role.name}</strong>? All {role.userCount} assigned users will lose access.
          </div>
          <div style={{ fontSize:12, color:'var(--ink2)' }}>
            <span style={{ color:'var(--ink3)' }}>Slug:</span>{' '}
            <code style={{ background:'var(--cream)', padding:'1px 5px', borderRadius:3, fontSize:11 }}>{role.slug}</code>
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

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function TenantRolesPage() {
  const { user }  = useAuthStore();
  const config    = useConfigStore();

  const isSA       = user?.role === 'super_admin';
  const isAdmin    = isSA || user?.role === 'fleet_admin' || user?.role === 'tenant_admin';
  const tenantId   = user?.tenantId ?? '1';

  // Roles visible to this user
  const roles = useMemo(() =>
    isSA
      ? config.customRoles
      : config.customRoles.filter(r => r.tenantId === tenantId),
    [config.customRoles, isSA, tenantId],
  );

  // Load roles from DB on mount and keep the store in sync
  useEffect(() => {
    const url = isSA
      ? '/api/v1/tenant-roles'
      : `/api/v1/tenant-roles?tenantId=${tenantId}`;
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then((data: TenantCustomRole[]) => {
        if (Array.isArray(data)) data.forEach(role => config.upsertCustomRole(role));
      })
      .catch(() => { /* keep cached data on network error */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [modal,   setModal]   = useState<{ mode:'create' } | { mode:'edit'; role:TenantCustomRole } | null>(null);
  const [delRole, setDelRole] = useState<TenantCustomRole | null>(null);
  const [toast,   setToast]   = useState('');

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 2500); }

  const existingSlugs = roles.map(r => r.slug);

  function handleSave(f: RoleForm) {
    const now = new Date().toISOString().split('T')[0];
    if (modal?.mode === 'create') {
      const newRole: TenantCustomRole = {
        id: `tr-${Date.now()}`,
        tenantId,
        name: f.name,
        slug: f.slug,
        description: f.description,
        color: f.color,
        permissions: f.permissions,
        featurePermissions: f.featurePermissions,
        createdAt: now,
        userCount: 0,
      };
      // Persist to DB (fire-and-forget)
      fetch('/api/v1/tenant-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      }).catch(() => {});
      config.upsertCustomRole(newRole);
      showToast(`Role "${f.name}" created`);
    } else if (modal?.mode === 'edit') {
      const updated = {
        ...modal.role,
        name: f.name,
        slug: f.slug,
        description: f.description,
        color: f.color,
        permissions: f.permissions,
        featurePermissions: f.featurePermissions,
      };
      // Persist to DB (fire-and-forget)
      fetch('/api/v1/tenant-roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      config.upsertCustomRole(updated);
      showToast(`Role "${f.name}" updated`);
    }
    setModal(null);
  }

  function handleDelete() {
    if (!delRole) return;
    // Persist to DB (fire-and-forget)
    fetch(`/api/v1/tenant-roles?id=${delRole.id}`, { method: 'DELETE' }).catch(() => {});
    config.deleteCustomRole(delRole.id);
    showToast(`Role "${delRole.name}" deleted`);
    setDelRole(null);
  }

  const emptyForm: RoleForm = {
    id: '', name: '', slug: '', description: '',
    color: COLOR_PALETTE[0],
    permissions: emptyPermissions(),
    featurePermissions: emptyFeaturePermissions(),
  };

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:2000, padding:'10px 18px', background:'#1e293b', color:'#fff', borderRadius:8, fontSize:13, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
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
            <i className="ti ti-users-group" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Org Admin</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Custom Roles</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{roles.length} custom role{roles.length !== 1 ? 's' : ''} for {isSA ? 'all tenants' : (user?.tenantName ?? 'this tenant')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '0 18px' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{roles.length}</div>
            <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Custom Roles</div>
          </div>
          {isAdmin && (
            <button onClick={() => setModal({ mode:'create' })} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(196,145,42,0.35)', background: 'linear-gradient(135deg,#0d1b2a,#1c2b44)', color: '#f5d07a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-plus" style={{ fontSize: 14 }} /> New role
            </button>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div style={{ padding:'8px 14px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, fontSize:12, color:'#92400e', marginBottom:16 }}>
          🔒 Read-only — Fleet Admin or Super Admin required to manage custom roles.
        </div>
      )}

      {roles.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--ink3)', fontSize:13 }}>
          <i className="ti ti-users-group" style={{ fontSize:40, display:'block', marginBottom:12, opacity:0.3 }} />
          No custom roles yet.{isAdmin ? ' Create one to get started.' : ''}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:14 }}>
          {roles.map(role => {
            const active     = config.tenantRoleActive[role.id] ?? true;
            const modCount   = role.permissions.filter(p => CRUD.some(k => p[k])).length;
            const featCount  = Object.values(role.featurePermissions).filter(Boolean).length;
            return (
              <div key={role.id} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', opacity: active ? 1 : 0.65 }}>
                {/* Card header */}
                <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:role.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className="ti ti-users-group" style={{ fontSize:16, color:'#fff' }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{role.name}</span>
                      {!active && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:3, background:'#f3f4f6', color:'var(--ink3)', fontWeight:700 }}>INACTIVE</span>}
                    </div>
                    <div style={{ fontSize:10, fontFamily:'monospace', color:'var(--ink3)', marginTop:1 }}>{role.slug}</div>
                  </div>
                  {/* Active toggle */}
                  {isAdmin && (
                    <div
                      onClick={() => config.setTenantRoleActive(role.id, !active)}
                      style={{ width:34, height:18, borderRadius:10, background: active ? '#c4912a' : '#d1d5db', position:'relative', flexShrink:0, cursor:'pointer', transition:'background 0.15s', marginTop:2 }}>
                      <div style={{ position:'absolute', top:2, left: active ? 17 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding:'12px 16px' }}>
                  {role.description && (
                    <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:10, lineHeight:1.4 }}>{role.description}</div>
                  )}
                  <div style={{ display:'flex', gap:12, fontSize:11, color:'var(--ink3)' }}>
                    <span><strong style={{ color:'var(--ink)', fontWeight:600 }}>{role.userCount}</strong> users</span>
                    <span><strong style={{ color:'var(--ink)', fontWeight:600 }}>{modCount}</strong> modules</span>
                    <span><strong style={{ color:'var(--ink)', fontWeight:600 }}>{featCount}</strong> features</span>
                    <span style={{ marginLeft:'auto', color:'var(--ink3)' }}>{role.createdAt}</span>
                  </div>

                  {/* Module access pills */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:8 }}>
                    {role.permissions
                      .filter(p => CRUD.some(k => p[k]))
                      .slice(0, 5)
                      .map(p => {
                        const m = TENANT_MODULES.find(x => x.id === p.moduleId);
                        return m ? (
                          <span key={p.moduleId} style={{ fontSize:9, padding:'1px 6px', borderRadius:3, background:'rgba(196,145,42,0.12)', color:'#c4912a', fontWeight:600 }}>
                            {m.label}
                          </span>
                        ) : null;
                      })}
                    {role.permissions.filter(p => CRUD.some(k => p[k])).length > 5 && (
                      <span style={{ fontSize:9, padding:'1px 6px', borderRadius:3, background:'var(--cream3)', color:'var(--ink3)' }}>
                        +{role.permissions.filter(p => CRUD.some(k => p[k])).length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                {isAdmin && (
                  <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button
                      onClick={() => setModal({ mode:'edit', role })}
                      style={{ padding:'5px 12px', border:'1px solid var(--border)', borderRadius:6, background:'#fff', cursor:'pointer', fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, color:'var(--ink2)' }}>
                      <i className="ti ti-pencil" style={{ fontSize:12 }} /> Edit
                    </button>
                    <button
                      onClick={() => setDelRole(role)}
                      style={{ padding:'5px 12px', border:'1px solid #fca5a5', borderRadius:6, background:'#fff', color:'#dc2626', cursor:'pointer', fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                      <i className="ti ti-trash" style={{ fontSize:12 }} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modal?.mode === 'create' && (
        <RoleModal
          mode="create"
          initial={emptyForm}
          existingIds={existingSlugs}
          tenantId={tenantId}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.mode === 'edit' && (
        <RoleModal
          mode="edit"
          initial={{
            id:                  modal.role.id,
            name:                modal.role.name,
            slug:                modal.role.slug,
            description:         modal.role.description,
            color:               modal.role.color,
            permissions:         modal.role.permissions,
            featurePermissions:  modal.role.featurePermissions,
          }}
          existingIds={existingSlugs.filter(s => s !== modal.role.slug)}
          tenantId={tenantId}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {delRole && (
        <DeleteModal role={delRole} onConfirm={handleDelete} onClose={() => setDelRole(null)} />
      )}
    </div>
  );
}
