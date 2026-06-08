'use client';
import { useState, useMemo, useEffect, useCallback, Fragment } from 'react';

/* ── Shared micro-components ────────────────────────────────────────── */
function KpiCard({ icon, iconColor, label, value, stripe, onClick, active }: {
  icon: string; iconColor?: string; label: string; value: number;
  stripe?: string; onClick?: () => void; active?: boolean;
}) {
  const chipBg = (iconColor ?? '#c4912a') + '15';
  return (
    <div onClick={onClick} style={{
      background: active ? (iconColor ?? '#c4912a') + '08' : '#fff',
      border: `1px solid ${active ? (iconColor ?? '#c4912a') : 'var(--border)'}`,
      borderRadius: 7, padding: '8px 10px', cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s, border-color 0.15s', position: 'relative', overflow: 'hidden',
      boxShadow: active ? `0 0 0 3px ${(iconColor ?? '#c4912a') + '20'}` : '0 1px 2px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}
      onMouseEnter={e => { if (onClick && !active) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 3px 10px rgba(0,0,0,0.08)'; el.style.borderColor = iconColor ?? '#c4912a'; } }}
      onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; el.style.borderColor = 'var(--border)'; } }}
    >
      {stripe && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: stripe, borderRadius: '7px 0 0 7px' }} />}
      <div style={{ width: 34, height: 34, borderRadius: 7, background: chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor ?? '#c4912a', fontSize: 16, flexShrink: 0, marginLeft: stripe ? 4 : 0 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1, color: 'var(--ink)' }}>{value}</div>
      </div>
      {active && <i className="ti ti-filter-filled" style={{ fontSize: 10, color: iconColor ?? '#c4912a', flexShrink: 0 }} />}
    </div>
  );
}
import { GeofenceMap, GeoZone, DrawingState } from '@/components/maps/GeofenceMap';
import { useAuthStore } from '@/store/authStore';
import { TENANTS_META } from '@/lib/vehiclesMaster';
import { useRefDataStore } from '@/store/refDataStore';

type ScopedZone = GeoZone & {
  tenantId:   string;
  createdBy:  string | null;
  visibility: string;
  vehicleIds: string[];
};

/* Country → default map center + zoom (country-level overview) */
const COUNTRY_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  'United States':  { center: [39.5, -98.35],  zoom: 4 },
  'United Kingdom': { center: [54.0, -2.0],    zoom: 6 },
  Canada:           { center: [56.1, -106.3],  zoom: 4 },
  Australia:        { center: [-25.3, 133.8],  zoom: 4 },
  Germany:          { center: [51.2, 10.5],    zoom: 6 },
  France:           { center: [46.6,  2.3],    zoom: 6 },
  UAE:              { center: [24.0, 54.0],    zoom: 7 },
  Singapore:        { center: [1.35, 103.82],  zoom: 11 },
  India:            { center: [20.6, 79.0],    zoom: 5 },
  Pakistan:         { center: [30.4, 69.3],    zoom: 6 },
};

const TYPE_COLOR: Record<string,string> = {
  'Home base':'#c4912a', Depot:'#c4912a', Restricted:'var(--red)', Airport:'#2563eb', Customer:'#7c3aed'
};

/* ─── Modal types ───────────────────────────────────────────────────── */
type ModalMode = 'create' | 'edit';

interface FormState {
  name: string;
  type: string;
  shape: 'circle' | 'polygon';
  radius: string;
  status: 'Active' | 'Inactive';
  triggers: ('Entry' | 'Exit')[];
}

const EMPTY_FORM: FormState = {
  name: '', type: 'Home base', shape: 'circle',
  radius: '500', status: 'Active', triggers: ['Entry','Exit'],
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
function radiusLabel(r: number) {
  return r >= 1000 ? `${(r / 1000).toFixed(1)} km` : `${r} m`;
}

function polygonCentroid(pts: [number,number][]): [number,number] {
  const lat = pts.reduce((s,p) => s + p[0], 0) / pts.length;
  const lng = pts.reduce((s,p) => s + p[1], 0) / pts.length;
  return [lat, lng];
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function GeofencesPage() {
  const [zones, setZones]           = useState<ScopedZone[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  /* Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  /* Drawing state inside modal */
  const [drawing, setDrawing] = useState<DrawingState>({
    mode: null, circleCenter: null, circleRadius: 500, polygonPoints: [],
  });

  /* Delete confirm */
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ── Auth + scoping ────────────────────────────────────────────────── */
  const { user } = useAuthStore();
  const geofenceTypes = useRefDataStore(s => s.geofenceTypes);
  const role       = user?.role ?? '';
  const tenantId   = user?.tenantId ?? null;
  const userId     = user?.email ?? null;
  const isSuperAdmin  = role === 'super_admin' || role === 'platform_admin';
  const isVehicleOwner = role === 'vehicle_owner';
  const canEdit = isSuperAdmin || role === 'fleet_admin' || role === 'tenant_admin' || role === 'fleet_manager';

  /* ── Fetch from DB ─────────────────────────────────────────────────── */
  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (!isSuperAdmin && tenantId) sp.set('tenantId', tenantId);
      if (userId) sp.set('userId', userId);
      const res = await fetch(`/api/v1/geofences?${sp}`);
      if (res.ok) setZones(await res.json());
    } catch (err) {
      console.error('[geofences] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, tenantId, userId]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const scopedZones = useMemo<ScopedZone[]>(() => {
    if (isSuperAdmin) return zones;
    if (tenantId) return zones.filter(z => z.tenantId === tenantId);
    return zones;
  }, [isSuperAdmin, zones, tenantId]);

  /* ── Map center: scoped zone centroid → tenant country → world ─────── */
  const { mapCenter, mapZoom } = useMemo<{ mapCenter:[number,number]; mapZoom:number }>(() => {
    if (scopedZones.length > 0) {
      const coords = scopedZones.map<[number,number]>(z =>
        z.shape === 'polygon' && z.points?.length
          ? polygonCentroid(z.points)
          : [z.lat, z.lng]
      );
      const lat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const lng = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      return { mapCenter: [lat, lng], mapZoom: 11 };
    }
    const country = tenantId ? (TENANTS_META[tenantId]?.country ?? '') : '';
    const region  = COUNTRY_CENTERS[country] ?? { center: [0, 20] as [number,number], zoom: 3 };
    return { mapCenter: region.center, mapZoom: region.zoom };
  }, [scopedZones, tenantId]);

  /* ── Filtered list ─────────────────────────────────────────────────── */
  const filtered = useMemo(() => scopedZones.filter(z => {
    const q = search.toLowerCase();
    if (q && !z.name.toLowerCase().includes(q) && !z.type.toLowerCase().includes(q)) return false;
    if (filterType !== 'All' && z.type !== filterType) return false;
    if (filterStatus !== 'All' && z.status !== filterStatus) return false;
    return true;
  }), [scopedZones, search, filterType, filterStatus]);

  /* ── Toggle active ─────────────────────────────────────────────────── */
  const toggle = async (id: string) => {
    const zone = zones.find(z => z.id === id);
    if (!zone) return;
    const newStatus = zone.status === 'Active' ? 'Inactive' : 'Active';
    setZones(p => p.map(z => z.id === id ? { ...z, status: newStatus } : z));
    try {
      await fetch(`/api/v1/geofences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('[geofences] toggle error', err);
      setZones(p => p.map(z => z.id === id ? { ...z, status: zone.status } : z));
    }
  };

  /* ── Open create modal ─────────────────────────────────────────────── */
  function openCreate() {
    setForm(EMPTY_FORM);
    setDrawing({ mode: 'circle', circleCenter: null, circleRadius: 500, polygonPoints: [] });
    setModalMode('create');
    setEditingId(null);
    setModalOpen(true);
  }

  /* ── Open edit modal ───────────────────────────────────────────────── */
  function openEdit(z: GeoZone) {
    setForm({
      name: z.name, type: z.type, shape: z.shape,
      radius: String(z.radius), status: z.status, triggers: [...z.triggers],
    });
    setDrawing({
      mode: z.shape,
      circleCenter: z.shape === 'circle' ? [z.lat, z.lng] : null,
      circleRadius: z.radius,
      polygonPoints: z.shape === 'polygon' && z.points ? [...z.points] : [],
    });
    setModalMode('edit');
    setEditingId(z.id);
    setModalOpen(true);
  }

  /* ── Save ──────────────────────────────────────────────────────────── */
  async function handleSave() {
    const r = parseInt(form.radius) || 300;
    let lat = -1.2921, lng = 36.8219;
    let points: [number,number][] | undefined;

    if (form.shape === 'circle') {
      if (drawing.circleCenter) { lat = drawing.circleCenter[0]; lng = drawing.circleCenter[1]; }
    } else {
      points = drawing.polygonPoints.length >= 3 ? drawing.polygonPoints : undefined;
      if (points) { const c = polygonCentroid(points); lat = c[0]; lng = c[1]; }
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/v1/geofences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name, type: form.type, shape: form.shape,
            lat, lng, radius: r, points: points ?? null,
            status: form.status, triggers: form.triggers,
            tenantId: tenantId ?? 'global',
            createdBy: userId,
            visibility: 'tenant',
            vehicleIds: [],
          }),
        });
        if (res.ok) {
          const created: ScopedZone = await res.json();
          setZones(p => [created, ...p]);
        }
      } else if (editingId !== null) {
        await fetch(`/api/v1/geofences/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name, type: form.type, shape: form.shape,
            lat, lng, radius: r, points: points ?? null,
            status: form.status, triggers: form.triggers,
          }),
        });
        setZones(p => p.map(z => z.id === editingId
          ? { ...z, name: form.name, type: form.type, shape: form.shape, lat, lng, radius: r, points, status: form.status, triggers: form.triggers }
          : z));
      }
    } catch (err) {
      console.error('[geofences] save error', err);
    } finally {
      setSaving(false);
      setModalOpen(false);
    }
  }

  /* ── Delete ────────────────────────────────────────────────────────── */
  async function handleDelete() {
    if (deleteId === null) return;
    const prev = zones;
    setZones(p => p.filter(z => z.id !== deleteId));
    if (selectedId === deleteId) setSelectedId(null);
    setDeleteId(null);
    try {
      await fetch(`/api/v1/geofences/${deleteId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('[geofences] delete error', err);
      setZones(prev);
    }
  }

  /* ── Drawing callbacks ─────────────────────────────────────────────── */
  function onCircleCenterSet(lat: number, lng: number) {
    setDrawing(d => ({ ...d, circleCenter: [lat, lng] }));
  }
  function onPolygonPoint(lat: number, lng: number) {
    setDrawing(d => ({ ...d, polygonPoints: [...d.polygonPoints, [lat, lng]] }));
  }
  function onPolygonClose() {
    // double-click closes the polygon — already captured, nothing extra needed
  }

  /* ── Shape switch ──────────────────────────────────────────────────── */
  function switchShape(s: 'circle' | 'polygon') {
    setForm(f => ({ ...f, shape: s }));
    setDrawing({ mode: s, circleCenter: null, circleRadius: parseInt(form.radius) || 300, polygonPoints: [] });
  }

  /* ── Form valid ────────────────────────────────────────────────────── */
  const canSave = form.name.trim() &&
    (form.shape === 'circle' ? !!drawing.circleCenter : drawing.polygonPoints.length >= 3);

  /* ── Selected / deleting zone ─────────────────────────────────────── */
  const selectedZone = selectedId ? (zones.find(z => z.id === selectedId) ?? null) : null;
  const zoneToDelete = deleteId   ? (zones.find(z => z.id === deleteId)   ?? null) : null;

  /* ── Styles ─────────────────────────────────────────────────────────── */
  const th: React.CSSProperties = {
    padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600,
    color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1,
    borderBottom:'1px solid var(--border)', background:'var(--cream)',
  };
  const td: React.CSSProperties = {
    padding:'10px 12px', fontSize:13, color:'var(--ink2)',
    borderBottom:'1px solid var(--border)',
  };

  /* ─── Render ───────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ padding:'14px 18px', color:'var(--ink3)', fontSize:14 }}>Loading geofences…</div>
  );

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10, padding: '14px 18px', marginBottom: 14,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-map" style={{ fontSize: 20, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Fleet Management</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Geofences</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {scopedZones.length} zone{scopedZones.length !== 1 ? 's' : ''} · {scopedZones.filter(z => z.status === 'Active').length} active
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isSuperAdmin && tenantId && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {isVehicleOwner ? 'Read-only' : 'Tenant zones only'}
            </span>
          )}
          {canEdit && (
            <button onClick={openCreate} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', fontSize: 12, fontWeight: 600,
              borderRadius: 7, border: '1px solid rgba(196,145,42,0.35)',
              background: 'rgba(196,145,42,0.15)', color: '#f5d07a',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> New zone
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        <KpiCard icon="ti-map-pin" iconColor="#6366f1" label="Total zones" value={scopedZones.length}
          stripe="#6366f1" active={filterStatus === 'All' && filterType === 'All'}
          onClick={() => { setFilterStatus('All'); setFilterType('All'); }} />
        <KpiCard icon="ti-player-play" iconColor="#16a34a" label="Active" value={scopedZones.filter(z=>z.status==='Active').length}
          stripe="#c4912a" active={filterStatus === 'Active'}
          onClick={() => setFilterStatus(filterStatus === 'Active' ? 'All' : 'Active')} />
        <KpiCard icon="ti-player-pause" iconColor="var(--ink3)" label="Inactive" value={scopedZones.filter(z=>z.status==='Inactive').length}
          stripe="var(--ink3)" active={filterStatus === 'Inactive'}
          onClick={() => setFilterStatus(filterStatus === 'Inactive' ? 'All' : 'Inactive')} />
        <KpiCard icon="ti-car-suv" iconColor="#2563eb" label="Vehicles inside" value={scopedZones.reduce((s,z)=>s+z.inside,0)}
          stripe="#2563eb" />
      </div>

      {/* Search + filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative' }}>
          <i className="ti ti-search" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--ink3)', pointerEvents:'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search zones…"
            style={{ padding:'7px 10px 7px 30px', border:'1px solid var(--border)', borderRadius:7, fontSize:12, width:220, outline:'none', fontFamily:'inherit', color:'var(--ink)', background:'#fff' }}
          />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['All', ...geofenceTypes.map(t => t.value)].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding:'5px 11px', fontSize:12, borderRadius:6, cursor:'pointer', fontFamily:'inherit',
              border:`1px solid ${filterType===t?'#c4912a':'var(--border)'}`,
              background: filterType===t ? 'rgba(196,145,42,0.12)' : 'transparent',
              color: filterType===t ? '#c4912a' : 'var(--ink2)',
              fontWeight: filterType===t ? 600 : 400,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['All','Active','Inactive'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding:'5px 11px', fontSize:12, borderRadius:6, cursor:'pointer', fontFamily:'inherit',
              border:`1px solid ${filterStatus===s?'#c4912a':'var(--border)'}`,
              background: filterStatus===s ? 'rgba(196,145,42,0.12)' : 'transparent',
              color: filterStatus===s ? '#c4912a' : 'var(--ink2)',
              fontWeight: filterStatus===s ? 600 : 400,
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>

        {/* Map + table */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ border:'1px solid var(--border)', borderRadius:10, marginBottom:20 }}>
            <GeofenceMap zones={scopedZones} height={460} center={mapCenter} zoom={mapZoom} />
          </div>

          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:8 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Zone','Shape','Type','Inside','Radius / Points','Status',''].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ ...td, textAlign:'center', color:'var(--ink3)', padding:24 }}>No zones match.</td></tr>
                )}
                {filtered.map(z => {
                  const isSel = selectedId === z.id;
                  return (
                    <tr
                      key={z.id}
                      onClick={() => setSelectedId(isSel ? null : z.id)}
                      style={{
                        background: isSel ? 'rgba(196,145,42,0.12)' : z.status==='Inactive' ? 'var(--cream)' : '#fff',
                        cursor:'pointer', transition:'background 0.12s',
                        borderLeft: isSel ? '3px solid #c4912a' : '3px solid transparent',
                      }}
                      onMouseEnter={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background='var(--cream)'; }}
                      onMouseLeave={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background=z.status==='Inactive'?'var(--cream)':'#fff'; }}
                    >
                      <td style={{ ...td, fontWeight:600, color:isSel?'#c4912a':'var(--ink)' }}>{z.name}</td>
                      <td style={td}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:4, background:'#f1f5f9', color:'#475569' }}>
                          <i className={`ti ${z.shape === 'polygon' ? 'ti-hexagon' : 'ti-circle'}`} style={{ fontSize:10 }} />
                          {z.shape === 'polygon' ? 'Polygon' : 'Circle'}
                        </span>
                      </td>
                      <td style={td}>
                        <span style={{
                          fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:4,
                          background: z.status==='Inactive'?'var(--cream3)':(TYPE_COLOR[z.type]??'#666')+'20',
                          color:      z.status==='Inactive'?'var(--ink3)':(TYPE_COLOR[z.type]??'#666'),
                        }}>{z.type}</span>
                      </td>
                      <td style={{ ...td, color:z.inside>0?'#c4912a':'var(--ink3)', fontWeight:z.inside>0?600:400 }}>{z.inside}</td>
                      <td style={{ ...td, fontSize:12 }}>
                        {z.shape==='polygon' ? `${z.points?.length ?? 0} pts` : radiusLabel(z.radius)}
                      </td>
                      <td style={td}>
                        <span style={{
                          fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:4,
                          background: z.status==='Active'?'rgba(196,145,42,0.12)':'var(--cream3)',
                          color:      z.status==='Active'?'#c4912a':'var(--ink3)',
                        }}>{z.status}</span>
                      </td>
                      <td style={td} onClick={e => e.stopPropagation()}>
                        {canEdit ? (
                          <div style={{ display:'flex', gap:5 }}>
                            <button onClick={() => openEdit(z)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 9px', fontSize:11, borderRadius:5, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)', fontFamily:'inherit' }}>
                              <i className="ti ti-edit" style={{ fontSize:10 }} />
                            </button>
                            <button onClick={() => toggle(z.id)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 9px', fontSize:10, borderRadius:5, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)', fontFamily:'inherit' }}>
                              <i className={`ti ${z.status==='Active'?'ti-player-pause':'ti-player-play'}`} style={{ fontSize:10 }} />
                              {z.status==='Active'?'Disable':'Enable'}
                            </button>
                            <button onClick={() => setDeleteId(z.id)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 9px', fontSize:11, borderRadius:5, cursor:'pointer', border:'1px solid #fca5a5', background:'#fef2f2', color:'var(--red)', fontFamily:'inherit' }}>
                              <i className="ti ti-trash" style={{ fontSize:10 }} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize:11, color:'var(--ink3)' }}>View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:12, color:'var(--ink3)' }}>{filtered.length} of {scopedZones.length} zones</div>
        </div>

        {/* Detail drawer */}
        {selectedZone && (
          <div style={{
            width:272, flexShrink:0, background:'#fff', border:'1px solid var(--border)',
            borderRadius:12, boxShadow:'0 4px 20px rgba(0,0,0,0.08)', overflow:'hidden',
            position:'sticky', top:20,
          }}>
            <div style={{ padding:'12px 14px', background:'rgba(196,145,42,0.12)', borderBottom:'1px solid #c4912a30', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#c4912a' }}>{selectedZone.name}</div>
                <span style={{ fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:3, background:'#c4912a20', color:'#c4912a' }}>{selectedZone.type}</span>
              </div>
              <button onClick={() => setSelectedId(null)} style={{ fontSize:14, color:'#c4912a', background:'transparent', border:'none', cursor:'pointer', padding:'2px 6px', borderRadius:4 }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid var(--border)' }}>
              {[
                { label:'Status', value: selectedZone.status, accent: selectedZone.status==='Active'?'#c4912a':'var(--ink3)' },
                { label:'Inside', value:`${selectedZone.inside} vehicle${selectedZone.inside!==1?'s':''}`, accent: selectedZone.inside>0?'#c4912a':'var(--ink3)' },
              ].map(({ label, value, accent }) => (
                <div key={label} style={{ padding:'10px 14px', borderRight:'1px solid var(--border)' }}>
                  <div style={{ fontSize:9, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.6, fontWeight:600, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:accent }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Shape',   value: selectedZone.shape==='polygon' ? 'Polygon' : 'Circle' },
                ...(selectedZone.shape==='circle'
                  ? [{ label:'Radius', value: radiusLabel(selectedZone.radius) },
                     { label:'Centre', value: `${selectedZone.lat.toFixed(4)}, ${selectedZone.lng.toFixed(4)}` }]
                  : [{ label:'Vertices', value: `${selectedZone.points?.length ?? 0} points` }]
                ),
              ].map(({ label, value }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                  <span style={{ color:'var(--ink3)' }}>{label}</span>
                  <span style={{ fontWeight:600, color:'var(--ink)', fontFamily:label==='Centre'?'monospace':'inherit', fontSize:label==='Centre'?10:12 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', background:'var(--cream)' }}>
              <div style={{ fontSize:9, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>Trigger Events</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {(['Entry','Exit'] as const).map(opt => (
                  <label key={opt} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, cursor:'default', color:'var(--ink2)' }}>
                    <input type="checkbox" readOnly checked={selectedZone.triggers.includes(opt)} style={{ accentColor:'#c4912a' }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', display:'flex', gap:6 }}>
              {canEdit ? (
                <>
                  <button onClick={() => toggle(selectedZone.id)} style={{
                    flex:1, padding:'6px 0', fontSize:11, fontWeight:600, borderRadius:6, cursor:'pointer', fontFamily:'inherit',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                    border:`1px solid ${selectedZone.status==='Active'?'var(--red)':'#c4912a'}`,
                    background: selectedZone.status==='Active'?'#fef2f2':'rgba(196,145,42,0.12)',
                    color: selectedZone.status==='Active'?'var(--red)':'#c4912a',
                  }}>
                    <i className={`ti ${selectedZone.status==='Active'?'ti-player-pause':'ti-player-play'}`} style={{ fontSize:10 }} />
                    {selectedZone.status==='Active'?'Disable':'Enable'}
                  </button>
                  <button onClick={() => openEdit(selectedZone)} style={{ flex:1, padding:'6px 0', fontSize:11, fontWeight:600, borderRadius:6, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <i className="ti ti-edit" style={{ fontSize:10 }} /> Edit zone
                  </button>
                  <button onClick={() => setDeleteId(selectedZone.id)} style={{ padding:'6px 10px', fontSize:11, fontWeight:600, borderRadius:6, cursor:'pointer', border:'1px solid #fca5a5', background:'#fef2f2', color:'var(--red)', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <i className="ti ti-trash" style={{ fontSize:10 }} />
                  </button>
                </>
              ) : (
                <div style={{ flex:1, padding:'6px 0', fontSize:11, color:'var(--ink3)', textAlign:'center' }}>
                  Read-only — no edit permission
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Modal ─────────────────────────────────────────── */}
      {modalOpen && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div style={{
            background:'#fff', borderRadius:14, width:'92vw', maxWidth:960,
            maxHeight:'90vh', display:'flex', flexDirection:'column',
            boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
          }}>
            {/* Modal header */}
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>
                {modalMode==='create' ? '+ New Geofence Zone' : `✏ Edit — ${form.name || 'zone'}`}
              </div>
              <button onClick={() => setModalOpen(false)} style={{ fontSize:18, color:'var(--ink3)', background:'transparent', border:'none', cursor:'pointer', lineHeight:1 }}>✕</button>
            </div>

            {/* Modal body: form + map */}
            <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

              {/* Left: form */}
              <div style={{ width:300, flexShrink:0, padding:'16px 20px', overflowY:'auto', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:14 }}>

                {/* Name */}
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Zone name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
                    placeholder="e.g. Chicago Distribution Hub"
                    style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, fontFamily:'inherit', boxSizing:'border-box', outline:'none' }}
                  />
                </div>

                {/* Type */}
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Zone type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type:e.target.value }))}
                    style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none' }}>
                    {geofenceTypes.map(t => <option key={t.value}>{t.value}</option>)}
                  </select>
                </div>

                {/* Shape */}
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:6 }}>Shape</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {(['circle','polygon'] as const).map(s => (
                      <button key={s} onClick={() => switchShape(s)} style={{
                        flex:1, padding:'8px 0', fontSize:12, fontWeight:600, borderRadius:7, cursor:'pointer', fontFamily:'inherit',
                        border:`2px solid ${form.shape===s?'#c4912a':'var(--border)'}`,
                        background: form.shape===s ? 'rgba(196,145,42,0.12)' : '#fff',
                        color: form.shape===s ? '#c4912a' : 'var(--ink2)',
                      }}>
                        {s==='circle' ? '● Circle' : '⬡ Polygon'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius (circle only) */}
                {form.shape === 'circle' && (
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Radius (metres)</label>
                    <input
                      type="number" min={50} max={50000}
                      value={form.radius}
                      onChange={e => {
                        setForm(f => ({ ...f, radius:e.target.value }));
                        setDrawing(d => ({ ...d, circleRadius: parseInt(e.target.value) || 300 }));
                      }}
                      style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, fontFamily:'inherit', boxSizing:'border-box', outline:'none' }}
                    />
                  </div>
                )}

                {/* Status */}
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:4 }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'Active'|'Inactive' }))}
                    style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none' }}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

                {/* Triggers */}
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, display:'block', marginBottom:6 }}>Trigger events</label>
                  {(['Entry','Exit'] as const).map(opt => (
                    <label key={opt} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:6, cursor:'pointer', color:'var(--ink2)' }}>
                      <input
                        type="checkbox"
                        checked={form.triggers.includes(opt)}
                        onChange={e => setForm(f => ({
                          ...f,
                          triggers: e.target.checked ? [...f.triggers, opt] : f.triggers.filter(t => t !== opt),
                        }))}
                        style={{ accentColor:'#c4912a', width:15, height:15 }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>

                {/* Drawing hint */}
                <div style={{ padding:'10px 12px', background:'rgba(196,145,42,0.12)', borderRadius:8, fontSize:11, color:'#c4912a', lineHeight:1.5 }}>
                  {form.shape === 'circle' ? (
                    <>
                      <strong>Click on the map</strong> to place the centre.<br />
                      Adjust the radius with the input above.
                      {drawing.circleCenter && <div style={{ marginTop:4 }}>✅ Centre set: {drawing.circleCenter[0].toFixed(4)}, {drawing.circleCenter[1].toFixed(4)}</div>}
                    </>
                  ) : (
                    <>
                      <strong>Click on the map</strong> to add vertices.<br />
                      <strong>Double-click</strong> or add 3+ points to close.
                      {drawing.polygonPoints.length > 0 && <div style={{ marginTop:4 }}>✅ {drawing.polygonPoints.length} point{drawing.polygonPoints.length!==1?'s':''} placed</div>}
                    </>
                  )}
                </div>

                {form.shape === 'polygon' && drawing.polygonPoints.length > 0 && (
                  <button
                    onClick={() => setDrawing(d => ({ ...d, polygonPoints:[] }))}
                    style={{ padding:'6px 0', fontSize:12, borderRadius:6, cursor:'pointer', border:'1px solid #fca5a5', background:'#fef2f2', color:'var(--red)', fontFamily:'inherit' }}
                  >
                    ✕ Clear polygon
                  </button>
                )}
              </div>

              {/* Right: map */}
              <div style={{ flex:1, position:'relative', minHeight:480 }}>
                <div style={{ position:'absolute', inset:0 }}>
                  <GeofenceMap
                    zones={scopedZones}
                    height="100%"
                    center={mapCenter}
                    zoom={mapZoom}
                    drawingState={drawing}
                    onCircleCenterSet={onCircleCenterSet}
                    onPolygonPoint={onPolygonPoint}
                    onPolygonClose={onPolygonClose}
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10, background:'#fafafa' }}>
              <button onClick={() => setModalOpen(false)} style={{ padding:'8px 20px', fontSize:13, borderRadius:7, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                style={{
                  padding:'8px 20px', fontSize:13, fontWeight:600, borderRadius:7, cursor: (canSave && !saving)?'pointer':'not-allowed',
                  border:'none', background: (canSave && !saving)?'#c4912a':'var(--border)',
                  color: (canSave && !saving)?'#fff':'var(--ink3)', fontFamily:'inherit',
                }}
              >
                {saving ? 'Saving…' : modalMode==='create' ? 'Create zone' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Modal ─────────────────────────────────────────── */}
      {deleteId !== null && zoneToDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if(e.target===e.currentTarget) setDeleteId(null); }}>
          <div style={{ background:'#fff', borderRadius:12, width:400, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>Delete zone</div>
            </div>
            <div style={{ padding:'20px' }}>
              <div style={{ padding:'12px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, marginBottom:16, fontSize:13, color:'#991b1b' }}>
                ⚠ This will permanently delete <strong>{zoneToDelete.name}</strong>. This action cannot be undone.
              </div>
              <div style={{ fontSize:13, color:'var(--ink2)' }}>
                <div><span style={{ color:'var(--ink3)' }}>Type:</span> <strong>{zoneToDelete.type}</strong></div>
                <div style={{ marginTop:4 }}><span style={{ color:'var(--ink3)' }}>Shape:</span> <strong>{zoneToDelete.shape==='polygon'?'Polygon':'Circle'}</strong></div>
                <div style={{ marginTop:4 }}><span style={{ color:'var(--ink3)' }}>Vehicles inside:</span> <strong>{zoneToDelete.inside}</strong></div>
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10, background:'#fafafa' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding:'8px 20px', fontSize:13, borderRadius:7, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={handleDelete} style={{ padding:'8px 20px', fontSize:13, fontWeight:600, borderRadius:7, cursor:'pointer', border:'none', background:'var(--red)', color:'#fff', fontFamily:'inherit' }}>
                Delete zone
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
