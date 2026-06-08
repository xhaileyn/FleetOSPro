'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRefDataStore } from '@/store/refDataStore';

/* ── Types ────────────────────────────────────────────────────────────── */
interface LookupRow {
  id:        number;
  category:  string;
  value:     string;
  label:     string;
  parent:    string | null;
  region:    string | null;
  sortOrder: number;
}

/* ── Category definitions ─────────────────────────────────────────────── */
const CATEGORIES: { key: string; label: string; icon: string; hasParent?: boolean; parentLabel?: string; parentCat?: string }[] = [
  { key: 'country',          label: 'Countries',          icon: 'ti-world'           },
  { key: 'industry',         label: 'Industries',         icon: 'ti-briefcase'       },
  { key: 'city',             label: 'Cities',             icon: 'ti-building-skyscraper', hasParent: true, parentLabel: 'Country', parentCat: 'country' },
  { key: 'vehicle_category', label: 'Vehicle Categories', icon: 'ti-truck'           },
  { key: 'fuel_type',        label: 'Fuel Types',         icon: 'ti-droplet'         },
  { key: 'device_type',      label: 'Device Types',       icon: 'ti-cpu'             },
  { key: 'device_model',     label: 'Device Models',      icon: 'ti-device-mobile',   hasParent: true, parentLabel: 'Device Type', parentCat: 'device_type' },
  { key: 'telecom_operator', label: 'Telecom Operators',  icon: 'ti-antenna'         },
  { key: 'geofence_type',    label: 'Geofence Types',     icon: 'ti-map-pin'         },
];

const BLANK = { value: '', label: '', parent: '', region: '', sortOrder: 0 };

export default function RefDataPage() {
  const { user }     = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'platform_admin';

  const [rows,    setRows]    = useState<LookupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState(CATEGORIES[0].key);
  const [search,   setSearch]   = useState('');

  const [modal,   setModal]   = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<LookupRow | null>(null);
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');
  const [confirmDel, setConfirmDel] = useState<LookupRow | null>(null);

  const loadRefData = useRefDataStore(s => s.loadRefData);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2800); }

  /* ── Load all rows ──────────────────────────────────────────────────── */
  function fetchRows() {
    fetch('/api/v1/ref?admin=1')
      .then(r => r.json())
      .then((data: LookupRow[]) => { setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchRows(); }, []);

  /* ── Derived ────────────────────────────────────────────────────────── */
  const activeCat = CATEGORIES.find(c => c.key === activeKey)!;

  const parentOptions = useMemo(() => {
    if (!activeCat.hasParent || !activeCat.parentCat) return [];
    return [...new Set(rows.filter(r => r.category === activeCat.parentCat).map(r => r.value))].sort();
  }, [rows, activeCat]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => r.category === activeKey && (
      !q || r.value.toLowerCase().includes(q) || r.label.toLowerCase().includes(q) || (r.parent ?? '').toLowerCase().includes(q)
    ));
  }, [rows, activeKey, search]);

  const stats = useMemo(() =>
    Object.fromEntries(CATEGORIES.map(c => [c.key, rows.filter(r => r.category === c.key).length])),
  [rows]);

  /* ── Modal helpers ──────────────────────────────────────────────────── */
  function openAdd() {
    setForm({ ...BLANK, sortOrder: filtered.length });
    setEditing(null);
    setModal('add');
  }

  function openEdit(row: LookupRow) {
    setForm({ value: row.value, label: row.label, parent: row.parent ?? '', region: row.region ?? '', sortOrder: row.sortOrder });
    setEditing(row);
    setModal('edit');
  }

  /* ── CRUD ───────────────────────────────────────────────────────────── */
  async function handleSave() {
    if (!form.value.trim()) return;
    setSaving(true);
    const payload = {
      category:  activeKey,
      value:     form.value.trim(),
      label:     form.label.trim() || form.value.trim(),
      parent:    form.parent.trim()    || null,
      region:    form.region.trim()    || null,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (modal === 'add') {
        const res  = await fetch('/api/v1/ref', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const newRow: LookupRow = await res.json();
        setRows(p => [...p, newRow]);
        showToast(`"${newRow.value}" added`);
      } else if (editing) {
        await fetch(`/api/v1/ref?id=${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        setRows(p => p.map(r => r.id === editing.id ? { ...r, ...payload } : r));
        showToast(`"${payload.value}" updated`);
      }
      setModal(null);
      loadRefData();  // refresh store so dropdowns reflect changes
    } catch {
      showToast('Save failed — check console');
    } finally { setSaving(false); }
  }

  async function handleDelete(row: LookupRow) {
    try {
      await fetch(`/api/v1/ref?id=${row.id}`, { method: 'DELETE' });
      setRows(p => p.filter(r => r.id !== row.id));
      showToast(`"${row.value}" deleted`);
      setConfirmDel(null);
      loadRefData();
    } catch { showToast('Delete failed'); }
  }

  /* ── Styles ─────────────────────────────────────────────────────────── */
  const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '9px 12px', fontSize: 13, color: 'var(--ink2)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };
  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--ink)', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--ink2)', display: 'block', marginBottom: 4 };

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0d1b2a 0%,#162033 55%,#1c2b44 100%)', border: '1px solid rgba(196,145,42,0.18)', borderRadius: 14, padding: '20px 24px', marginBottom: 20, boxShadow: '0 4px 24px rgba(13,27,42,0.50),inset 0 1px 0 rgba(196,145,42,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-database" style={{ fontSize: 22, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Platform ops</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Reference Data</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Manage lookup lists used across all dropdowns — countries, cities, categories, device models and more</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'Categories', value: CATEGORIES.length },
            { label: 'Total entries', value: rows.length },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '0 16px', borderLeft: i > 0 ? '1px solid rgba(196,145,42,0.20)' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(245,208,122,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── Left: category list ─────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
            Categories
          </div>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setActiveKey(cat.key); setSearch(''); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--border)',
                background: activeKey === cat.key ? 'rgba(196,145,42,0.08)' : 'transparent',
                borderLeft: activeKey === cat.key ? '3px solid #c4912a' : '3px solid transparent',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'background 0.12s',
              }}
            >
              <i className={`ti ${cat.icon}`} style={{ fontSize: 14, color: activeKey === cat.key ? '#c4912a' : 'var(--ink3)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: activeKey === cat.key ? '#c4912a' : 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: activeKey === cat.key ? '#c4912a' : 'var(--ink3)', background: activeKey === cat.key ? 'rgba(196,145,42,0.12)' : 'var(--cream)', padding: '1px 6px', borderRadius: 10 }}>
                {stats[cat.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* ── Right: table ────────────────────────────────────────────── */}
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink3)', pointerEvents: 'none' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${activeCat.label.toLowerCase()}…`}
                style={{ ...inp, paddingLeft: 30 }}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>{filtered.length} entries</span>
            {isSuperAdmin && (
              <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#c4912a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add entry
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
                <i className="ti ti-loader-2" style={{ fontSize: 20, display: 'block', marginBottom: 6, opacity: 0.5 }} />
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
                <i className="ti ti-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.35 }} />
                {search ? 'No entries match your search.' : `No ${activeCat.label.toLowerCase()} yet.`}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Value</th>
                      <th style={th}>Label</th>
                      {activeCat.hasParent && <th style={th}>{activeCat.parentLabel}</th>}
                      <th style={th}>Region</th>
                      <th style={{ ...th, textAlign: 'center' }}>Sort</th>
                      {isSuperAdmin && <th style={{ ...th, textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(row => (
                      <tr key={row.id} style={{ transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                      >
                        <td style={td}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#c4912a', background: 'rgba(196,145,42,0.10)', padding: '2px 7px', borderRadius: 4, border: '1px solid rgba(196,145,42,0.20)' }}>
                            {row.value}
                          </span>
                        </td>
                        <td style={td}>{row.label}</td>
                        {activeCat.hasParent && (
                          <td style={{ ...td, color: 'var(--ink3)', fontSize: 12 }}>{row.parent ?? '—'}</td>
                        )}
                        <td style={{ ...td, color: 'var(--ink3)', fontSize: 12 }}>{row.region ?? '—'}</td>
                        <td style={{ ...td, textAlign: 'center', color: 'var(--ink3)', fontSize: 12 }}>{row.sortOrder}</td>
                        {isSuperAdmin && (
                          <td style={{ ...td, textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button onClick={() => openEdit(row)} style={{ padding: '3px 10px', fontSize: 11, borderRadius: 5, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)' }}>
                                <i className="ti ti-pencil" style={{ fontSize: 11 }} /> Edit
                              </button>
                              <button onClick={() => setConfirmDel(row)} style={{ padding: '3px 10px', fontSize: 11, borderRadius: 5, cursor: 'pointer', border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626' }}>
                                <i className="ti ti-trash" style={{ fontSize: 11 }} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add / Edit modal ────────────────────────────────────────────── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>

            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{modal === 'add' ? 'Add entry' : 'Edit entry'}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{activeCat.label}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ fontSize: 20, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink3)' }}>×</button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Value *</label>
                  <input style={inp} placeholder="e.g. United States" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} autoFocus />
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3 }}>Stored in entity records</div>
                </div>
                <div>
                  <label style={lbl}>Label</label>
                  <input style={inp} placeholder="Defaults to value" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3 }}>Shown in dropdowns</div>
                </div>
              </div>

              {activeCat.hasParent && (
                <div>
                  <label style={lbl}>{activeCat.parentLabel}</label>
                  {parentOptions.length > 0 ? (
                    <select style={inp} value={form.parent} onChange={e => setForm(p => ({ ...p, parent: e.target.value }))}>
                      <option value="">— None —</option>
                      {parentOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input style={inp} placeholder={`e.g. ${activeCat.parentLabel}`} value={form.parent} onChange={e => setForm(p => ({ ...p, parent: e.target.value }))} />
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12 }}>
                <div>
                  <label style={lbl}>Region / ISO code</label>
                  <input style={inp} placeholder="e.g. KE, UG" value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Sort order</label>
                  <input style={inp} type="number" min={0} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)' }}>Cancel</button>
              <button onClick={handleSave} disabled={!form.value.trim() || saving}
                style={{ padding: '8px 22px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: 'none', background: '#c4912a', color: '#fff', fontWeight: 600, opacity: !form.value.trim() || saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add entry' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 400, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <i className="ti ti-trash" style={{ fontSize: 22, color: '#dc2626' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>Delete entry?</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 6 }}>
              Remove <strong>{confirmDel.value}</strong> from <strong>{activeCat.label}</strong>?
            </div>
            <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '8px 12px', marginBottom: 20 }}>
              Any existing records referencing this value will retain their saved text, but the option will no longer appear in dropdowns.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDel(null)} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDel)} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0d1b2a', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', zIndex: 400, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-circle-check" style={{ fontSize: 14, color: '#c4912a' }} />
          {toast}
        </div>
      )}
    </div>
  );
}
