'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Branch } from '@/lib/branches';
import { useBranchesStore } from '@/store/branchesStore';
import { useRefDataStore } from '@/store/refDataStore';

interface FormState {
  name: string;
  city: string;
  region: string;
  active: boolean;
}

const BLANK: FormState = { name: '', city: '', region: '', active: true };

export default function BranchesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'fleet_admin' || user?.role === 'super_admin';
  const tenantId = user?.tenantId ?? '1';
  const storeBranches = useBranchesStore(s => s.branches);
  const allCities     = useRefDataStore(s => s.allCities());

  const [branches, setBranches] = useState<Branch[]>(() =>
    storeBranches.filter(b => b.tenantId === tenantId),
  );
  const [modal, setModal]       = useState<'create' | 'edit' | 'delete' | null>(null);
  const [editing, setEditing]   = useState<Branch | null>(null);
  const [form, setForm]         = useState<FormState>(BLANK);
  const [toast, setToast]       = useState('');
  const [filter, setFilter]     = useState<'all' | 'active' | 'inactive'>('all');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  const filtered = useMemo(() =>
    branches.filter(b => filter === 'all' || (filter === 'active' ? b.active : !b.active)),
  [branches, filter]);

  const stats = useMemo(() => ({
    total:    branches.length,
    active:   branches.filter(b => b.active).length,
    vehicles: branches.reduce((s, b) => s + b.vehicleCount, 0),
    drivers:  branches.reduce((s, b) => s + b.driverCount, 0),
    users:    branches.reduce((s, b) => s + b.userCount, 0),
  }), [branches]);

  function openCreate() { setForm(BLANK); setEditing(null); setModal('create'); }
  function openEdit(b: Branch) { setForm({ name: b.name, city: b.city, region: b.region, active: b.active }); setEditing(b); setModal('edit'); }
  function openDelete(b: Branch) { setEditing(b); setModal('delete'); }

  function handleSave() {
    if (!form.name.trim()) return;
    if (modal === 'create') {
      const nb: Branch = {
        id: `b-${Date.now()}`, tenantId,
        name: form.name.trim(), city: form.city, region: form.region, active: form.active,
        vehicleCount: 0, driverCount: 0, userCount: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setBranches(p => [...p, nb]);
      showToast(`Branch "${nb.name}" created`);
    } else if (editing) {
      setBranches(p => p.map(b => b.id === editing.id ? { ...b, ...form } : b));
      showToast(`Branch "${form.name}" updated`);
    }
    setModal(null);
  }

  function handleDelete() {
    if (!editing) return;
    setBranches(p => p.filter(b => b.id !== editing.id));
    showToast(`Branch "${editing.name}" removed`);
    setModal(null);
  }

  function toggleActive(branch: Branch) {
    if (!isAdmin) return;
    setBranches(p => p.map(b => b.id === branch.id ? { ...b, active: !b.active } : b));
    showToast(`${branch.name} ${branch.active ? 'deactivated' : 'activated'}`);
  }

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, background: '#1e293b', color: '#fff', borderRadius: 8, padding: '10px 18px', fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
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
            <i className="ti ti-building" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Org Admin</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Branch Management</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{user?.tenantName} · define branches and scope user data access per location</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Branches', value: String(stats.total) },
              { label: 'Active',   value: String(stats.active) },
              { label: 'Vehicles', value: String(stats.vehicles) },
              { label: 'Drivers',  value: String(stats.drivers) },
              { label: 'Users',    value: String(stats.users) },
            ].map((s, i) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '0 14px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {isAdmin && (
            <button onClick={openCreate} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(196,145,42,0.35)', background: 'linear-gradient(135deg,#0d1b2a,#1c2b44)', color: '#f5d07a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-plus" /> New branch
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', border: '1px solid', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: filter === f ? '#c4912a' : '#fff',
            color: filter === f ? '#fff' : 'var(--ink2)',
            borderColor: filter === f ? '#c4912a' : 'var(--border)',
            fontWeight: filter === f ? 600 : 400, textTransform: 'capitalize',
          }}>
            {f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink3)', alignSelf: 'center' }}>
          {filtered.length} branch{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Branch cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {filtered.map(branch => (
          <div key={branch.id} style={{
            background: '#fff', border: `1px solid ${branch.active ? 'var(--border)' : '#fca5a5'}`,
            borderRadius: 10, overflow: 'hidden',
            opacity: branch.active ? 1 : 0.7,
          }}>
            <div style={{ height: 4, background: branch.active ? '#c4912a' : '#cbd5e1' }} />
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{branch.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                    <i className="ti ti-map-pin" style={{ marginRight: 4 }} />
                    {branch.city}{branch.region ? `, ${branch.region}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Active toggle */}
                  {isAdmin && (
                    <div
                      onClick={() => toggleActive(branch)}
                      style={{
                        width: 34, height: 19, borderRadius: 10, cursor: 'pointer',
                        background: branch.active ? '#16a34a' : 'var(--border2)',
                        position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 2, left: branch.active ? 17 : 2,
                        width: 15, height: 15, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                  )}
                  {isAdmin && (
                    <>
                      <button onClick={() => openEdit(branch)} style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 11 }}>
                        <i className="ti ti-pencil" />
                      </button>
                      {branch.userCount === 0 && (
                        <button onClick={() => openDelete(branch)} style={{ padding: '4px 8px', border: '1px solid #fca5a5', borderRadius: 5, background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: 11 }}>
                          <i className="ti ti-trash" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink2)' }}>
                <span><i className="ti ti-truck" style={{ marginRight: 4 }} />{branch.vehicleCount}</span>
                <span><i className="ti ti-user" style={{ marginRight: 4 }} />{branch.driverCount}</span>
                <span><i className="ti ti-users" style={{ marginRight: 4 }} />{branch.userCount}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink3)' }}>
                  Added {branch.createdAt}
                </span>
              </div>

              {!branch.active && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                  <i className="ti ti-ban" style={{ marginRight: 4 }} />Branch deactivated — users cannot access data from this location
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: 'var(--ink3)' }}>
            <i className="ti ti-building-off" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
            No branches match the current filter.
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{modal === 'create' ? 'New branch' : 'Edit branch'}</div>
              <button onClick={() => setModal(null)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink3)' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', display: 'block', marginBottom: 4 }}>Branch name *</label>
                <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. New York HQ"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', display: 'block', marginBottom: 4 }}>City</label>
                <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: '#fff' }}>
                  <option value="">Select city…</option>
                  {allCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', display: 'block', marginBottom: 4 }}>Region / Province</label>
                <input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  placeholder="e.g. Rift Valley"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cream)', borderRadius: 7, padding: '10px 12px' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Active</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Inactive branches hide data from assigned users</div>
                </div>
                <div onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  style={{ width: 38, height: 22, borderRadius: 11, cursor: 'pointer', background: form.active ? '#c4912a' : 'var(--border2)', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 3, left: form.active ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim()} style={{ padding: '8px 18px', border: 'none', borderRadius: 7, background: form.name.trim() ? '#c4912a' : 'var(--border)', color: form.name.trim() ? '#fff' : 'var(--ink3)', cursor: form.name.trim() ? 'pointer' : 'default', fontSize: 13, fontWeight: 600 }}>
                {modal === 'create' ? 'Create branch' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === 'delete' && editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 360, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Delete branch</div>
            <p style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 20 }}>
              Remove <strong>{editing.name}</strong>? This branch has {editing.vehicleCount} vehicles and {editing.driverCount} drivers assigned.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: '8px 18px', border: 'none', borderRadius: 7, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
