'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { PlaybackMap, RoutePoint, ignitionState, IGN_COLOR, IGN_LABEL } from '@/components/maps/PlaybackMap';
import { TENANTS_META, VehicleMaster } from '@/lib/vehiclesMaster';
import { useVehiclesStore } from '@/store/vehiclesStore';
import { useUIStore } from '@/store/uiStore';
import type { Trip } from '@/lib/trips';
import { fmtDuration } from '@/lib/trips';
import { useTripsStore } from '@/store/tripsStore';

/**
 * Generate a generic demo route from a vehicle's last known GPS position.
 * Used for fleet-manager / dispatcher / super-admin view when browsing
 * any vehicle (no real per-trip telemetry available in the mock).
 */
function buildGenericRoute(v: VehicleMaster): RoutePoint[] {
  const baseLat = v.latitude  ?? 40.7128;
  const baseLng = v.longitude ?? -74.0060;
  const alert   = v.speedKmh && v.speedKmh > 68 ? `Speed alert — ${v.speedKmh} km/h` : null;
  return [
    /* ── Leg 1: depot → first stop ─────────────────────────────── */
    { lat: baseLat,           lng: baseLng,          time:'07:00', speed:0,  ignition:true,  event:`Ignition ON — departed depot · ${v.plate}` },
    { lat: baseLat - 0.0080,  lng: baseLng + 0.0060, time:'07:10', speed:48, ignition:true,  event:null },
    { lat: baseLat - 0.0150,  lng: baseLng + 0.0130, time:'07:22', speed:62, ignition:true,  event:null },
    { lat: baseLat - 0.0210,  lng: baseLng + 0.0220, time:'07:34', speed:v.speedKmh ?? 71, ignition:true, event:alert },
    { lat: baseLat - 0.0265,  lng: baseLng + 0.0310, time:'07:45', speed:55, ignition:true,  event:`Geofence exit — ${v.department ?? 'Operations Zone'}` },
    /* ── Delivery stop: ignition OFF ────────────────────────────── */
    { lat: baseLat - 0.0295,  lng: baseLng + 0.0365, time:'07:58', speed:0,  ignition:false, event:'Ignition OFF — delivery stop' },
    { lat: baseLat - 0.0295,  lng: baseLng + 0.0365, time:'08:14', speed:0,  ignition:false, event:null },
    /* ── Leg 2: resume → destination ────────────────────────────── */
    { lat: baseLat - 0.0295,  lng: baseLng + 0.0365, time:'08:15', speed:0,  ignition:true,  event:'Ignition ON — resuming' },
    { lat: baseLat - 0.0340,  lng: baseLng + 0.0440, time:'08:26', speed:58, ignition:true,  event:null },
    { lat: baseLat - 0.0395,  lng: baseLng + 0.0530, time:'08:38', speed:64, ignition:true,  event:null },
    { lat: baseLat - 0.0445,  lng: baseLng + 0.0620, time:'08:52', speed:0,  ignition:false, event:`Ignition OFF — arrived · ${v.customerName ?? v.make + ' depot'}` },
  ];
}

export default function PlaybackPage() {
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const { user }        = useAuthStore();
  const role            = user?.role ?? 'viewer';
  const isSuperAdmin    = role === 'super_admin' || role === 'platform_admin';
  const isVehicleOwner  = role === 'vehicle_owner';
  const tenantId        = user?.tenantId ?? '1';

  const allTrips    = useTripsStore(s => s.trips);
  const tripsLoading = useTripsStore(s => s.loading);

  // ── Vehicle owner: trip-centric mode ─────────────────────────────────────
  // Resolve owned vehicle IDs early so trip filtering can use them
  const ownedVehicleIds = useMemo(() => {
    if (role !== 'vehicle_owner') return null;
    if (user?.vehicleIds?.length) return user.vehicleIds;
    if (user?.vehicleId) return [user.vehicleId];
    return [];
  }, [role, user?.vehicleIds, user?.vehicleId]);

  // vehicle_owner only sees trips for their own vehicle(s)
  const trips = useMemo(() =>
    ownedVehicleIds ? allTrips.filter(t => ownedVehicleIds.includes(t.vehicleId)) : allTrips,
  [allTrips, ownedVehicleIds]);

  const fromParam     = searchParams.get('from');
  const fromMyVehicle = fromParam === 'my-vehicle';

  // Initialize from URL param, or first already-loaded trip (avoids blank on revisit)
  const [selectedTripId, setSelectedTripId] = useState<string>(
    () => searchParams.get('trip') ?? useTripsStore.getState().trips[0]?.id ?? ''
  );
  const selectedTrip: Trip | undefined = trips.find(t => t.id === selectedTripId);

  // Whether a specific trip was requested via URL (any role can deep-link to a trip)
  const hasTripParam = !!searchParams.get('trip');

  // Sync when URL param changes OR when trips finish loading with no valid selection
  useEffect(() => {
    const param = searchParams.get('trip');
    if (param) {
      setSelectedTripId(param);
    } else if (trips.length > 0 && !trips.find(t => t.id === selectedTripId)) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, searchParams, selectedTripId]);

  const vehicles        = useVehiclesStore(s => s.vehicles);
  const vehiclesLoading = useVehiclesStore(s => s.loading);
  const getById         = useVehiclesStore(s => s.getById);

  // Helper: resolve plate from a vehicleId across the full store
  const plateFor = (vid: string) => getById(vid)?.plate ?? vid;

  // ── Fleet / admin mode: vehicle-centric ──────────────────────────────────
  const tenantVehicles = useMemo(() => {
    if (isSuperAdmin) return vehicles;
    if (isVehicleOwner) {
      const ids = user?.vehicleIds?.length ? user.vehicleIds : user?.vehicleId ? [user.vehicleId] : [];
      return vehicles.filter(v => ids.includes(v.id));
    }
    return vehicles.filter(v => v.tenantId === tenantId);
  }, [isSuperAdmin, isVehicleOwner, vehicles, tenantId, user?.vehicleId, user?.vehicleIds]);

  const [tenantFilter, setTenantFilter] = useState('all');
  const visibleVehicles = useMemo(() =>
    isSuperAdmin && tenantFilter !== 'all'
      ? tenantVehicles.filter(v => v.tenantId === tenantFilter)
      : tenantVehicles,
  [tenantVehicles, isSuperAdmin, tenantFilter]);

  // persist middleware rehydrates async — read localStorage directly for synchronous init
  const [vehicleId, setVehicleId] = useState<string>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('fleet:ui') : null;
      const persisted = raw ? (JSON.parse(raw)?.state?.selectedVehicleId as string) : '';
      if (persisted) return persisted;
    } catch {}
    return useVehiclesStore.getState().vehicles[0]?.id || '';
  });
  const [date, setDate] = useState('2026-05-26');

  // When the visible set changes (filter, or first load), auto-select if current id is invalid
  useEffect(() => {
    if (visibleVehicles.length > 0 && !visibleVehicles.find(v => v.id === vehicleId)) {
      // prefer last-persisted selection if it belongs to this tenant's visible set
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('fleet:ui') : null;
        const persisted = raw ? (JSON.parse(raw)?.state?.selectedVehicleId as string) : '';
        if (persisted && visibleVehicles.find(v => v.id === persisted)) {
          setVehicleId(persisted);
          setStep(0);
          setPlaying(false);
          return;
        }
      } catch {}
      setVehicleId(visibleVehicles[0].id);
      setStep(0);
      setPlaying(false);
    }
  }, [visibleVehicles, vehicleId]);

  const selectedVehicle = useMemo(
    () => visibleVehicles.find(v => v.id === vehicleId) ?? visibleVehicles[0],
    [visibleVehicles, vehicleId],
  );

  // ── Playback engine ───────────────────────────────────────────────────────
  const routePoints: RoutePoint[] = useMemo(() => {
    // Use real trip route when: vehicle_owner (always), or ?trip= param present (any role)
    if ((isVehicleOwner || hasTripParam) && selectedTrip) return selectedTrip.route;
    return selectedVehicle ? buildGenericRoute(selectedVehicle) : [];
  }, [isVehicleOwner, hasTripParam, selectedTrip, selectedVehicle]);

  const [step,    setStep]    = useState(0);
  const [playing, setPlaying] = useState(false);

  // Reset playback whenever the route changes
  useEffect(() => { setStep(0); setPlaying(false); }, [routePoints]);

  useEffect(() => {
    if (!playing) return;
    if (step >= routePoints.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [playing, step, routePoints.length]);

  const reset = () => { setStep(0); setPlaying(false); };
  const pt    = routePoints[step];

  const avgSpeed  = Math.round(routePoints.filter(p => p.speed > 0).reduce((s, p) => s + p.speed, 0) / Math.max(1, routePoints.filter(p => p.speed > 0).length));
  const maxSpeed  = Math.max(...routePoints.map(p => p.speed));
  const eventsCnt = routePoints.filter(p => p.event && !p.event.startsWith('Departed') && !p.event.startsWith('Arrived')).length;

  // Loading skeleton — shown while data is still arriving from the API
  const isLoading = (isVehicleOwner ? tripsLoading : vehiclesLoading) && visibleVehicles.length === 0 && trips.length === 0;
  if (isLoading) {
    return (
      <div style={{ padding: '14px 18px' }}>
        <div style={{ background: 'linear-gradient(135deg,#0d1b2a,#162033)', borderRadius: 10, padding: '14px 18px', marginBottom: 14, height: 62, border: '1px solid rgba(196,145,42,0.18)' }} />
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 16, height: 64, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 200, height: 32, borderRadius: 6, background: 'var(--cream3)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ width: 120, height: 32, borderRadius: 6, background: 'var(--cream3)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
          <div style={{ marginLeft: 'auto', width: 90, height: 32, borderRadius: 6, background: '#c4912a30', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', height: 360, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--ink3)', fontSize: 13 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }} />
          Loading route data…
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // True empty states — only shown after loading has completed
  if (isVehicleOwner && !tripsLoading && trips.length === 0) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No trips recorded yet</div>
        <div style={{ fontSize: 12, color: 'var(--ink3)' }}>No trip history is available for your vehicle.</div>
      </div>
    );
  }

  if (!isVehicleOwner && !vehiclesLoading && visibleVehicles.length === 0) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No vehicles available</div>
        <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
          {isSuperAdmin ? 'No vehicles found for the selected tenant.' : `No vehicles are registered under ${user?.tenantName ?? 'your tenant'}.`}
        </div>
      </div>
    );
  }

  // ── Shared trip progress badge ────────────────────────────────────────────
  const progressPct = routePoints.length > 1 ? Math.round((step / (routePoints.length - 1)) * 100) : 0;

  return (
    <div style={{ padding: '14px 18px' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--hero-s) 0%, var(--hero-m) 55%, var(--hero-e) 100%)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 14,
        boxShadow: '0 4px 24px rgba(13,27,42,0.50), inset 0 1px 0 rgba(196,145,42,0.15)',
        border: '1px solid rgba(196,145,42,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {fromMyVehicle && (
            <button onClick={() => router.push('/my-vehicle')} style={{
              width: 34, height: 34, borderRadius: 8, background: 'rgba(196,145,42,0.12)',
              border: '1px solid rgba(196,145,42,0.22)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#f5d07a', flexShrink: 0,
            }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
            </button>
          )}
          <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(196,145,42,0.15)', border: '1px solid rgba(196,145,42,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-route" style={{ fontSize: 19, color: '#f5d07a' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(245,208,122,0.7)', marginBottom: 2 }}>Real-time Ops</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Route Playback</div>
          </div>
        </div>
        <div>
          {isSuperAdmin
            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)' }}>👁 ALL TENANTS</span>
            : isVehicleOwner
            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)' }}>🚗 My vehicle{(ownedVehicleIds?.length ?? 0) > 1 ? 's' : ''} only</span>
            : <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(196,145,42,0.15)', color: '#f5d07a', border: '1px solid rgba(196,145,42,0.28)' }}>🔒 {user?.tenantName ?? 'Tenant'}</span>
          }
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>

        {/* ── Trip selector (vehicle_owner always; other roles when navigated via ?trip=) ── */}
        {(isVehicleOwner || hasTripParam) && (
          <div style={{ flex: 1, minWidth: 260 }}>
            <label style={{ fontSize: 11, color: 'var(--ink3)', display: 'block', marginBottom: 4 }}>Select trip</label>
            <select
              value={selectedTrip?.id ?? selectedTripId}
              onChange={e => { setSelectedTripId(e.target.value); }}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--ink)', background: '#fff', fontFamily: 'inherit' }}
            >
              {trips.map(t => (
                <option key={t.id} value={t.id}>
                  {plateFor(t.vehicleId)} · {t.date} · {t.from} → {t.to} · {t.distanceKm} km{t.status === 'In Progress' ? ' 🔴 Live' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── FLEET / ADMIN: tenant + vehicle + date selectors ── */}
        {!isVehicleOwner && !hasTripParam && (
          <>
            {isSuperAdmin && (
              <div>
                <label style={{ fontSize: 11, color: 'var(--ink3)', display: 'block', marginBottom: 4 }}>Tenant</label>
                <select
                  value={tenantFilter}
                  onChange={e => { setTenantFilter(e.target.value); reset(); }}
                  style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--ink)' }}
                >
                  <option value="all">All tenants</option>
                  {Object.entries(TENANTS_META).map(([tid, meta]) => (
                    <option key={tid} value={tid}>{meta.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: 11, color: 'var(--ink3)', display: 'block', marginBottom: 4 }}>Vehicle</label>
              <select
                value={selectedVehicle?.id ?? ''}
                onChange={e => { setVehicleId(e.target.value); reset(); }}
                style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--ink)' }}
              >
                {isSuperAdmin && tenantFilter === 'all'
                  ? Object.entries(TENANTS_META).map(([tid, meta]) => {
                      const tvs = visibleVehicles.filter(v => v.tenantId === tid);
                      if (!tvs.length) return null;
                      return (
                        <optgroup key={tid} label={`── ${meta.name}`}>
                          {tvs.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.make} {v.model}</option>)}
                        </optgroup>
                      );
                    })
                  : visibleVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} — {v.make} {v.model}</option>
                    ))
                }
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--ink3)', display: 'block', marginBottom: 4 }}>Date</label>
              <input
                type="date" value={date}
                onChange={e => { setDate(e.target.value); reset(); }}
                style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--ink)' }}
              />
            </div>

            {selectedVehicle && (
              <div style={{ padding: '6px 12px', background: 'var(--cream)', borderRadius: 8, fontSize: 11, color: 'var(--ink2)' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{selectedVehicle.plate}</span>
                {' · '}{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                {' · '}{selectedVehicle.fuelType}
                {isSuperAdmin && (
                  <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: (TENANTS_META[selectedVehicle.tenantId]?.color ?? '#000') + '18', color: TENANTS_META[selectedVehicle.tenantId]?.color ?? 'var(--ink3)' }}>
                    {TENANTS_META[selectedVehicle.tenantId]?.name}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Playback controls ── */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'flex-end' }}>
          {/* Progress indicator */}
          {routePoints.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--ink3)', alignSelf: 'center', minWidth: 52 }}>
              {progressPct}%
            </div>
          )}
          <button onClick={reset} style={{ padding: '7px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink2)', fontFamily: 'inherit' }}>
            ↩ Reset
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            style={{ padding: '7px 20px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: 'none', background: '#c4912a', color: '#fff', fontWeight: 500, fontFamily: 'inherit' }}
          >
            {playing ? '⏸ Pause' : step === 0 ? '▶ Play' : '▶ Resume'}
          </button>
        </div>
      </div>

      {/* ── Trip info strip (shown when a specific trip is loaded) ────────── */}
      {(isVehicleOwner || hasTripParam) && selectedTrip && (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
          padding: '12px 18px', marginBottom: 16,
          display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 2 }}>VEHICLE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: 'monospace', letterSpacing: 0.5 }}>
              {plateFor(selectedTrip.vehicleId)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 2 }}>ROUTE</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{selectedTrip.from}</div>
            <div style={{ fontSize: 11, color: 'var(--ink3)' }}>→ {selectedTrip.to}</div>
          </div>
          {[
            ['Distance',  `${selectedTrip.distanceKm} km`],
            ['Duration',  fmtDuration(selectedTrip.durationMin)],
            ['Avg speed', `${selectedTrip.avgSpeed} km/h`],
            ['Max speed', `${selectedTrip.maxSpeed} km/h`],
            ['Fuel used', `${selectedTrip.fuelUsedL} L`],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 2 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: selectedTrip.maxSpeed > 90 && label === 'Max speed' ? 'var(--red)' : 'var(--ink)' }}>{value}</div>
            </div>
          ))}
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: selectedTrip.status === 'In Progress' ? 'rgba(196,145,42,0.12)' : '#f1f5f9',
            color:      selectedTrip.status === 'In Progress' ? '#c4912a' : 'var(--ink3)',
            border: `1px solid ${selectedTrip.status === 'In Progress' ? '#c4912a' : 'var(--border)'}`,
          }}>
            {selectedTrip.status === 'In Progress' ? '🔴 Live / In Progress' : '✓ Completed'}
          </span>
        </div>
      )}

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      {pt && (
        <>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
            <PlaybackMap
              points={routePoints}
              stepIndex={step}
              height={360}
              category={
                (isVehicleOwner || hasTripParam)
                  ? (getById(selectedTrip?.vehicleId ?? '')?.category ?? selectedVehicle?.category)
                  : selectedVehicle?.category
              }
            />
          </div>

          {/* ── Info row ─────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Current point</div>
              {/* Ignition state badge */}
              {(() => {
                const igs = ignitionState(pt);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '6px 10px', borderRadius: 7, background: IGN_COLOR[igs] + '14', border: `1px solid ${IGN_COLOR[igs]}40` }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: IGN_COLOR[igs], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: IGN_COLOR[igs] }}>{IGN_LABEL[igs]}</span>
                    {igs === 'on-moving' && pt.speed > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 'auto' }}>{pt.speed} km/h</span>
                    )}
                  </div>
                );
              })()}
              {([
                ['Time',      pt.time],
                ['Speed',     pt.speed ? `${pt.speed} km/h` : 'Stopped'],
                ['Step',      `${step + 1} / ${routePoints.length}`],
                ['Lat / Lng', `${pt.lat.toFixed(4)}, ${pt.lng.toFixed(4)}`],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--ink3)' }}>{l}</span>
                  <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              {pt.event && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: '#fffbeb', borderRadius: 6, fontSize: 12, color: '#d97706', fontWeight: 500 }}>
                  ⚠ {pt.event}
                </div>
              )}
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Trip summary</div>
              {((isVehicleOwner || hasTripParam) && selectedTrip
                ? [
                    ['Vehicle',   plateFor(selectedTrip.vehicleId)],
                    ['Route',     `${selectedTrip.from} → ${selectedTrip.to}`],
                    ['Date',      selectedTrip.date],
                    ['Distance',  `${selectedTrip.distanceKm} km`],
                    ['Avg speed', `${avgSpeed} km/h`],
                    ['Max speed', `${maxSpeed} km/h`],
                    ['Events',    `${eventsCnt} alert${eventsCnt !== 1 ? 's' : ''}`],
                  ]
                : [
                    ['Vehicle',   selectedVehicle?.plate ?? '—'],
                    ['Tenant',    isSuperAdmin ? (TENANTS_META[selectedVehicle?.tenantId ?? '']?.name ?? '—') : (user?.tenantName ?? '—')],
                    ['Date',      date],
                    ['Driver',    selectedVehicle?.driverName ?? 'Unassigned'],
                    ['Avg speed', avgSpeed > 0 ? `${avgSpeed} km/h` : '—'],
                    ['Max speed', maxSpeed > 0 ? `${maxSpeed} km/h` : '—'],
                    ['Events',    `${eventsCnt} alert${eventsCnt !== 1 ? 's' : ''}`],
                  ].filter(([l]) => !(!isSuperAdmin && l === 'Tenant'))
              ).map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--ink3)' }}>{l}</span>
                  <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Timeline ─────────────────────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1 }}>Timeline</div>
              <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                Click any waypoint to jump · {step + 1} of {routePoints.length}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 3, background: 'var(--cream3)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: '#c4912a', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 6, left: `calc(100% / ${routePoints.length * 2})`, right: `calc(100% / ${routePoints.length * 2})`, height: 3, background: 'var(--border2)', zIndex: 0 }} />
              <div style={{
                position: 'absolute', top: 6,
                left: `calc(100% / ${routePoints.length * 2})`,
                width: `calc((100% - 100% / ${routePoints.length}) * ${step} / ${routePoints.length - 1})`,
                height: 3, background: '#c4912a', zIndex: 1, transition: 'width 0.3s',
              }} />
              {routePoints.map((p, i) => {
                const igs    = ignitionState(p);
                const dotClr = i <= step ? IGN_COLOR[igs] : 'var(--border2)';
                const isActive = i === step;
                return (
                  <div
                    key={i}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', zIndex: 2 }}
                    onClick={() => { setStep(i); setPlaying(false); }}
                  >
                    <div style={{
                      width: 15, height: 15, borderRadius: '50%',
                      background: dotClr,
                      border: `3px solid ${isActive ? dotClr : 'transparent'}`,
                      boxSizing: 'border-box',
                      boxShadow: isActive ? `0 0 0 3px ${IGN_COLOR[igs]}30` : 'none',
                      transition: 'background 0.2s, box-shadow 0.2s',
                    }} />
                    <div style={{ fontSize: 10, color: i <= step ? IGN_COLOR[igs] : 'var(--ink3)', marginTop: 6, whiteSpace: 'nowrap' }}>{p.time}</div>
                    {p.event && <div style={{ fontSize: 9, color: '#d97706', marginTop: 2 }}>⚠</div>}
                  </div>
                );
              })}
            </div>

            {/* Event log */}
            {routePoints.some(p => p.event) && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Events on this trip</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {routePoints.map((p, i) => {
                    if (!p.event) return null;
                    const igs    = ignitionState(p);
                    const clr    = i <= step ? IGN_COLOR[igs] : 'var(--ink3)';
                    const active = i === step;
                    return (
                      <div
                        key={i}
                        onClick={() => { setStep(i); setPlaying(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                          background: active ? `${IGN_COLOR[igs]}14` : i < step ? '#f8fafc' : '#fff',
                          border: `1px solid ${active ? IGN_COLOR[igs] : 'var(--border)'}`,
                          opacity: i > step ? 0.45 : 1, transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: i <= step ? IGN_COLOR[igs] : 'var(--border2)' }} />
                        <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'monospace', flexShrink: 0 }}>{p.time}</span>
                        <span style={{ fontSize: 12, color: clr, fontWeight: active ? 700 : 400 }}>{p.event}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
