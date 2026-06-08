'use client';
import { useState, useMemo, Fragment } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useVehiclesStore } from '@/store/vehiclesStore';

/* ── Types ─────────────────────────────────────────────────────────── */
type RouteStatus = 'In progress' | 'Scheduled' | 'Completed' | 'Cancelled';

interface Route {
  id: string;
  name: string;
  vehicle: string;
  driver: string;
  origin: string;
  dest: string;
  stops: number;
  distance: string;
  eta: string;
  departureDate: string;
  departureTime: string;
  notes: string;
  status: RouteStatus;
}

/* ── Seed data ─────────────────────────────────────────────────────── */
const SEED: Route[] = [
  { id:'RT-001', name:'New York → Boston',     vehicle:'ABC-001A', driver:'James Mitchell', origin:'Manhattan, NY',   dest:'Boston, MA',       stops:2, distance:'215 mi', eta:'4h 30m', departureDate:'2026-05-28', departureTime:'06:00', notes:'Standard long-haul. Rest stop at New Haven.', status:'In progress' },
  { id:'RT-002', name:'NYC → Philadelphia',    vehicle:'ABC-003C', driver:'Sarah Johnson',  origin:'Brooklyn, NY',    dest:'Philadelphia, PA', stops:1, distance:'95 mi',  eta:'2h 15m', departureDate:'2026-05-29', departureTime:'07:30', notes:'Client delivery — call ahead 30 min.', status:'Scheduled' },
  { id:'RT-003', name:'Chicago Loop',          vehicle:'ABC-005E', driver:'Robert Williams', origin:'Chicago, IL',    dest:'Chicago, IL',      stops:4, distance:'75 mi',  eta:'2h 00m', departureDate:'2026-05-27', departureTime:'08:00', notes:'Multi-drop loop. Completed without incident.', status:'Completed' },
  { id:'RT-004', name:'Newark Delivery',       vehicle:'ABC-002B', driver:'Emily Turner',   origin:'Newark, NJ',      dest:'Trenton, NJ',      stops:0, distance:'35 mi',  eta:'1h 00m', departureDate:'2026-05-28', departureTime:'09:00', notes:'', status:'In progress' },
  { id:'RT-005', name:'Airport Transfer',      vehicle:'ABC-004D', driver:'Michael Davis',  origin:'Midtown, NY',     dest:'JFK Airport',      stops:0, distance:'15 mi',  eta:'35 min', departureDate:'2026-05-29', departureTime:'14:00', notes:'VIP transfer — punctuality critical.', status:'Scheduled' },
  { id:'RT-006', name:'Chicago → Detroit',     vehicle:'ABC-006F', driver:'Jennifer Lee',   origin:'Chicago, IL',     dest:'Detroit, MI',      stops:1, distance:'280 mi', eta:'4h 30m', departureDate:'2026-05-27', departureTime:'05:30', notes:'', status:'Completed' },
];

const VEHICLES = ['ABC-001A','ABC-002B','ABC-003C','ABC-004D','ABC-005E','ABC-006F'];
const DRIVERS  = ['James Mitchell','Jennifer Lee','Robert Williams','Emily Turner','Michael Davis','Sarah Johnson'];
const STATUSES: RouteStatus[] = ['Scheduled','In progress','Completed','Cancelled'];
const FILTERS  = ['All','In progress','Scheduled','Completed','Cancelled'];

let nextNum = 7;
function genId() { return `RT-${String(nextNum++).padStart(3,'0')}`; }

/* ── Style constants ───────────────────────────────────────────────── */
const STATUS_STYLE: Record<RouteStatus, React.CSSProperties> = {
  'In progress': { background: 'rgba(196,145,42,0.12)',  color: '#c4912a' },
  Scheduled:     { background: '#eff6ff',          color: '#2563eb' },
  Completed:     { background: 'var(--cream3)',    color: 'var(--ink3)' },
  Cancelled:     { background: '#fef2f2',          color: 'var(--red)' },
};

const BLANK: Omit<Route,'id'> = {
  name:'', vehicle:'', driver:'', origin:'', dest:'', stops:0,
  distance:'', eta:'', departureDate:'', departureTime:'', notes:'', status:'Scheduled',
};

/* ── Shared micro-components ────────────────────────────────────────── */
function KpiCard({ icon, iconColor, label, value, sub, stripe, onClick, active }: {
  icon: string; iconColor?: string; label: string; value: string | number;
  sub?: string; stripe?: string; onClick?: () => void; active?: boolean;
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
        {sub && <div style={{ fontSize: 9, marginTop: 2, color: 'var(--ink3)', fontWeight: 500 }}>{sub}</div>}
      </div>
      {active && <i className="ti ti-filter-filled" style={{ fontSize: 10, color: iconColor ?? '#c4912a', flexShrink: 0 }} />}
    </div>
  );
}

function Btn({ children, onClick, variant = 'default', size = 'sm', disabled }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md'; disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: '#fff', color: 'var(--ink2)', border: '1px solid var(--border)' },
    primary: { background: '#c4912a', color: '#fff', border: '1px solid #c4912a' },
    danger:  { background: 'var(--red-lt)', color: 'var(--red)', border: '1px solid #fca5a5' },
    ghost:   { background: 'transparent', color: 'var(--ink3)', border: '1px solid transparent' },
  };
  const pad: Record<string, string> = { xs: '3px 8px', sm: '5px 12px', md: '7px 16px' };
  const fs: Record<string, number>  = { xs: 10, sm: 11, md: 12 };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...styles[variant], padding: pad[size], fontSize: fs[size], borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit', fontWeight: 600, display: 'inline-flex', alignItems: 'center',
        gap: 5, transition: 'opacity 0.15s', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}

/* ── Form modal ────────────────────────────────────────────────────── */
function RouteModal({
  initial, onSave, onClose, allowedPlates,
}: {
  initial: Omit<Route,'id'> & { id?: string };
  onSave: (r: Omit<Route,'id'> & { id?: string }) => void;
  onClose: () => void;
  allowedPlates?: string[];
}) {
  const [f, setF] = useState({ ...initial });
  const set = (k: keyof typeof f, v: string | number) => setF(p => ({ ...p, [k]: v }));
  const isEdit = !!initial.id;

  const lbl: React.CSSProperties = { display:'block', fontSize:10, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.7, marginBottom:4 };
  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, color:'var(--ink)', background:'#fff', boxSizing:'border-box', fontFamily:'inherit', outline:'none' };

  const valid = !!(f.name && f.vehicle && f.driver && f.origin && f.dest);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:12, width:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>{isEdit ? 'Edit route' : 'New route'}</div>
            {isEdit && <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>{initial.id}</div>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--ink3)', lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={lbl}>Route name *</label><input style={inp} placeholder="e.g. New York → Boston" value={f.name} onChange={e=>set('name',e.target.value)} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Vehicle *</label>
              <select style={inp} value={f.vehicle} onChange={e=>set('vehicle',e.target.value)}>
                <option value="">— Select —</option>
                {(allowedPlates ?? VEHICLES).map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Driver *</label>
              <select style={inp} value={f.driver} onChange={e=>set('driver',e.target.value)}>
                <option value="">— Select —</option>
                {DRIVERS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Origin *</label><input style={inp} placeholder="e.g. Manhattan, NY" value={f.origin} onChange={e=>set('origin',e.target.value)} /></div>
            <div><label style={lbl}>Destination *</label><input style={inp} placeholder="e.g. Boston, MA" value={f.dest} onChange={e=>set('dest',e.target.value)} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Stops</label><input type="number" min={0} style={inp} placeholder="0" value={f.stops} onChange={e=>set('stops',parseInt(e.target.value)||0)} /></div>
            <div><label style={lbl}>Distance</label><input style={inp} placeholder="e.g. 480 km" value={f.distance} onChange={e=>set('distance',e.target.value)} /></div>
            <div><label style={lbl}>ETA</label><input style={inp} placeholder="e.g. 6h 30m" value={f.eta} onChange={e=>set('eta',e.target.value)} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Departure date</label><input type="date" style={inp} value={f.departureDate} onChange={e=>set('departureDate',e.target.value)} /></div>
            <div><label style={lbl}>Departure time</label><input type="time" style={inp} value={f.departureTime} onChange={e=>set('departureTime',e.target.value)} /></div>
            <div><label style={lbl}>Status</label>
              <select style={inp} value={f.status} onChange={e=>set('status',e.target.value as RouteStatus)}>
                {STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>Notes</label><textarea style={{ ...inp, height:72, resize:'vertical' }} placeholder="Additional instructions, fuel stops, contacts…" value={f.notes} onChange={e=>set('notes',e.target.value)} /></div>
          {!valid && <div style={{ fontSize:11, color:'var(--red)', marginTop:-6 }}>* Name, vehicle, driver, origin and destination are required.</div>}
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8, position:'sticky', bottom:0, background:'#fff' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:7, border:'1px solid var(--border)', background:'#fff', color:'var(--ink2)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={() => valid && onSave(f)} disabled={!valid} style={{ padding:'8px 18px', borderRadius:7, border:'none', background: valid ? '#c4912a' : 'var(--cream3)', color: valid ? '#fff' : 'var(--ink3)', fontSize:12, fontWeight:600, cursor: valid ? 'pointer' : 'not-allowed', fontFamily:'inherit' }}>
            {isEdit ? 'Save changes' : 'Create route'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ route, onConfirm, onClose }: { route: Route; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:12, width:420, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>Delete route?</div>
        </div>
        <div style={{ padding:'16px 20px' }}>
          <div style={{ fontSize:13, color:'var(--ink2)', lineHeight:1.6 }}>
            You&apos;re about to permanently delete <strong>{route.id} — {route.name}</strong>. This action cannot be undone.
          </div>
          <div style={{ marginTop:12, padding:'10px 12px', background:'#fef2f2', borderRadius:8, fontSize:12, color:'var(--red)', border:'1px solid #fecaca' }}>
            ⚠ Vehicle <strong>{route.vehicle}</strong> ({route.driver}) will be freed from this route.
          </div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:7, border:'1px solid var(--border)', background:'#fff', color:'var(--ink2)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:'8px 18px', borderRadius:7, border:'none', background:'var(--red)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Delete route</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */
export default function RoutesPage() {
  const { user }       = useAuthStore();
  const allVehicles    = useVehiclesStore(s => s.vehicles);
  const role           = user?.role ?? 'viewer';
  const tenantId       = user?.tenantId ?? '1';
  const isSuperAdmin   = role === 'super_admin' || role === 'platform_admin';
  const isVehicleOwner = role === 'vehicle_owner';
  const canEdit = isSuperAdmin || role === 'fleet_admin' || role === 'tenant_admin' || role === 'fleet_manager';

  const accessiblePlates = useMemo<Set<string>>(() => {
    if (isSuperAdmin) return new Set(allVehicles.map(v => v.plate));
    if (isVehicleOwner) {
      const ids = user?.vehicleIds?.length ? user.vehicleIds : user?.vehicleId ? [user.vehicleId] : [];
      return new Set(allVehicles.filter(v => ids.includes(v.id)).map(v => v.plate));
    }
    return new Set(allVehicles.filter(v => v.tenantId === tenantId).map(v => v.plate));
  }, [isSuperAdmin, isVehicleOwner, allVehicles, tenantId, user?.vehicleId, user?.vehicleIds]);

  const dropdownPlates = useMemo(() =>
    isSuperAdmin ? VEHICLES : VEHICLES.filter(p => accessiblePlates.has(p)),
  [isSuperAdmin, accessiblePlates]);

  const [routes,     setRoutes]     = useState<Route[]>(SEED);
  const [filter,     setFilter]     = useState('All');
  const [search,     setSearch]     = useState('');
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [editModal,  setEditModal]  = useState<Route | null>(null);
  const [newModal,   setNewModal]   = useState(false);
  const [deleteConf, setDeleteConf] = useState<Route | null>(null);

  const scopedRoutes = useMemo(() =>
    routes.filter(r => accessiblePlates.size === 0 || accessiblePlates.has(r.vehicle)),
  [routes, accessiblePlates]);

  const inProgress = scopedRoutes.filter(r => r.status === 'In progress').length;
  const scheduled  = scopedRoutes.filter(r => r.status === 'Scheduled').length;
  const completed  = scopedRoutes.filter(r => r.status === 'Completed').length;
  const cancelled  = scopedRoutes.filter(r => r.status === 'Cancelled').length;

  const shown = useMemo(() => {
    let list = filter === 'All' ? scopedRoutes : scopedRoutes.filter(r => r.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) ||
        r.vehicle.toLowerCase().includes(q) || r.driver.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) || r.dest.toLowerCase().includes(q)
      );
    }
    return list;
  }, [scopedRoutes, filter, search]);

  function handleCreate(f: Omit<Route,'id'>) {
    setRoutes(p => [{ ...f, id: genId() }, ...p]);
    setNewModal(false);
  }
  function handleUpdate(f: Omit<Route,'id'> & { id?: string }) {
    if (!f.id) return;
    setRoutes(p => p.map(r => r.id === f.id ? { ...r, ...f, id: r.id } : r));
    setEditModal(null);
  }
  function handleDelete() {
    if (!deleteConf) return;
    setRoutes(p => p.filter(r => r.id !== deleteConf.id));
    if (expanded === deleteConf.id) setExpanded(null);
    setDeleteConf(null);
  }

  const th: React.CSSProperties = {
    padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1,
    borderBottom: '1px solid var(--border)', background: 'var(--cream)', whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, color: 'var(--ink2)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

  return (
    <div className="page-in" style={{ padding: '14px 18px' }}>

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
            <i className="ti ti-route" style={{ fontSize: 20, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Fleet Management</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Route Optimisation</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {isVehicleOwner
                ? `${scopedRoutes.length} route${scopedRoutes.length !== 1 ? 's' : ''} for your vehicles`
                : `${scopedRoutes.length} route${scopedRoutes.length !== 1 ? 's' : ''} · ${user?.tenantName ?? 'your tenant'}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isVehicleOwner && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              My vehicles only
            </span>
          )}
          {!canEdit && !isVehicleOwner && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              View only
            </span>
          )}
          {canEdit && (
            <button onClick={() => setNewModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', fontSize: 12, fontWeight: 600,
              borderRadius: 7, border: '1px solid rgba(196,145,42,0.35)',
              background: 'rgba(196,145,42,0.15)', color: '#f5d07a',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> New route
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard icon="ti-player-play" iconColor="#c4912a" label="In progress" value={inProgress}
          sub="Active routes" stripe="#c4912a" active={filter === 'In progress'}
          onClick={() => setFilter(filter === 'In progress' ? 'All' : 'In progress')} />
        <KpiCard icon="ti-calendar" iconColor="#2563eb" label="Scheduled" value={scheduled}
          sub="Upcoming routes" stripe="#2563eb" active={filter === 'Scheduled'}
          onClick={() => setFilter(filter === 'Scheduled' ? 'All' : 'Scheduled')} />
        <KpiCard icon="ti-check" iconColor="var(--ink3)" label="Completed" value={completed}
          sub="This period" stripe="var(--ink3)" active={filter === 'Completed'}
          onClick={() => setFilter(filter === 'Completed' ? 'All' : 'Completed')} />
        <KpiCard icon="ti-x" iconColor="var(--red)" label="Cancelled" value={cancelled}
          sub="Aborted routes" stripe="var(--red)" active={filter === 'Cancelled'}
          onClick={() => setFilter(filter === 'Cancelled' ? 'All' : 'Cancelled')} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${filter === f ? '#c4912a' : 'var(--border)'}`,
              background: filter === f ? '#c4912a' : 'var(--cream)',
              color: filter === f ? '#fff' : 'var(--ink2)',
              fontWeight: filter === f ? 600 : 400,
            }}>{f}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--ink3)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search routes, vehicles, drivers…"
            style={{ padding: '6px 10px 6px 30px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, width: 240, outline: 'none', fontFamily: 'inherit', color: 'var(--ink)', background: '#fff' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['ID','Route name','Vehicle','Driver','Origin → Destination','Distance','ETA','Status',''].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={9} style={{ padding:32, textAlign:'center', color:'var(--ink3)', fontSize:13 }}>No routes match your filters.</td></tr>
            )}
            {shown.map(r => {
              const isOpen = expanded === r.id;
              return (
                <Fragment key={r.id}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    style={{ background: isOpen ? 'rgba(196,145,42,0.12)' : '#fff', cursor: 'pointer', borderLeft: isOpen ? '3px solid #c4912a' : '3px solid transparent', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}
                    onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                  >
                    <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700, color: '#c4912a', fontSize: 12 }}>{r.id}</td>
                    <td style={{ ...td, fontWeight: 600, color: isOpen ? '#c4912a' : 'var(--ink)' }}>{r.name}</td>
                    <td style={td}>{r.vehicle}</td>
                    <td style={td}>{r.driver}</td>
                    <td style={{ ...td, fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ color: 'var(--ink)' }}>{r.origin}</span>
                        <i className="ti ti-arrow-right" style={{ fontSize: 11, color: 'var(--ink3)' }} />
                        <span style={{ color: 'var(--ink)' }}>{r.dest}</span>
                      </div>
                    </td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{r.distance}</td>
                    <td style={{ ...td, fontSize: 12 }}>{r.eta}</td>
                    <td style={td}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, ...STATUS_STYLE[r.status] }}>{r.status}</span>
                    </td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <Btn size="xs" onClick={() => setEditModal(r)}>
                            <i className="ti ti-edit" style={{ fontSize: 10 }} /> Edit
                          </Btn>
                          <Btn size="xs" variant="danger" onClick={() => setDeleteConf(r)}>
                            <i className="ti ti-trash" style={{ fontSize: 10 }} />
                          </Btn>
                        </div>
                      )}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr style={{ background: 'rgba(196,145,42,0.12)' }}>
                      <td colSpan={9} style={{ padding: '0 16px 16px 16px', borderBottom: '1px solid var(--border)', borderLeft: '3px solid #c4912a' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 4 }}>
                          {[
                            { label: 'Stops',     value: `${r.stops} stop${r.stops !== 1 ? 's' : ''}` },
                            { label: 'Departure', value: r.departureDate ? `${r.departureDate} ${r.departureTime}` : '—' },
                            { label: 'Distance',  value: r.distance || '—' },
                            { label: 'ETA',       value: r.eta || '—' },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ background: '#fff', borderRadius: 7, padding: '8px 12px', border: '1px solid rgba(196,145,42,0.12)' }}>
                              <div style={{ fontSize: 9, color: 'var(--ink3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>{label}</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        {r.notes && (
                          <div style={{ marginTop: 10, padding: '8px 12px', background: '#fff', borderRadius: 7, border: '1px solid rgba(196,145,42,0.12)', fontSize: 12, color: 'var(--ink2)', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <i className="ti ti-notes" style={{ fontSize: 13, color: 'var(--ink3)', flexShrink: 0, marginTop: 1 }} />
                            {r.notes}
                          </div>
                        )}
                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                          {canEdit && (
                            <>
                              <Btn variant="primary" size="sm" onClick={() => setEditModal(r)}>
                                <i className="ti ti-edit" style={{ fontSize: 11 }} /> Edit route
                              </Btn>
                              <Btn variant="danger" size="sm" onClick={() => setDeleteConf(r)}>
                                <i className="ti ti-trash" style={{ fontSize: 11 }} /> Delete
                              </Btn>
                            </>
                          )}
                          <Btn size="sm" onClick={() => setExpanded(null)}>
                            <i className="ti ti-x" style={{ fontSize: 11 }} /> Close
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--cream)', fontSize: 11, color: 'var(--ink3)' }}>
          {shown.length} of {scopedRoutes.length} route{scopedRoutes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {newModal && <RouteModal initial={BLANK} onSave={handleCreate} onClose={() => setNewModal(false)} allowedPlates={dropdownPlates} />}
      {editModal && <RouteModal initial={editModal} onSave={handleUpdate} onClose={() => setEditModal(null)} allowedPlates={dropdownPlates} />}
      {deleteConf && <DeleteModal route={deleteConf} onConfirm={handleDelete} onClose={() => setDeleteConf(null)} />}
    </div>
  );
}
