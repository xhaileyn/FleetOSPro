'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

/* ── Shared micro-components ────────────────────────────────────────── */
function KpiCard({ icon, iconColor, label, value, stripe, onClick, active }: {
  icon: string; iconColor?: string; label: string; value: string | number;
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
import { useAuthStore } from '@/store/authStore';
import type { GpsDevice, DeviceStatus, DeviceType } from '@/lib/devicesData';
import type { SimCard } from '@/lib/sims';
import { simDataUsagePct } from '@/lib/sims';
import { useDevicesStore } from '@/store/devicesStore';
import { useSimsStore } from '@/store/simsStore';
import { TENANTS_META } from '@/lib/vehiclesMaster';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useRefDataStore } from '@/store/refDataStore';

/* ── Constants ─────────────────────────────────────────────────────── */
const SIG_OPTS     = ['Strong','Medium','Weak','None'];
const DEVICE_STATUSES: DeviceStatus[] = ['Online','Offline','Maintenance'];
const SIM_STATUSES = ['Active','Inactive','Suspended','Expired'];
const SIM_TYPES    = ['Primary','Backup'];

/* ── Colour helpers ────────────────────────────────────────────────── */
const SIG_COLOR: Record<string,string> = { Strong:'#c4912a', Medium:'var(--amber)', Weak:'var(--red)', None:'var(--ink3)' };

const STATUS_S: Record<DeviceStatus, React.CSSProperties> = {
  Online:      { background:'rgba(196,145,42,0.12)', color:'#c4912a' },
  Offline:     { background:'#fef2f2',        color:'var(--red)'     },
  Maintenance: { background:'#fffbeb',        color:'#d97706'        },
};
const SIM_STATUS_S: Record<string,React.CSSProperties> = {
  Active:    { background:'rgba(196,145,42,0.12)', color:'#c4912a' },
  Inactive:  { background:'#f3f4f6',        color:'#6b7280'        },
  Suspended: { background:'#fffbeb',        color:'#d97706'        },
  Expired:   { background:'#fef2f2',        color:'var(--red)'     },
};

/* ── Shared micro-components ────────────────────────────────────────── */
function TenantChip({ tenantId }: { tenantId:string }) {
  const meta = TENANTS_META[tenantId];
  if (!meta) return null;
  return (
    <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:10,
      background:meta.color+'18', color:meta.color, border:`1px solid ${meta.color}40` }}>
      {meta.name}
    </span>
  );
}

function BatteryBar({ pct }:{ pct:number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:36, height:8, background:'var(--cream3)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', borderRadius:3,
          background: pct<30?'var(--red)':pct<50?'var(--amber)':'#c4912a' }} />
      </div>
      <span style={{ fontSize:11 }}>{pct}%</span>
    </div>
  );
}

function DataBar({ used,total,pct }:{ used:number; total:number; pct:number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:44, height:6, background:'var(--cream3)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', borderRadius:3,
          background: pct>90?'var(--red)':pct>70?'var(--amber)':'#c4912a' }} />
      </div>
      <span style={{ fontSize:10, color:'var(--ink3)' }}>{(used/1024).toFixed(1)}/{(total/1024).toFixed(0)} GB</span>
    </div>
  );
}

/* ── Delete confirmation ────────────────────────────────────────────── */
function DeleteBtn({ onConfirm }:{ onConfirm:()=>void }) {
  const [ask, setAsk] = useState(false);
  if (ask) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:10, color:'var(--red)' }}>Sure?</span>
      <button onClick={onConfirm} style={{ fontSize:10, padding:'1px 6px', borderRadius:3, border:'1px solid var(--red)', background:'var(--red)', color:'#fff', cursor:'pointer' }}>Yes</button>
      <button onClick={()=>setAsk(false)} style={{ fontSize:10, padding:'1px 6px', borderRadius:3, border:'1px solid var(--border)', background:'#fff', color:'var(--ink3)', cursor:'pointer' }}>No</button>
    </span>
  );
  return (
    <button onClick={()=>setAsk(true)} style={{ fontSize:10, padding:'2px 8px', borderRadius:3, border:'1px solid #fca5a5', background:'#fef2f2', color:'var(--red)', cursor:'pointer' }}>
      Delete
    </button>
  );
}

/* ── Table style constants ──────────────────────────────────────────── */
const th: React.CSSProperties = { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--border)', background:'var(--cream)', whiteSpace:'nowrap' };
const td: React.CSSProperties = { padding:'9px 12px', fontSize:12, color:'var(--ink2)', borderBottom:'1px solid var(--border)', verticalAlign:'middle' };

/* ─────────────────────────────────────────────────────────────────────
   DEVICE MODAL
───────────────────────────────────────────────────────────────────── */
const BLANK_DEVICE = {
  vehicleId:'', type:'GPS Tracker' as DeviceType, model:'', serialNo:'', imei:'',
  firmware:'', signal:'Strong', battery:'', status:'Online' as DeviceStatus,
  installedAt:'', notes:'',
};

function DeviceModal({ mode, init, tenantId, vehicles, onSave, onClose }: {
  mode: 'create'|'edit';
  init: typeof BLANK_DEVICE;
  tenantId: string;
  vehicles: { id:string; plate:string }[];
  onSave: (f: typeof BLANK_DEVICE) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState(init);
  const set = (k: keyof typeof BLANK_DEVICE, v: string) => setF(p => ({ ...p, [k]: v }));

  const deviceTypes = useRefDataStore(s => s.deviceTypes);
  const modelsForType = useRefDataStore(s => s.modelsForType);
  const modelOpts = modelsForType(f.type);

  const inp: React.CSSProperties = { width:'100%', padding:'7px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, color:'var(--ink)', boxSizing:'border-box', background:'#fff', fontFamily:'inherit' };
  const lbl: React.CSSProperties = { fontSize:11, fontWeight:600, color:'var(--ink3)', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:0.5 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
      <div style={{ background:'#fff', borderRadius:12, width:580, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'var(--ink)' }}>{mode==='create' ? 'Register new device' : 'Edit device'}</div>
            <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>GPS tracker, OBD dongle, dashcam or sensor</div>
          </div>
          <button onClick={onClose} style={{ fontSize:20, border:'none', background:'transparent', cursor:'pointer', color:'var(--ink3)' }}>×</button>
        </div>

        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Row 1: Type (vehicle assigned via Associations tab) */}
          <div>
            <label style={lbl}>Device type *</label>
            <select style={inp} value={f.type} onChange={e=>{ set('type',e.target.value); set('model',''); }}>
              {deviceTypes.map(t=><option key={t.value}>{t.value}</option>)}
            </select>
          </div>

          {/* Row 2: Model + Firmware */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Model *</label>
              <select style={inp} value={f.model} onChange={e=>set('model',e.target.value)}>
                <option value="">— Select model —</option>
                {modelOpts.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Firmware version</label>
              <input style={inp} placeholder="e.g. 03.28.07" value={f.firmware} onChange={e=>set('firmware',e.target.value)} />
            </div>
          </div>

          {/* Row 3: Serial + IMEI */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Serial number *</label>
              <input style={inp} placeholder="e.g. TLT-FMB-001A" value={f.serialNo} onChange={e=>set('serialNo',e.target.value)} />
            </div>
            <div>
              <label style={lbl}>IMEI</label>
              <input style={inp} placeholder="15-digit IMEI" maxLength={15} value={f.imei} onChange={e=>set('imei',e.target.value)} />
            </div>
          </div>

          {/* Row 4: Signal + Battery + Status */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Signal strength</label>
              <select style={inp} value={f.signal} onChange={e=>set('signal',e.target.value)}>
                {SIG_OPTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Battery % <span style={{ fontWeight:400, textTransform:'none' }}>(blank = hardwired)</span></label>
              <input style={inp} type="number" min="0" max="100" placeholder="—" value={f.battery} onChange={e=>set('battery',e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp} value={f.status} onChange={e=>set('status',e.target.value as DeviceStatus)}>
                {DEVICE_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Installed date */}
          <div>
            <label style={lbl}>Installed date</label>
            <input style={inp} type="date" value={f.installedAt} onChange={e=>set('installedAt',e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp, height:60, resize:'vertical' }} placeholder="Installation notes, pairing info…" value={f.notes} onChange={e=>set('notes',e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ padding:'7px 18px', fontSize:12, borderRadius:6, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)' }}>Cancel</button>
          <button
            onClick={()=>onSave(f)}
            disabled={!f.serialNo || !f.model}
            style={{ padding:'7px 22px', fontSize:12, borderRadius:6, cursor:'pointer', border:'none', background:'#c4912a', color:'#fff', fontWeight:600, opacity:(!f.serialNo||!f.model)?0.5:1 }}
          >
            {mode==='create' ? 'Register device' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SIM MODAL
───────────────────────────────────────────────────────────────────── */
const BLANK_SIM = {
  vehicleId:'', iccid:'', msisdn:'', operator:'AT&T',
  type:'Primary' as 'Primary'|'Backup', dataPlanMB:'10240', apn:'',
  status:'Active' as string, activatedAt:'', expiresAt:'', notes:'',
};

function SimModal({ mode, init, vehicles, onSave, onClose }: {
  mode: 'create'|'edit';
  init: typeof BLANK_SIM;
  vehicles: { id:string; plate:string }[];
  onSave: (f: typeof BLANK_SIM) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState(init);
  const set = (k: keyof typeof BLANK_SIM, v: string) => setF(p => ({ ...p, [k]: v }));
  const telecomOperators = useRefDataStore(s => s.telecomOperators);

  const inp: React.CSSProperties = { width:'100%', padding:'7px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, color:'var(--ink)', boxSizing:'border-box', background:'#fff', fontFamily:'inherit' };
  const lbl: React.CSSProperties = { fontSize:11, fontWeight:600, color:'var(--ink3)', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:0.5 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
      <div style={{ background:'#fff', borderRadius:12, width:560, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>

        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'var(--ink)' }}>{mode==='create' ? 'Register new SIM' : 'Edit SIM'}</div>
            <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>Telecom SIM card for GPS / IoT device</div>
          </div>
          <button onClick={onClose} style={{ fontSize:20, border:'none', background:'transparent', cursor:'pointer', color:'var(--ink3)' }}>×</button>
        </div>

        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Row 1: SIM type (vehicle assigned via Associations tab) */}
          <div>
            <label style={lbl}>SIM type</label>
            <select style={inp} value={f.type} onChange={e=>set('type',e.target.value)}>
              {SIM_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Row 2: ICCID + MSISDN */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>ICCID *</label>
              <input style={inp} placeholder="20-digit ICCID" maxLength={20} value={f.iccid} onChange={e=>set('iccid',e.target.value)} />
            </div>
            <div>
              <label style={lbl}>MSISDN (phone number)</label>
              <input style={inp} placeholder="+254722000000" value={f.msisdn} onChange={e=>set('msisdn',e.target.value)} />
            </div>
          </div>

          {/* Row 3: Operator + APN */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Operator *</label>
              <select style={inp} value={f.operator} onChange={e=>set('operator',e.target.value)}>
                {telecomOperators.map(o=><option key={o.value}>{o.value}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>APN</label>
              <input style={inp} placeholder="e.g. broadband.att.com" value={f.apn} onChange={e=>set('apn',e.target.value)} />
            </div>
          </div>

          {/* Row 4: Data plan + Status */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Data plan (MB)</label>
              <select style={inp} value={f.dataPlanMB} onChange={e=>set('dataPlanMB',e.target.value)}>
                {[['1024','1 GB'],['2048','2 GB'],['5120','5 GB'],['10240','10 GB'],['20480','20 GB'],['51200','50 GB']].map(([v,l])=>(
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp} value={f.status} onChange={e=>set('status',e.target.value)}>
                {SIM_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Row 5: Dates */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Activated date</label>
              <input style={inp} type="date" value={f.activatedAt} onChange={e=>set('activatedAt',e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Expires date</label>
              <input style={inp} type="date" value={f.expiresAt} onChange={e=>set('expiresAt',e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp, height:56, resize:'vertical' }} placeholder="Backup SIM, roaming notes…" value={f.notes} onChange={e=>set('notes',e.target.value)} />
          </div>
        </div>

        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ padding:'7px 18px', fontSize:12, borderRadius:6, cursor:'pointer', border:'1px solid var(--border)', background:'transparent', color:'var(--ink2)' }}>Cancel</button>
          <button
            onClick={()=>onSave(f)}
            disabled={!f.iccid}
            style={{ padding:'7px 22px', fontSize:12, borderRadius:6, cursor:'pointer', border:'none', background:'#c4912a', color:'#fff', fontWeight:600, opacity:(!f.iccid)?0.5:1 }}
          >
            {mode==='create' ? 'Register SIM' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────── */
export default function DevicesPage() {
  const { user }     = useAuthStore();
  const role         = user?.role ?? 'viewer';
  const isSuperAdmin = role === 'super_admin' || role === 'platform_admin';
  const canWrite     = !isSuperAdmin && role !== 'viewer';
  const tenantId     = user?.tenantId ?? '1';
  const router       = useRouter();

  const vehicles        = useVehiclesStore(s => s.vehicles);
  const refDeviceTypes  = useRefDataStore(s => s.deviceTypes);

  /* ── Store actions ── */
  const storeDevices    = useDevicesStore(s => s.devices);
  const storeAddDevice  = useDevicesStore(s => s.addDevice);
  const storeUpdDevice  = useDevicesStore(s => s.updateDevice);
  const storeDelDevice  = useDevicesStore(s => s.removeDevice);
  const storeSims       = useSimsStore(s => s.sims);
  const storeAddSim     = useSimsStore(s => s.addSim);
  const storeUpdSim     = useSimsStore(s => s.updateSim);
  const storeDelSim     = useSimsStore(s => s.removeSim);

  /* ── Live state (initialised from store data) ── */
  const [devices, setDevices] = useState<GpsDevice[]>([]);
  const [sims,    setSims]    = useState<SimCard[]>([]);

  // Sync from store when data arrives
  /* eslint-disable react-hooks/exhaustive-deps */
  if (devices.length === 0 && storeDevices.length > 0) {
    const filtered = isSuperAdmin ? storeDevices : storeDevices.filter(d => d.tenantId === tenantId);
    if (filtered.length > 0 && devices.length === 0) setDevices(filtered);
  }
  if (sims.length === 0 && storeSims.length > 0) {
    const filtered = isSuperAdmin ? storeSims : storeSims.filter(s => s.tenantId === tenantId);
    if (filtered.length > 0 && sims.length === 0) setSims(filtered);
  }
  /* eslint-enable react-hooks/exhaustive-deps */

  /* ── Filters ── */
  const [tab,          setTab]          = useState<'devices'|'sims'|'associations'>('devices');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [typeFilter,   setTypeFilter]   = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search,       setSearch]       = useState('');

  /* ── Modal state ── */
  const [deviceModal, setDeviceModal] = useState<{ mode:'create'|'edit'; init: typeof BLANK_DEVICE; editId?:string }|null>(null);
  const [simModal,    setSimModal]    = useState<{ mode:'create'|'edit'; init: typeof BLANK_SIM;    editId?:string }|null>(null);

  /* ── Associations form state ── */
  const [assocVehicle, setAssocVehicle] = useState('');
  const [assocDevice,  setAssocDevice]  = useState('');
  const [assocSim,     setAssocSim]     = useState('');

  /* ── Derived data ── */
  const scopedVehicles = useMemo(() =>
    (isSuperAdmin ? vehicles : vehicles.filter(v => v.tenantId === tenantId))
      .map(v => ({ id: v.id, plate: v.plate })),
  [isSuperAdmin, vehicles, tenantId]);

  const scopedSims = useMemo(() =>
    sims.map(s => ({ id: s.id, msisdn: s.msisdn, vehiclePlate: s.vehiclePlate })),
  [sims]);

  const filteredDevices = useMemo(() => {
    let d = isSuperAdmin && tenantFilter !== 'all'
      ? devices.filter(x => x.tenantId === tenantFilter) : devices;
    if (typeFilter   !== 'All') d = d.filter(x => x.type   === typeFilter);
    if (statusFilter !== 'All') d = d.filter(x => x.status === statusFilter);
    if (search) d = d.filter(x =>
      x.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
      x.serialNo.toLowerCase().includes(search.toLowerCase()) ||
      x.model.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [devices, isSuperAdmin, tenantFilter, typeFilter, statusFilter, search]);

  const filteredSims = useMemo(() => {
    let s = isSuperAdmin && tenantFilter !== 'all'
      ? sims.filter(x => x.tenantId === tenantFilter) : sims;
    if (statusFilter !== 'All') s = s.filter(x => x.status === statusFilter);
    if (search) s = s.filter(x =>
      x.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
      x.msisdn.toLowerCase().includes(search.toLowerCase()) ||
      x.operator.toLowerCase().includes(search.toLowerCase()));
    return s;
  }, [sims, isSuperAdmin, tenantFilter, statusFilter, search]);

  /* ── KPIs ── */
  const devOnline   = filteredDevices.filter(d => d.status === 'Online').length;
  const devOffline  = filteredDevices.filter(d => d.status === 'Offline').length;
  const devMaint    = filteredDevices.filter(d => d.status === 'Maintenance').length;
  const simActive   = filteredSims.filter(s => s.status === 'Active').length;
  const simIssues   = filteredSims.filter(s => s.status !== 'Active').length;
  const totalDataMB = filteredSims.reduce((a,s) => a + s.dataUsedMB, 0);

  /* ── Associations handlers ── */
  async function postAuditEvent(p: {
    tenantId: string; vehicleId: string; eventType: string;
    title: string; description: string; meta?: string;
  }) {
    try {
      await fetch('/api/v1/audit-events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, by: 'Fleet Manager' }),
      });
    } catch { /* swallow */ }
  }

  async function handleLink() {
    if (!assocVehicle || (!assocDevice && !assocSim)) return;
    const vehicle = vehicles.find(v => v.id === assocVehicle);
    const plate   = vehicle?.plate ?? '';
    if (assocDevice) {
      const dev = devices.find(d => d.id === assocDevice);
      const res = await fetch(`/api/v1/devices/${assocDevice}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: assocVehicle, vehiclePlate: plate }),
      });
      if (res.ok) {
        const d = await res.json() as GpsDevice;
        storeUpdDevice(d);
        setDevices(prev => prev.map(x => x.id === assocDevice ? d : x));
        postAuditEvent({
          tenantId: dev?.tenantId ?? tenantId, vehicleId: assocVehicle,
          eventType: 'Device Link',
          title: `${dev?.type ?? 'GPS Device'} linked`,
          description: `${dev?.model ?? ''} (${dev?.serialNo || dev?.imei || assocDevice}) linked to ${plate}.`,
          meta: dev?.serialNo || dev?.imei || assocDevice,
        });
      }
    }
    if (assocSim) {
      const sim = sims.find(s => s.id === assocSim);
      const res = await fetch(`/api/v1/sims/${assocSim}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: assocVehicle, vehiclePlate: plate }),
      });
      if (res.ok) {
        const s = await res.json() as SimCard;
        storeUpdSim(s);
        setSims(prev => prev.map(x => x.id === assocSim ? s : x));
        postAuditEvent({
          tenantId: sim?.tenantId ?? tenantId, vehicleId: assocVehicle,
          eventType: 'SIM Link',
          title: `${sim?.type ?? 'SIM'} linked`,
          description: `${sim?.operator ?? ''} SIM (${sim?.msisdn ?? assocSim}) linked to ${plate}.`,
          meta: sim?.msisdn || assocSim,
        });
      }
    }
    setAssocDevice('');
    setAssocSim('');
  }

  async function unlink(kind: 'device'|'sim', id: string) {
    if (kind === 'device') {
      const dev       = devices.find(d => d.id === id);
      const vehId     = dev?.vehicleId ?? '';
      const vehPlate  = dev?.vehiclePlate ?? '';
      const res = await fetch(`/api/v1/devices/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: '', vehiclePlate: '' }),
      });
      if (res.ok) {
        const d = await res.json() as GpsDevice;
        storeUpdDevice(d);
        setDevices(prev => prev.map(x => x.id === id ? d : x));
        if (vehId) await postAuditEvent({
          tenantId: dev?.tenantId ?? tenantId, vehicleId: vehId,
          eventType: 'Device Unlink',
          title: `${dev?.type ?? 'GPS Device'} removed`,
          description: `${dev?.model ?? ''} (${dev?.serialNo || dev?.imei || id}) unlinked from ${vehPlate}.`,
          meta: dev?.serialNo || dev?.imei || id,
        });
      }
    } else {
      const sim      = sims.find(s => s.id === id);
      const vehId    = sim?.vehicleId ?? '';
      const vehPlate = sim?.vehiclePlate ?? '';
      const res = await fetch(`/api/v1/sims/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: '', vehiclePlate: '' }),
      });
      if (res.ok) {
        const s = await res.json() as SimCard;
        storeUpdSim(s);
        setSims(prev => prev.map(x => x.id === id ? s : x));
        if (vehId) await postAuditEvent({
          tenantId: sim?.tenantId ?? tenantId, vehicleId: vehId,
          eventType: 'SIM Unlink',
          title: `${sim?.type ?? 'SIM'} removed`,
          description: `${sim?.operator ?? ''} SIM (${sim?.msisdn ?? id}) unlinked from ${vehPlate}.`,
          meta: sim?.msisdn || id,
        });
      }
    }
  }

  /* ── CRUD handlers — Devices ── */
  async function saveDevice(f: typeof BLANK_DEVICE, editId?: string) {
    const vehicle = vehicles.find(v => v.id === f.vehicleId);
    const plate   = vehicle?.plate ?? '';
    const payload = {
      tenantId,
      vehicleId:   f.vehicleId,
      vehiclePlate: plate,
      type:        f.type,
      model:       f.model,
      serialNo:    f.serialNo,
      imei:        f.imei,
      firmware:    f.firmware,
      signal:      f.signal,
      battery:     f.battery,
      status:      f.status,
      simId:       null,
      installedAt: f.installedAt,
      notes:       f.notes,
    };
    if (editId) {
      const res = await fetch(`/api/v1/devices/${editId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const d = await res.json() as GpsDevice;
        storeUpdDevice(d);
        setDevices(prev => prev.map(x => x.id === editId ? d : x));
        setDeviceModal(null);
      }
    } else {
      const res = await fetch('/api/v1/devices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const d = await res.json() as GpsDevice;
        storeAddDevice(d);
        setDevices(prev => [d, ...prev]);
        setDeviceModal(null);
      }
    }
  }

  async function deleteDevice(id: string) {
    const res = await fetch(`/api/v1/devices/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      storeDelDevice(id);
      setDevices(prev => prev.filter(d => d.id !== id));
    }
  }

  /* ── CRUD handlers — SIMs ── */
  async function saveSim(f: typeof BLANK_SIM, editId?: string) {
    const vehicle = vehicles.find(v => v.id === f.vehicleId);
    const plate   = vehicle?.plate ?? '';
    const payload = {
      tenantId,
      vehicleId:    f.vehicleId,
      vehiclePlate: plate,
      iccid:        f.iccid,
      msisdn:       f.msisdn,
      operator:     f.operator,
      country:      user?.tenantName ?? 'United States',
      type:         f.type,
      status:       f.status,
      dataPlanMB:   f.dataPlanMB,
      apn:          f.apn,
      activatedAt:  f.activatedAt,
      expiresAt:    f.expiresAt,
      notes:        f.notes,
    };
    if (editId) {
      const res = await fetch(`/api/v1/sims/${editId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const s = await res.json() as SimCard;
        storeUpdSim(s);
        setSims(prev => prev.map(x => x.id === editId ? s : x));
        setSimModal(null);
      }
    } else {
      const res = await fetch('/api/v1/sims', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const s = await res.json() as SimCard;
        storeAddSim(s);
        setSims(prev => [s, ...prev]);
        setSimModal(null);
      }
    }
  }

  async function deleteSim(id: string) {
    const res = await fetch(`/api/v1/sims/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      storeDelSim(id);
      setSims(prev => prev.filter(s => s.id !== id));
    }
  }

  /* ── Edit helpers ── */
  function openEditDevice(d: GpsDevice) {
    setDeviceModal({ mode:'edit', editId: d.id, init: {
      vehicleId: d.vehicleId, type: d.type, model: d.model,
      serialNo: d.serialNo, imei: d.imei, firmware: d.firmware,
      signal: d.signal, battery: d.battery !== null ? String(d.battery) : '',
      status: d.status, installedAt: d.installedAt, notes: d.notes,
    }});
  }

  function openEditSim(s: SimCard) {
    setSimModal({ mode:'edit', editId: s.id, init: {
      vehicleId: s.vehicleId, iccid: s.iccid, msisdn: s.msisdn,
      operator: s.operator, type: s.type, dataPlanMB: String(s.dataPlanMB),
      apn: s.apn, status: s.status, activatedAt: s.activatedAt,
      expiresAt: s.expiresAt, notes: s.notes,
    }});
  }

  const inp: React.CSSProperties = { padding:'6px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, color:'var(--ink)', background:'#fff', fontFamily:'inherit' };

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
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:9, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-antenna" style={{ fontSize:20, color:'#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'rgba(245,208,122,0.7)', marginBottom:2 }}>Enterprise</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#fff', lineHeight:1 }}>Devices &amp; SIMs</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
              {isSuperAdmin ? 'Cross-tenant IoT device and SIM inventory — read only' : `${devices.length} device${devices.length !== 1 ? 's' : ''} · ${sims.length} SIM${sims.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isSuperAdmin
            ? <span style={{ fontSize:9, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(196,145,42,0.15)', color:'#f5d07a', border:'1px solid rgba(196,145,42,0.28)', letterSpacing:'0.5px', textTransform:'uppercase' }}>All tenants — view only</span>
            : <span style={{ fontSize:9, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(196,145,42,0.15)', color:'#f5d07a', border:'1px solid rgba(196,145,42,0.28)', letterSpacing:'0.5px', textTransform:'uppercase' }}>
                {user?.tenantName ?? 'Tenant'} only
              </span>
          }
          {canWrite && tab === 'devices' && (
            <button onClick={()=>setDeviceModal({ mode:'create', init:BLANK_DEVICE })} style={{
              display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12, fontWeight:600,
              borderRadius:7, border:'1px solid rgba(196,145,42,0.35)', background:'rgba(196,145,42,0.15)', color:'#f5d07a', cursor:'pointer', fontFamily:'inherit',
            }}>
              <i className="ti ti-plus" style={{ fontSize:13 }} /> Register device
            </button>
          )}
          {canWrite && tab === 'sims' && (
            <button onClick={()=>setSimModal({ mode:'create', init:BLANK_SIM })} style={{
              display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:12, fontWeight:600,
              borderRadius:7, border:'1px solid rgba(196,145,42,0.35)', background:'rgba(196,145,42,0.15)', color:'#f5d07a', cursor:'pointer', fontFamily:'inherit',
            }}>
              <i className="ti ti-plus" style={{ fontSize:13 }} /> Register SIM
            </button>
          )}
          {tab === 'associations' && canWrite && (
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>setDeviceModal({ mode:'create', init:BLANK_DEVICE })} style={{
                display:'flex', alignItems:'center', gap:5, padding:'7px 12px', fontSize:11, fontWeight:600,
                borderRadius:7, border:'1px solid rgba(196,145,42,0.35)', background:'rgba(196,145,42,0.12)', color:'#f5d07a', cursor:'pointer', fontFamily:'inherit',
              }}>
                <i className="ti ti-antenna" style={{ fontSize:11 }} /> Device
              </button>
              <button onClick={()=>setSimModal({ mode:'create', init:BLANK_SIM })} style={{
                display:'flex', alignItems:'center', gap:5, padding:'7px 12px', fontSize:11, fontWeight:600,
                borderRadius:7, border:'1px solid rgba(196,145,42,0.35)', background:'rgba(196,145,42,0.15)', color:'#f5d07a', cursor:'pointer', fontFamily:'inherit',
              }}>
                <i className="ti ti-sim-card" style={{ fontSize:11 }} /> SIM
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Super admin tenant selector */}
      {isSuperAdmin && (
        <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <label style={{ fontSize:11, color:'var(--ink3)' }}>Filter tenant:</label>
          <select value={tenantFilter} onChange={e=>setTenantFilter(e.target.value)} style={inp}>
            <option value="all">All tenants ({devices.length} devices · {sims.length} SIMs)</option>
            {Object.entries(TENANTS_META).map(([tid,meta]) => {
              const dc = devices.filter(d=>d.tenantId===tid).length;
              const sc = sims.filter(s=>s.tenantId===tid).length;
              return <option key={tid} value={tid}>{meta.name} ({dc} devices · {sc} SIMs)</option>;
            })}
          </select>
          {tenantFilter !== 'all' && (
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10,
              background:(TENANTS_META[tenantFilter]?.color??'#000')+'18',
              color:TENANTS_META[tenantFilter]?.color??'var(--ink3)',
              border:`1px solid ${(TENANTS_META[tenantFilter]?.color??'#000')}40` }}>
              {TENANTS_META[tenantFilter]?.name}
            </span>
          )}
        </div>
      )}

      {/* Tenant notice */}
      {!isSuperAdmin && (
        <div style={{ marginBottom:16, padding:'7px 12px', background:'rgba(196,145,42,0.12)', borderRadius:8, fontSize:11, color:'#c4912a', fontWeight:600 }}>
          🔒 Scoped to <strong>{user?.tenantName ?? 'your tenant'}</strong> — devices from other companies are not visible.
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:16 }}>
        <KpiCard icon="ti-antenna" iconColor="#c4912a" label="Devices online" value={devOnline}
          stripe="#c4912a" active={tab==='devices' && statusFilter==='Online'}
          onClick={() => { setTab('devices'); setStatusFilter('Online'); setSearch(''); }} />
        <KpiCard icon="ti-wifi-off" iconColor="var(--red)" label="Devices offline" value={devOffline}
          stripe="var(--red)" active={tab==='devices' && statusFilter==='Offline'}
          onClick={() => { setTab('devices'); setStatusFilter('Offline'); setSearch(''); }} />
        <KpiCard icon="ti-tool" iconColor="var(--amber)" label="Maintenance" value={devMaint}
          stripe="var(--amber)" active={tab==='devices' && statusFilter==='Maintenance'}
          onClick={() => { setTab('devices'); setStatusFilter('Maintenance'); setSearch(''); }} />
        <KpiCard icon="ti-sim-card" iconColor="#c4912a" label="SIMs active" value={simActive}
          stripe="#c4912a" active={tab==='sims' && statusFilter==='Active'}
          onClick={() => { setTab('sims'); setStatusFilter('Active'); setSearch(''); }} />
        <KpiCard icon="ti-alert-triangle" iconColor={simIssues>0?'var(--amber)':'var(--ink3)'} label="SIM issues" value={simIssues}
          stripe={simIssues>0?'var(--amber)':'var(--ink3)'} active={tab==='sims' && simIssues>0 && statusFilter!=='Active'}
          onClick={() => { setTab('sims'); setStatusFilter('All'); setSearch(''); }} />
        <KpiCard icon="ti-database" iconColor="var(--ink2)" label="Data used (GB)" value={(totalDataMB/1024).toFixed(1)}
          stripe="var(--ink3)" />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:16 }}>
        {([
          ['devices','ti-antenna','GPS Devices'],
          ['sims','ti-sim-card','SIM Cards'],
          ['associations','ti-link','Associations'],
        ] as const).map(([t,icon,lbl])=>{
          const unassignedCount = t === 'associations'
            ? devices.filter(d=>!d.vehicleId).length + sims.filter(s=>!s.vehicleId).length
            : 0;
          return (
          <button key={t} onClick={()=>{ setTab(t); setStatusFilter('All'); setSearch(''); }} style={{
            padding:'8px 20px', fontSize:13, border:'none', borderRadius:0, cursor:'pointer',
            fontFamily:'inherit', fontWeight:tab===t?600:400, background:'transparent',
            color:tab===t?'#c4912a':'var(--ink3)',
            borderBottom:tab===t?'2px solid #c4912a':'2px solid transparent',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <i className={`ti ${icon}`} style={{ fontSize:14 }} />{lbl}
            {unassignedCount > 0 && (
              <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:8, background:'var(--amber-lt)', color:'var(--amber)' }}>
                {unassignedCount}
              </span>
            )}
          </button>
          );
        })}
      </div>

      {/* Filters toolbar */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative' }}>
          <i className="ti ti-search" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--ink3)', pointerEvents:'none' }} />
          <input
            placeholder={tab==='devices'?'Search vehicle, serial, model…':'Search vehicle, MSISDN, operator…'}
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ ...inp, paddingLeft:30, minWidth:220 }}
          />
        </div>
        {tab==='devices' && (
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={inp}>
            <option value="All">All types</option>
            {refDeviceTypes.map(t=><option key={t.value}>{t.value}</option>)}
          </select>
        )}
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={inp}>
          <option value="All">All statuses</option>
          {(tab==='devices' ? DEVICE_STATUSES : SIM_STATUSES).map(s=><option key={s}>{s}</option>)}
        </select>
        <span style={{ marginLeft:'auto', fontSize:11, color:'var(--ink3)' }}>
          {tab==='devices' ? filteredDevices.length : filteredSims.length} records
        </span>
      </div>

      {/* ── Devices table ─────────────────────────────────────────────── */}
      {tab==='devices' && (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:980 }}>
              <thead>
                <tr>
                  {['DID','Vehicle','Device ID','Type','Model','Firmware','Signal','Battery','Last seen','Status',
                    ...(isSuperAdmin&&tenantFilter==='all'?['Tenant']:[]),
                    ...(canWrite?['Actions']:[]),
                  ].map(h=><th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length===0 ? (
                  <tr><td colSpan={12} style={{ padding:32, textAlign:'center', color:'var(--ink3)', fontSize:13 }}>No devices match your filters.</td></tr>
                ) : filteredDevices.map(d=>(
                  <tr key={d.id} style={{ background:d.status==='Offline'?'#fffaf8':d.status==='Maintenance'?'#fffbeb':'#fff' }}>
                    <td style={{ ...td, textAlign:'center' }}>
                      {d.did
                        ? <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#c4912a', background:'rgba(196,145,42,0.10)', padding:'2px 6px', borderRadius:4, border:'1px solid rgba(196,145,42,0.22)' }}>#{d.did}</span>
                        : <span style={{ color:'var(--ink3)', fontSize:11 }}>—</span>}
                    </td>
                    <td style={{ ...td }}>
                      {d.vehiclePlate
                        ? <div>
                            <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{d.vehiclePlate}</div>
                            {d.vid ? <div style={{ fontFamily:'monospace', fontSize:10, color:'#c4912a', fontWeight:700 }}>VID #{d.vid}</div> : null}
                          </div>
                        : <span style={{ fontSize:11, color:'var(--ink3)', fontStyle:'italic' }}>Unassigned</span>}
                    </td>
                    <td style={{ ...td, fontFamily:'monospace', fontWeight:700, color:'var(--ink)', fontSize:11 }}>{d.serialNo}</td>
                    <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:4, background:'var(--cream)', color:'var(--ink2)' }}>{d.type}</span></td>
                    <td style={{ ...td, color:'var(--ink)', fontSize:12 }}>{d.model}</td>
                    <td style={{ ...td, fontFamily:'monospace', fontSize:11, color:'var(--ink3)' }}>{d.firmware}</td>
                    <td style={td}><span style={{ color:SIG_COLOR[d.signal], fontWeight:700, fontSize:12 }}>● {d.signal}</span></td>
                    <td style={td}>{d.battery!==null ? <BatteryBar pct={d.battery} /> : <span style={{ fontSize:11, color:'var(--ink3)' }}>Hardwired</span>}</td>
                    <td style={{ ...td, color:'var(--ink3)', fontSize:11, whiteSpace:'nowrap' }}>{d.lastSeen}</td>
                    <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, ...STATUS_S[d.status] }}>{d.status}</span></td>
                    {isSuperAdmin&&tenantFilter==='all' && <td style={td}><TenantChip tenantId={d.tenantId} /></td>}
                    {canWrite && (
                      <td style={{ ...td, whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={()=>openEditDevice(d)} style={{ fontSize:10, padding:'2px 8px', borderRadius:3, border:'1px solid var(--border)', background:'#fff', color:'#c4912a', cursor:'pointer' }}>Edit</button>
                          <DeleteBtn onConfirm={()=>deleteDevice(d.id)} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SIMs table ────────────────────────────────────────────────── */}
      {tab==='sims' && (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:980 }}>
              <thead>
                <tr>
                  {['SIM#','Vehicle','ICCID','MSISDN','Operator','Type','Data usage','Status','Activated','Expires',
                    ...(isSuperAdmin&&tenantFilter==='all'?['Tenant']:[]),
                    ...(canWrite?['Actions']:[]),
                  ].map(h=><th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredSims.length===0 ? (
                  <tr><td colSpan={12} style={{ padding:32, textAlign:'center', color:'var(--ink3)', fontSize:13 }}>No SIMs match your filters.</td></tr>
                ) : filteredSims.map(s=>{
                  const pct=simDataUsagePct(s);
                  return (
                    <tr key={s.id} style={{ background:s.status!=='Active'?'#fffaf8':'#fff' }}>
                      <td style={{ ...td, textAlign:'center' }}>
                        {s.sid
                          ? <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#c4912a', background:'rgba(196,145,42,0.10)', padding:'2px 6px', borderRadius:4, border:'1px solid rgba(196,145,42,0.22)' }}>#{s.sid}</span>
                          : <span style={{ color:'var(--ink3)', fontSize:11 }}>—</span>}
                      </td>
                      <td style={{ ...td }}>
                        {s.vehiclePlate
                          ? <div>
                              <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{s.vehiclePlate}</div>
                              {s.vid ? <div style={{ fontFamily:'monospace', fontSize:10, color:'#c4912a', fontWeight:700 }}>VID #{s.vid}</div> : null}
                            </div>
                          : <span style={{ fontSize:11, color:'var(--ink3)', fontStyle:'italic' }}>Unassigned</span>}
                      </td>
                      <td style={{ ...td, fontFamily:'monospace', fontSize:10, color:'var(--ink3)' }}>{s.iccid}</td>
                      <td style={{ ...td, fontFamily:'monospace', fontSize:11, color:'var(--ink)' }}>{s.msisdn}</td>
                      <td style={td}>{s.operator}</td>
                      <td style={td}><span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:4, background:s.type==='Primary'?'rgba(196,145,42,0.12)':'var(--cream)', color:s.type==='Primary'?'#c4912a':'var(--ink3)' }}>{s.type}</span></td>
                      <td style={td}><DataBar used={s.dataUsedMB} total={s.dataPlanMB} pct={pct} /></td>
                      <td style={td}><span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, ...SIM_STATUS_S[s.status] }}>{s.status}</span></td>
                      <td style={{ ...td, fontSize:11, color:'var(--ink3)' }}>{s.activatedAt}</td>
                      <td style={{ ...td, fontSize:11, color:'var(--ink3)' }}>{s.expiresAt}</td>
                      {isSuperAdmin&&tenantFilter==='all' && <td style={td}><TenantChip tenantId={s.tenantId} /></td>}
                      {canWrite && (
                        <td style={{ ...td, whiteSpace:'nowrap' }}>
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={()=>openEditSim(s)} style={{ fontSize:10, padding:'2px 8px', borderRadius:3, border:'1px solid var(--border)', background:'#fff', color:'#c4912a', cursor:'pointer' }}>Edit</button>
                            <DeleteBtn onConfirm={()=>deleteSim(s.id)} />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'10px 14px', background:'var(--cream)', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--ink3)' }}>
            Total data consumed: <strong>{(totalDataMB/1024).toFixed(2)} GB</strong> across {filteredSims.length} SIMs
          </div>
        </div>
      )}

      {/* ── Associations tab ─────────────────────────────────────────── */}
      {tab === 'associations' && (() => {
        const scopedD = isSuperAdmin && tenantFilter !== 'all' ? devices.filter(d=>d.tenantId===tenantFilter) : devices;
        const scopedS = isSuperAdmin && tenantFilter !== 'all' ? sims.filter(s=>s.tenantId===tenantFilter)    : sims;

        /* Build vehicle-grouped bindings */
        const bindingMap = new Map<string, { vehicleId:string; plate:string; devs:GpsDevice[]; sims:SimCard[] }>();
        for (const d of scopedD) {
          if (!d.vehicleId) continue;
          if (!bindingMap.has(d.vehicleId)) bindingMap.set(d.vehicleId, { vehicleId:d.vehicleId, plate:d.vehiclePlate, devs:[], sims:[] });
          bindingMap.get(d.vehicleId)!.devs.push(d);
        }
        for (const s of scopedS) {
          if (!s.vehicleId) continue;
          if (!bindingMap.has(s.vehicleId)) bindingMap.set(s.vehicleId, { vehicleId:s.vehicleId, plate:s.vehiclePlate, devs:[], sims:[] });
          bindingMap.get(s.vehicleId)!.sims.push(s);
        }
        const bindings = Array.from(bindingMap.values()).sort((a,b)=>a.plate.localeCompare(b.plate));
        const unassignedDevs = scopedD.filter(d=>!d.vehicleId);
        const unassignedSims = scopedS.filter(s=>!s.vehicleId);
        const canLink = !!assocVehicle && (!!assocDevice || !!assocSim);

        const selS: React.CSSProperties = { flex:1, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:7, fontSize:12, color:'var(--ink)', background:'#fff', fontFamily:'inherit' };
        const chipBtn: React.CSSProperties = { fontSize:10, padding:'2px 6px', borderRadius:3, border:'1px solid #fca5a5', background:'#fef2f2', color:'var(--red)', cursor:'pointer', marginLeft:4, lineHeight:1 };

        return (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* ── Link form ──────────────────────────────────────────── */}
            <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:'20px 22px' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}><i className="ti ti-link" style={{ color:'#c4912a' }} /> Link to Vehicle</div>
              <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:16 }}>
                Select a vehicle, then choose one or more devices and/or SIM cards to associate with it.
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
                {/* Vehicle */}
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:0.6 }}>
                    <i className="ti ti-car" style={{ marginRight:3 }} /> Vehicle *
                  </label>
                  <select style={selS} value={assocVehicle} onChange={e=>setAssocVehicle(e.target.value)}>
                    <option value="">— Select vehicle —</option>
                    {scopedVehicles.map(v=><option key={v.id} value={v.id}>{v.plate}</option>)}
                  </select>
                </div>

                {/* Device */}
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:0.6 }}>
                    <i className="ti ti-antenna" style={{ marginRight:3 }} /> GPS Device
                  </label>
                  <select style={selS} value={assocDevice} onChange={e=>setAssocDevice(e.target.value)}>
                    <option value="">— None —</option>
                    {scopedD.filter(d=>!d.vehicleId).map(d=>(
                      <option key={d.id} value={d.id}>
                        {d.serialNo || d.imei} · {d.type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SIM */}
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:0.6 }}>
                    <i className="ti ti-sim-card" style={{ marginRight:3 }} /> SIM Card
                  </label>
                  <select style={selS} value={assocSim} onChange={e=>setAssocSim(e.target.value)}>
                    <option value="">— None —</option>
                    {scopedS.filter(s=>!s.vehicleId).map(s=>(
                      <option key={s.id} value={s.id}>
                        {s.msisdn || s.iccid.slice(-8)} · {s.operator}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:11, color:'var(--ink3)' }}>
                  {!assocVehicle && 'Select a vehicle to enable linking.'}
                  {assocVehicle && !assocDevice && !assocSim && 'Choose at least one device or SIM to link.'}
                  {assocVehicle && (assocDevice || assocSim) && (
                    <span style={{ color:'#c4912a', fontWeight:600 }}>
                      Ready to link{assocDevice ? ' 1 device' : ''}{assocDevice && assocSim ? ' +' : ''}{assocSim ? ' 1 SIM' : ''} → {scopedVehicles.find(v=>v.id===assocVehicle)?.plate}
                    </span>
                  )}
                </div>
                {canWrite && (
                  <button
                    onClick={handleLink}
                    disabled={!canLink}
                    style={{
                      padding:'8px 22px', fontSize:13, fontWeight:600, borderRadius:7, cursor: canLink ? 'pointer':'default',
                      border:'none', background: canLink ? '#c4912a':'var(--border)', color: canLink ? '#fff':'var(--ink3)',
                      fontFamily:'inherit', transition:'background 0.15s',
                    }}
                  >
                    <i className="ti ti-link" /> Link
                  </button>
                )}
              </div>
            </div>

            {/* ── Current bindings ───────────────────────────────────── */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>
                Current Associations — {bindings.length} vehicle{bindings.length!==1?'s':''}
              </div>

              {bindings.length === 0 && unassignedDevs.length === 0 && unassignedSims.length === 0 && (
                <div style={{ padding:32, textAlign:'center', color:'var(--ink3)', fontSize:13, background:'#fff', border:'1px solid var(--border)', borderRadius:10 }}>
                  No devices or SIMs in scope.
                </div>
              )}

              {bindings.map(b => {
                const bVehicle = vehicles.find(v => v.id === b.vehicleId);
                const hasGps   = bVehicle && bVehicle.latitude !== null && bVehicle.status !== 'offline' && bVehicle.status !== 'maintenance';
                return (
                <div key={b.vehicleId} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, marginBottom:10, overflow:'hidden' }}>
                  {/* Vehicle header — entire row is clickable */}
                  <div
                    onClick={() => router.push(`/vehicles/${b.vehicleId}`)}
                    style={{ padding:'10px 16px', background:'rgba(196,145,42,0.12)', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #c4912a20', cursor:'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#c4912a20'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.12)'}
                  >
                    <i className="ti ti-car" style={{ fontSize:16, color:'#c4912a' }} />
                    <span style={{ fontWeight:700, fontSize:13, color:'#c4912a', letterSpacing:0.5, textDecoration:'underline', textDecorationColor:'#c4912a', textUnderlineOffset:2 }}>{b.plate} →</span>
                    <span style={{ fontSize:10, color:'#c4912a', marginLeft:4 }}>
                      {b.devs.length} device{b.devs.length!==1?'s':''} · {b.sims.length} SIM{b.sims.length!==1?'s':''}
                    </span>
                    <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
                      {hasGps ? (
                        <button
                          onClick={() => router.push(`/vehicles/${b.vehicleId}`)}
                          style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, padding:'3px 10px', borderRadius:5, border:'1px solid #c4912a', background:'#fff', color:'#c4912a', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}
                        >
                          <i className="ti ti-map-pin" /> View Live Track
                        </button>
                      ) : (
                        <span style={{ fontSize:10, color:'var(--ink3)', display:'inline-flex', alignItems:'center', gap:4 }}>
                          <i className="ti ti-map-pin-off" /> No GPS signal
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                    {/* Devices column */}
                    <div style={{ padding:'12px 16px', borderRight:'1px solid var(--border)' }}>
                      <div style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-antenna" />GPS Devices</div>
                      {b.devs.length === 0
                        ? <span style={{ fontSize:11, color:'var(--ink3)' }}>None assigned</span>
                        : b.devs.map(d => (
                          <div
                            key={d.id}
                            onClick={() => { setTab('devices'); setSearch(d.serialNo); }}
                            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, padding:'5px 8px', background:'var(--cream)', borderRadius:6, cursor:'pointer', transition:'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream3)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream)'}
                            title="View in GPS Devices tab"
                          >
                            <div>
                              <div style={{ fontSize:11, fontWeight:600, color:'#c4912a', fontFamily:'monospace' }}>{d.serialNo}</div>
                              <div style={{ fontSize:10, color:'var(--ink3)' }}>{d.type} · {d.model}</div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:4, ...STATUS_S[d.status] }}>{d.status}</span>
                              {canWrite && <button onClick={e=>{ e.stopPropagation(); unlink('device',d.id); }} style={chipBtn} title="Remove from vehicle">✕</button>}
                            </div>
                          </div>
                        ))
                      }
                    </div>

                    {/* SIMs column */}
                    <div style={{ padding:'12px 16px' }}>
                      <div style={{ fontSize:9, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-sim-card" />SIM Cards</div>
                      {b.sims.length === 0
                        ? <span style={{ fontSize:11, color:'var(--ink3)' }}>None assigned</span>
                        : b.sims.map(s => (
                          <div
                            key={s.id}
                            onClick={() => { setTab('sims'); setSearch(s.msisdn); }}
                            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, padding:'5px 8px', background:'var(--cream)', borderRadius:6, cursor:'pointer', transition:'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream3)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream)'}
                            title="View in SIM Cards tab"
                          >
                            <div>
                              <div style={{ fontSize:11, fontWeight:600, color:'#c4912a', fontFamily:'monospace' }}>{s.msisdn}</div>
                              <div style={{ fontSize:10, color:'var(--ink3)' }}>{s.operator} · {s.type}</div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:4, ...SIM_STATUS_S[s.status] }}>{s.status}</span>
                              {canWrite && <button onClick={e=>{ e.stopPropagation(); unlink('sim',s.id); }} style={chipBtn} title="Remove from vehicle">✕</button>}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              ); })}

              {/* Unassigned pool */}
              {(unassignedDevs.length > 0 || unassignedSims.length > 0) && (
                <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:10, overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px', background:'#fef3c7', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #fcd34d' }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize:16, color:'#92400e' }} />
                    <span style={{ fontWeight:700, fontSize:13, color:'#92400e' }}>Unassigned Pool</span>
                    <span style={{ fontSize:10, color:'#b45309' }}>{unassignedDevs.length} device{unassignedDevs.length!==1?'s':''} · {unassignedSims.length} SIM{unassignedSims.length!==1?'s':''}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                    <div style={{ padding:'12px 16px', borderRight:'1px solid #fcd34d' }}>
                      <div style={{ fontSize:9, fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-antenna" /> GPS Devices</div>
                      {unassignedDevs.length === 0
                        ? <span style={{ fontSize:11, color:'var(--ink3)' }}>—</span>
                        : unassignedDevs.map(d => (
                          <div
                            key={d.id}
                            onClick={() => { setTab('devices'); setSearch(d.serialNo); }}
                            style={{ marginBottom:5, padding:'5px 8px', background:'#fff', borderRadius:6, border:'1px dashed #fcd34d', cursor:'pointer' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef9c3'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                            title="View in GPS Devices tab"
                          >
                            <div style={{ fontSize:11, fontWeight:600, color:'#92400e', fontFamily:'monospace' }}>{d.serialNo}</div>
                            <div style={{ fontSize:10, color:'var(--ink3)' }}>{d.type} · {d.model}</div>
                          </div>
                        ))
                      }
                    </div>
                    <div style={{ padding:'12px 16px' }}>
                      <div style={{ fontSize:9, fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-sim-card" /> SIM Cards</div>
                      {unassignedSims.length === 0
                        ? <span style={{ fontSize:11, color:'var(--ink3)' }}>—</span>
                        : unassignedSims.map(s => (
                          <div
                            key={s.id}
                            onClick={() => { setTab('sims'); setSearch(s.msisdn || s.iccid.slice(-8)); }}
                            style={{ marginBottom:5, padding:'5px 8px', background:'#fff', borderRadius:6, border:'1px dashed #fcd34d', cursor:'pointer' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef9c3'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                            title="View in SIM Cards tab"
                          >
                            <div style={{ fontSize:11, fontWeight:600, color:'#92400e', fontFamily:'monospace' }}>{s.msisdn || s.iccid.slice(-8)}</div>
                            <div style={{ fontSize:10, color:'var(--ink3)' }}>{s.operator} · {s.type}</div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {deviceModal && (
        <DeviceModal
          mode={deviceModal.mode}
          init={deviceModal.init}
          tenantId={tenantId}
          vehicles={scopedVehicles}
          onSave={f=>saveDevice(f, deviceModal.editId)}
          onClose={()=>setDeviceModal(null)}
        />
      )}
      {simModal && (
        <SimModal
          mode={simModal.mode}
          init={simModal.init}
          vehicles={scopedVehicles}
          onSave={f=>saveSim(f, simModal.editId)}
          onClose={()=>setSimModal(null)}
        />
      )}
    </div>
  );
}
