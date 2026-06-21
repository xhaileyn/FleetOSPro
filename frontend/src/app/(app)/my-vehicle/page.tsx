'use client';

import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { TENANTS_META } from '@/lib/vehiclesMaster';
import { fmtDuration } from '@/lib/trips';
import { useTripsStore } from '@/store/tripsStore';
import dynamic from 'next/dynamic';
import { VehicleTrackingModal } from '@/components/tracking/VehicleTrackingModal';
import type { VehiclePin } from '@/components/maps/FleetMap';

const VehicleMap = dynamic(() => import('./VehicleMap'), { ssr: false, loading: () => (
  <div style={{ height:'100%', minHeight:220, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--cream)', color:'var(--ink3)', fontSize:13 }}>
    <i className="ti ti-loader" style={{ marginRight:7 }} />Loading map…
  </div>
)});

const STATUS_COLOR_MAP: Record<string, string> = {
  active:      '#16a34a',
  idle:        '#d97706',
  offline:     '#94a3b8',
  maintenance: '#2563eb',
};
const STATUS_BG_MAP: Record<string, string> = {
  active:      '#dcfce7',
  idle:        '#fef9c3',
  offline:     '#f1f5f9',
  maintenance: '#eff6ff',
};
const STATUS_ICON_CLS: Record<string, string> = {
  active: 'ti-player-play', idle: 'ti-player-pause', offline: 'ti-wifi-off', maintenance: 'ti-tool',
};

/* ── Compact stat card ─────────────────────────────────────────────── */
function StatCard({ icon, iconColor, label, value, unit, sub, bar, barColor, badge }: {
  icon: string; iconColor: string; label: string;
  value: string | number; unit?: string; sub?: string;
  bar?: number; barColor?: string; badge?: React.ReactNode;
}) {
  const chipBg = iconColor + '18';
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', boxShadow:'0 1px 2px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:36, height:36, borderRadius:8, background:chipBg, display:'flex', alignItems:'center', justifyContent:'center', color:iconColor, fontSize:17, flexShrink:0 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--ink3)', marginBottom:1 }}>{label}</div>
        <div style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.5px', lineHeight:1, color:'var(--ink)', display:'flex', alignItems:'baseline', gap:3 }}>
          {value}
          {unit && <span style={{ fontSize:10, fontWeight:400, color:'var(--ink3)' }}>{unit}</span>}
        </div>
        {bar !== undefined && (
          <div style={{ marginTop:4, height:3, background:'var(--cream3)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(100, bar)}%`, background: barColor ?? iconColor, borderRadius:2, transition:'width 0.8s ease' }} />
          </div>
        )}
        {sub && <div style={{ fontSize:9, color:'var(--ink3)', marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sub}</div>}
      </div>
      {badge}
    </div>
  );
}

/* ── Card wrapper ──────────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:9, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  );
}
function CardHeader({ icon, title, right }: { icon: string; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ padding:'9px 13px', borderBottom:'1px solid var(--border)', background:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <i className={`ti ${icon}`} style={{ fontSize:13, color:'#c4912a' }} />
        <span style={{ fontSize:11, fontWeight:700, color:'#0d1b2a', textTransform:'uppercase', letterSpacing:'0.5px' }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function MyVehiclePage() {
  const isMobile = useIsMobile();
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const urlVehicleId  = searchParams.get('id');
  const { user }    = useAuthStore();
  const allVehicles = useVehiclesStore(s => s.vehicles);
  const role        = user?.role ?? 'viewer';
  const tenantId    = user?.tenantId ?? null;

  const isVehicleOwner = role === 'vehicle_owner';
  const isFleetOps     = role === 'fleet_admin' || role === 'fleet_manager' || role === 'tenant_admin';
  const isSuperAdmin   = role === 'super_admin' || role === 'platform_admin';

  const ownedIds: string[] = (() => {
    // Super/platform admins can view any vehicle
    if (isSuperAdmin) return allVehicles.map(v => v.id);
    if (isVehicleOwner) {
      if (user?.vehicleIds && user.vehicleIds.length > 0) return user.vehicleIds;
      if (user?.vehicleId) return [user.vehicleId];
      return [];
    }
    if (isFleetOps && tenantId) {
      const tv = allVehicles.filter(v => v.tenantId === tenantId);
      if (tv.length > 0) return tv.map(v => v.id);
    }
    if (user?.vehicleIds && user.vehicleIds.length > 0) return user.vehicleIds;
    if (user?.vehicleId) return [user.vehicleId];
    return allVehicles.length > 0 ? [allVehicles[0].id] : [];
  })();

  const [vehicleId, setVehicleId] = useState(urlVehicleId ?? ownedIds[0]);
  const getById       = useVehiclesStore(s => s.getById);
  const ownedKey      = ownedIds.join(',');
  // Reset to first owned vehicle when tenant changes, but respect URL param
  useEffect(() => { if (!urlVehicleId) setVehicleId(ownedIds[0]); }, [ownedKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // Apply URL param when it changes (e.g. navigating from dashboard)
  useEffect(() => { if (urlVehicleId) setVehicleId(urlVehicleId); }, [urlVehicleId]);

  const vehicle          = getById(vehicleId);
  const getByVehicle     = useTripsStore(s => s.getByVehicle);
  const TRIPS            = getByVehicle(vehicleId);
  const ownedVehicles    = ownedIds.map(id => allVehicles.find(v => v.id === id)).filter(Boolean) as NonNullable<ReturnType<typeof getById>>[];

  const [liveSpeed, setLiveSpeed] = useState(vehicle?.speedKmh ?? 0);
  const [liveTime,  setLiveTime]  = useState(new Date().toLocaleTimeString('en-GB'));
  useEffect(() => {
    const t = setInterval(() => {
      setLiveSpeed(s => Math.max(0, Math.min(110, Math.round(s + (Math.random() - 0.45) * 4))));
      setLiveTime(new Date().toLocaleTimeString('en-GB'));
    }, 3000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { setLiveSpeed(vehicle?.speedKmh ?? 0); }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [trackingOpen, setTrackingOpen] = useState(false);

  /* Country-centre fallback when vehicle has no GPS fix */
  const COUNTRY_CENTER: Record<string, [number, number]> = {
    Kenya: [-1.2921, 36.8219], Uganda: [0.3476, 32.5825], Tanzania: [-6.369, 34.889],
    Nigeria: [9.082, 8.6753], Ghana: [7.946, -1.023], 'South Africa': [-30.559, 22.938],
    Ethiopia: [9.145, 40.489], Rwanda: [-1.940, 29.874],
    'United Kingdom': [51.5074, -0.1278], UK: [51.5074, -0.1278],
    'United States': [37.09, -95.712], USA: [37.09, -95.712],
    India: [20.594, 78.963], Pakistan: [30.375, 69.345],
    UAE: [23.424, 53.848], 'Saudi Arabia': [23.886, 45.079],
    Germany: [51.165, 10.452], France: [46.227, 2.213],
    Australia: [-25.274, 133.775], Canada: [56.130, -106.347],
  };

  const scopedVehicles = isFleetOps && tenantId
    ? allVehicles.filter(v => v.tenantId === tenantId)
    : ownedVehicles;
  const activeVehicles = scopedVehicles.filter(v => v.status === 'active').slice(0, 6);

  if (!vehicle) {
    return (
      <div style={{ padding:'48px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:12, color:'var(--ink3)' }}>
        <i className="ti ti-truck-off" style={{ fontSize:40, opacity:0.3 }} />
        <div style={{ fontSize:15, fontWeight:600, color:'var(--ink)' }}>No vehicle assigned</div>
        <div style={{ fontSize:13 }}>Contact your fleet administrator.</div>
      </div>
    );
  }

  const sColor  = STATUS_COLOR_MAP[vehicle.status]  ?? '#94a3b8';
  const sBg     = STATUS_BG_MAP[vehicle.status]     ?? '#f1f5f9';
  const sIcon   = STATUS_ICON_CLS[vehicle.status]   ?? 'ti-circle';
  const CAT_ICON: Record<string, string> = {
    Truck: 'ti-truck', Van: 'ti-van', Pickup: 'ti-car-suv',
    Car: 'ti-car', Bus: 'ti-bus', Motorcycle: 'ti-motorbike', Trailer: 'ti-container',
  };
  const vIcon = CAT_ICON[vehicle.category] ?? 'ti-car';

  return (
    <div className="page-in" style={{ padding:'14px 18px' }}>

      {/* ── Hero header ──────────────────────────────────────────────── */}
      <div style={{
        background:'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius:10, padding:'12px 16px', color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexWrap:'wrap', gap:10, marginBottom:14,
        boxShadow:'0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border:'1px solid rgba(196,145,42,0.18)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Back to dashboard (when navigated from dashboard) */}
          {urlVehicleId && (
            <button onClick={() => router.push('/dashboard')} style={{
              width:34, height:34, borderRadius:7, background:'rgba(196,145,42,0.12)',
              border:'1px solid rgba(196,145,42,0.22)', cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', color:'#f5d07a', flexShrink:0,
            }}>
              <i className="ti ti-arrow-left" style={{ fontSize:14 }} />
            </button>
          )}
          {/* Vehicle icon chip */}
          <div style={{ width:38, height:38, borderRadius:8, background:'rgba(196,145,42,0.15)', border:'1px solid rgba(196,145,42,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#f5d07a' }}>
            <i className={`ti ${vIcon}`} style={{ fontSize:18 }} />
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'rgba(245,208,122,0.7)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>
              {isVehicleOwner ? 'My Vehicle' : 'Vehicle Overview'}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
              <span style={{ fontSize:17, fontWeight:700, letterSpacing:'-0.5px', lineHeight:1 }}>{vehicle.plate}</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background: sColor + '30', color:'#fff', border:`1px solid ${sColor}60` }}>
                <i className={`ti ${sIcon}`} style={{ fontSize:10 }} />
                {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
              </span>
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>
              {vehicle.year} {vehicle.make} {vehicle.model}
              {vehicle.category && <> · {vehicle.category}</>}
              {vehicle.fuelType  && <> · {vehicle.fuelType}</>}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* VIN */}
          {vehicle.vin && (
            <div style={{ fontSize:9, fontFamily:'monospace', color:'rgba(245,208,122,0.55)', padding:'4px 8px', background:'rgba(196,145,42,0.08)', border:'1px solid rgba(196,145,42,0.15)', borderRadius:5 }}>
              VIN {vehicle.vin}
            </div>
          )}
          {/* Track button */}
          <button onClick={() => setTrackingOpen(true)} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'6px 13px', fontSize:11, fontWeight:700,
            borderRadius:7, border:'1px solid rgba(196,145,42,0.35)',
            background:'rgba(196,145,42,0.15)', color:'#f5d07a',
            cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.25)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.15)'}
          >
            <i className="ti ti-radar" style={{ fontSize:12 }} />
            Live Tracking
          </button>
        </div>
      </div>

      {/* ── Fleet ops vehicle dropdown ────────────────────────────────── */}
      {isFleetOps && ownedVehicles.length > 0 && (
        <Card style={{ marginBottom:12 }}>
          <div style={{ padding:'9px 13px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <i className="ti ti-list-search" style={{ fontSize:13, color:'var(--ink3)' }} />
            <span style={{ fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'0.7px', flexShrink:0 }}>Select vehicle</span>
            <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}
              style={{ flex:1, minWidth:220, padding:'5px 9px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, color:'var(--ink)', background:'#fff', fontFamily:'inherit', cursor:'pointer' }}>
              {ownedVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.year} {v.make} {v.model} · {v.status}
                </option>
              ))}
            </select>
            <span style={{ fontSize:10, color:'var(--ink3)', flexShrink:0 }}>{ownedVehicles.length} vehicle{ownedVehicles.length !== 1 ? 's' : ''}</span>
          </div>
        </Card>
      )}

      {/* ── Multi-vehicle picker (owner with multiple) ───────────────── */}
      {isVehicleOwner && ownedVehicles.length > 1 && (
        <div style={{ marginBottom:12, display:'flex', gap:8, flexWrap:'wrap' }}>
          {ownedVehicles.map(v => {
            const sel   = v.id === vehicleId;
            const sc    = STATUS_COLOR_MAP[v.status] ?? '#94a3b8';
            return (
              <button key={v.id} onClick={() => setVehicleId(v.id)} style={{
                display:'flex', alignItems:'center', gap:9,
                padding:'7px 13px', borderRadius:8,
                border:`2px solid ${sel ? '#c4912a' : 'var(--border)'}`,
                background: sel ? 'rgba(196,145,42,0.12)' : '#fff',
                cursor:'pointer', fontFamily:'inherit', transition:'border-color 0.15s',
              }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:sc, flexShrink:0 }} />
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:12, fontWeight:700, color: sel ? '#c4912a' : 'var(--ink)' }}>{v.plate}</div>
                  <div style={{ fontSize:9, color:'var(--ink3)' }}>{v.make} {v.model}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── 4-up stat cards ─────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:8, marginBottom:12 }}>
        <StatCard
          icon="ti-gauge"
          iconColor={liveSpeed > 90 ? '#dc2626' : liveSpeed > 60 ? '#d97706' : '#16a34a'}
          label="Speed"
          value={liveSpeed}
          unit=" km/h"
          bar={(liveSpeed / 120) * 100}
          barColor={liveSpeed > 90 ? '#dc2626' : liveSpeed > 60 ? '#f59e0b' : '#16a34a'}
          sub="Limit: 80 km/h"
          badge={liveSpeed > 0 ? <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 0 3px #22c55e28', flexShrink:0 }} /> : undefined}
        />
        <StatCard
          icon="ti-gas-station"
          iconColor={vehicle.fuelLevel < 20 ? '#dc2626' : vehicle.fuelLevel < 40 ? '#d97706' : '#16a34a'}
          label="Fuel Level"
          value={vehicle.fuelLevel}
          unit="%"
          bar={vehicle.fuelLevel}
          barColor={vehicle.fuelLevel < 20 ? '#dc2626' : vehicle.fuelLevel < 40 ? '#f59e0b' : '#16a34a'}
          sub={vehicle.fuelLevel < 20 ? 'Low — refuel needed' : 'Tank ~200L'}
        />
        <StatCard
          icon="ti-road"
          iconColor="#7c3aed"
          label="Odometer"
          value={vehicle.odometer.toLocaleString()}
          unit=" km"
          bar={((vehicle.odometer - 40000) / (55000 - 40000)) * 100}
          barColor="#8b5cf6"
          sub="Next service: 55,000 km"
        />
        <StatCard
          icon="ti-satellite"
          iconColor="#0891b2"
          label="GPS & Engine"
          value={vehicle.latitude ? 'Online' : 'Offline'}
          sub={vehicle.latitude ? `${vehicle.latitude.toFixed(4)}, ${vehicle.longitude?.toFixed(4)}` : 'No GPS signal'}
          badge={
            <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
              {[
                { label:'Engine', on: liveSpeed > 0 },
                { label:'GPS',    on: !!vehicle.latitude },
              ].map(({ label, on }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background: on ? '#22c55e' : '#94a3b8', flexShrink:0 }} />
                  <span style={{ fontSize:8, color:'var(--ink3)', fontWeight:600 }}>{label}</span>
                </div>
              ))}
            </div>
          }
        />
      </div>

      {/* ── Map + Active vehicles ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:10, marginBottom:12 }}>

        {/* Map */}
        <Card style={{ display:'flex', flexDirection:'column', minHeight:300 }}>
          <CardHeader
            icon="ti-map-pin"
            title={`Live Location — ${vehicle.plate}`}
            right={
              vehicle.latitude && (
                <span style={{ fontSize:9, fontFamily:'monospace', color:'var(--ink3)' }}>
                  {vehicle.latitude.toFixed(4)}, {vehicle.longitude?.toFixed(4)}
                </span>
              )
            }
          />
          <div style={{ flex:1, minHeight:260 }}>
            {(() => {
              const hasGps = !!(vehicle.latitude && vehicle.longitude);
              const tenantCountry = TENANTS_META[vehicle.tenantId]?.country;
              const fallback: [number, number] =
                COUNTRY_CENTER[tenantCountry ?? ''] ??
                COUNTRY_CENTER[vehicle.registrationCountry ?? ''] ??
                [-1.2921, 36.8219];
              const mapLat = vehicle.latitude ?? fallback[0];
              const mapLng = vehicle.longitude ?? fallback[1];
              return (
                <VehicleMap
                  lat={mapLat} lng={mapLng} hasGps={hasGps}
                  plate={vehicle.plate} speed={liveSpeed}
                  status={vehicle.status} category={vehicle.category}
                  onPinClick={hasGps ? () => {
                    const latestTrip = TRIPS[0];
                    if (latestTrip) router.push(`/playback?trip=${latestTrip.id}&from=my-vehicle`);
                    else router.push('/playback?from=my-vehicle');
                  } : undefined}
                />
              );
            })()}
          </div>
        </Card>

        {/* Active vehicles panel */}
        <Card style={{ display:'flex', flexDirection:'column' }}>
          <CardHeader
            icon="ti-activity"
            title="Active Vehicles"
            right={
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10, background:'rgba(196,145,42,0.12)', color:'#c4912a' }}>
                {activeVehicles.length} active
              </span>
            }
          />
          <div style={{ flex:1, overflowY:'auto', padding:'6px' }}>
            {activeVehicles.length === 0 ? (
              <div style={{ padding:'28px 12px', textAlign:'center', color:'var(--ink3)', fontSize:12 }}>
                <i className="ti ti-zzz" style={{ fontSize:24, opacity:0.3, display:'block', marginBottom:6 }} />
                No active vehicles right now
              </div>
            ) : activeVehicles.map(v => {
              const sel = v.id === vehicleId;
              return (
                <div key={v.id} onClick={() => setVehicleId(v.id)} style={{
                  background: sel ? 'rgba(196,145,42,0.12)' : '#fff',
                  border:`1px solid ${sel ? '#c4912a' : 'var(--border)'}`,
                  borderLeft:`3px solid ${sel ? '#c4912a' : '#16a34a'}`,
                  borderRadius:7, padding:'8px 10px', marginBottom:5,
                  cursor:'pointer', transition:'background 0.12s',
                }}
                  onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}
                  onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:6 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background: sel ? '#c4912a' : '#16a34a', flexShrink:0 }} />
                        <span style={{ fontSize:12, fontWeight:700, color: sel ? '#c4912a' : 'var(--ink)' }}>{v.plate}</span>
                        {sel && <span style={{ fontSize:8, fontWeight:700, color:'#c4912a', background:'rgba(196,145,42,0.12)', border:'1px solid #c4912a', padding:'1px 4px', borderRadius:3 }}>VIEWING</span>}
                      </div>
                      <div style={{ fontSize:10, color:'var(--ink3)' }}>
                        {v.driverName ?? <span style={{ fontStyle:'italic' }}>Unassigned</span>}
                      </div>
                      <div style={{ fontSize:9, color:'var(--ink3)', marginTop:1 }}>{v.make} {v.model}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:16, fontWeight:700, color:(v.speedKmh ?? 0) > 90 ? 'var(--red)' : '#c4912a', letterSpacing:'-0.5px' }}>
                        {v.speedKmh ?? 0}<span style={{ fontSize:9, fontWeight:400, color:'var(--ink3)' }}>km/h</span>
                      </div>
                      <div style={{ fontSize:9, color:'var(--ink3)', marginTop:1, display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end' }}>
                        <i className="ti ti-gas-station" style={{ fontSize:9 }} />{v.fuelLevel}%
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop:5, height:2, background:'var(--cream3)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${v.fuelLevel}%`, background: v.fuelLevel < 20 ? 'var(--red)' : v.fuelLevel < 40 ? '#f59e0b' : sel ? '#c4912a' : '#16a34a', borderRadius:2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Trip history ─────────────────────────────────────────────── */}
      <Card style={{ marginBottom:12 }}>
        <CardHeader icon="ti-history" title="Recent Trips" right={
          <span style={{ fontSize:9, color:'var(--ink3)' }}>{TRIPS.length} trip{TRIPS.length !== 1 ? 's' : ''}</span>
        } />
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--cream)' }}>
                {['Date','Route','Dist.','Duration','Avg spd','Max spd','Fuel','Status',''].map(h => (
                  <th key={h} style={{ padding:'7px 11px', textAlign:'left', fontSize:9, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRIPS.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding:'28px', textAlign:'center', color:'var(--ink3)', fontSize:12 }}>
                    No trips recorded yet
                  </td>
                </tr>
              ) : TRIPS.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : 'var(--cream)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#fff' : 'var(--cream)'}
                >
                  <td style={{ padding:'8px 11px', fontSize:11, color:'var(--ink3)', whiteSpace:'nowrap', borderBottom:'1px solid var(--border)' }}>{t.date}</td>
                  <td style={{ padding:'8px 11px', fontSize:11, borderBottom:'1px solid var(--border)', maxWidth:160 }}>
                    <div style={{ fontWeight:600, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.from}</div>
                    <div style={{ color:'var(--ink3)', fontSize:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>→ {t.to}</div>
                  </td>
                  <td style={{ padding:'8px 11px', fontSize:11, color:'var(--ink2)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{t.distanceKm} km</td>
                  <td style={{ padding:'8px 11px', fontSize:11, color:'var(--ink2)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{fmtDuration(t.durationMin)}</td>
                  <td style={{ padding:'8px 11px', fontSize:11, color:'var(--ink2)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{t.avgSpeed} km/h</td>
                  <td style={{ padding:'8px 11px', fontSize:11, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap',
                    color: t.maxSpeed > 90 ? 'var(--red)' : 'var(--ink2)',
                    fontWeight: t.maxSpeed > 90 ? 700 : 400 }}>
                    {t.maxSpeed > 90 && <i className="ti ti-alert-triangle" style={{ fontSize:9, marginRight:3 }} />}
                    {t.maxSpeed} km/h
                  </td>
                  <td style={{ padding:'8px 11px', fontSize:11, color:'var(--ink2)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{t.fuelUsedL}L</td>
                  <td style={{ padding:'8px 11px', borderBottom:'1px solid var(--border)' }}>
                    <span style={{
                      fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10,
                      background: t.status === 'In Progress' ? 'rgba(196,145,42,0.12)' : 'var(--cream2)',
                      color:      t.status === 'In Progress' ? '#c4912a' : 'var(--ink3)',
                    }}>{t.status}</span>
                  </td>
                  <td style={{ padding:'6px 11px', borderBottom:'1px solid var(--border)' }}>
                    <button onClick={() => router.push(`/playback?trip=${t.id}`)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', fontSize:10, fontWeight:700, borderRadius:5, cursor:'pointer', fontFamily:'inherit', border:'1px solid #c4912a', background: t.status === 'In Progress' ? '#c4912a' : 'rgba(196,145,42,0.12)', color: t.status === 'In Progress' ? '#fff' : '#c4912a', whiteSpace:'nowrap' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#c4912a'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.status === 'In Progress' ? '#c4912a' : 'rgba(196,145,42,0.12)'; (e.currentTarget as HTMLElement).style.color = t.status === 'In Progress' ? '#fff' : '#c4912a'; }}
                    >
                      <i className={`ti ${t.status === 'In Progress' ? 'ti-live-view' : 'ti-player-play'}`} style={{ fontSize:10 }} />
                      {t.status === 'In Progress' ? 'Live' : 'Replay'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Documents ────────────────────────────────────────────────── */}
      {vehicle.documents && vehicle.documents.length > 0 && (
        <Card>
          <CardHeader icon="ti-file-description" title="Documents" right={
            <span style={{ fontSize:9, color:'var(--ink3)' }}>{vehicle.documents.length} document{vehicle.documents.length !== 1 ? 's' : ''}</span>
          } />
          <div style={{ padding:'10px 12px', display:'flex', gap:8, flexWrap:'wrap' }}>
            {vehicle.documents.map(doc => {
              const c = doc.status === 'Valid' ? '#c4912a' : doc.status === 'Expiring Soon' ? '#d97706' : 'var(--red)';
              const b = doc.status === 'Valid' ? 'rgba(196,145,42,0.12)' : doc.status === 'Expiring Soon' ? '#fffbeb' : '#fef2f2';
              const ic = doc.status === 'Valid' ? 'ti-circle-check' : doc.status === 'Expiring Soon' ? 'ti-clock-exclamation' : 'ti-alert-circle';
              return (
                <div key={doc.id} style={{ background:b, border:`1px solid ${c}30`, borderLeft:`3px solid ${c}`, borderRadius:7, padding:'8px 12px', minWidth:160, flex:'1 1 160px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                    <i className={`ti ${ic}`} style={{ fontSize:11, color:c }} />
                    <span style={{ fontSize:9, fontWeight:700, color:c, textTransform:'uppercase', letterSpacing:'0.5px' }}>{doc.status}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)', marginBottom:2 }}>{doc.type}</div>
                  <div style={{ fontSize:9, color:'var(--ink3)', display:'flex', alignItems:'center', gap:4 }}>
                    <i className="ti ti-calendar" style={{ fontSize:9 }} />Expires {doc.expiryDate}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Reports ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader icon="ti-report-analytics" title="Reports" right={
          TRIPS.length > 0 ? (
            <button
              onClick={() => {
                const header = 'Date,From,To,Distance (km),Duration,Avg Speed (km/h),Max Speed (km/h),Fuel Used (L),Status';
                const rows = TRIPS.map(t =>
                  [t.date, t.from, t.to, t.distanceKm, fmtDuration(t.durationMin), t.avgSpeed, t.maxSpeed, t.fuelUsedL, t.status].join(',')
                );
                const csv = [header, ...rows].join('\n');
                const el = document.createElement('a');
                el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                el.download = `trips-${vehicle?.plate ?? 'vehicle'}-${new Date().toISOString().slice(0,10)}.csv`;
                el.click();
              }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', fontSize:10, fontWeight:600, border:'1px solid #c4912a', borderRadius:5, background:'rgba(196,145,42,0.10)', color:'#c4912a', cursor:'pointer', fontFamily:'inherit' }}
            >
              <i className="ti ti-download" style={{ fontSize:11 }} /> Export CSV
            </button>
          ) : undefined
        } />
        {TRIPS.length === 0 ? (
          <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--ink3)', fontSize:12 }}>
            No trip data recorded for this vehicle yet.
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
              {[
                { icon:'ti-road', color:'#c4912a', label:'Total trips', value: String(TRIPS.length) },
                { icon:'ti-map-pin-2', color:'var(--blue)', label:'Total distance', value: TRIPS.reduce((s,t)=>s+t.distanceKm,0).toFixed(0)+' km' },
                { icon:'ti-clock', color:'var(--amber)', label:'Total drive time', value: fmtDuration(TRIPS.reduce((s,t)=>s+t.durationMin,0)) },
                { icon:'ti-droplet', color:'var(--red)', label:'Fuel used', value: TRIPS.reduce((s,t)=>s+t.fuelUsedL,0).toFixed(1)+' L' },
              ].map(r => (
                <div key={r.label} style={{ textAlign:'center', padding:'6px 4px', borderRadius:6, background:'var(--cream)' }}>
                  <i className={`ti ${r.icon}`} style={{ fontSize:16, color:r.color, display:'block', marginBottom:3 }} />
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{r.value}</div>
                  <div style={{ fontSize:9, color:'var(--ink3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{r.label}</div>
                </div>
              ))}
            </div>
            {/* Trip list */}
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead>
                  <tr style={{ background:'var(--cream)', borderBottom:'1px solid var(--border)' }}>
                    {['Date','From → To','Distance','Duration','Avg Speed','Fuel','Status'].map(h => (
                      <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontWeight:700, color:'var(--ink2)', fontSize:10, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRIPS.slice().sort((a,b)=> b.dateISO.localeCompare(a.dateISO)).map((t,i) => (
                    <tr key={t.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? '#fff' : 'var(--cream)' }}>
                      <td style={{ padding:'7px 10px', whiteSpace:'nowrap', color:'var(--ink2)' }}>{t.date}</td>
                      <td style={{ padding:'7px 10px', color:'var(--ink)' }}>{t.from} → {t.to}</td>
                      <td style={{ padding:'7px 10px', fontWeight:600, color:'var(--ink)' }}>{t.distanceKm} km</td>
                      <td style={{ padding:'7px 10px', color:'var(--ink2)' }}>{fmtDuration(t.durationMin)}</td>
                      <td style={{ padding:'7px 10px', color:'var(--ink2)' }}>{t.avgSpeed} km/h</td>
                      <td style={{ padding:'7px 10px', color:'var(--ink2)' }}>{t.fuelUsedL} L</td>
                      <td style={{ padding:'7px 10px' }}>
                        <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4,
                          background: t.status === 'Completed' ? 'rgba(196,145,42,0.12)' : '#dcfce7',
                          color: t.status === 'Completed' ? '#c4912a' : '#166534',
                        }}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* ── Live tracking modal ───────────────────────────────────────── */}
      {trackingOpen && vehicle && (
        <VehicleTrackingModal
          vehicle={vehicle}
          initialPin={vehicle.latitude && vehicle.longitude ? {
            id: vehicle.plate, driver: vehicle.driverName ?? 'Unassigned',
            status: (vehicle.status === 'active' ? 'active' : vehicle.status === 'idle' ? 'idle' : 'offline') as VehiclePin['status'],
            speed: liveSpeed, lat: vehicle.latitude, lng: vehicle.longitude,
            fuel: vehicle.fuelLevel, tenantId: vehicle.tenantId,
            make: vehicle.make, model: vehicle.model, year: vehicle.year,
            category: vehicle.category, odometer: vehicle.odometer,
          } satisfies VehiclePin : null}
          onClose={() => setTrackingOpen(false)}
        />
      )}
    </div>
  );
}
