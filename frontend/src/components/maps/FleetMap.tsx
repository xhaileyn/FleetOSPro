'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, Polyline } from 'react-leaflet';

export const STATUS_COLOR: Record<string, string> = {
  active:  '#c4912a',
  idle:    '#d97706',
  offline: '#9ca3af',
};

export interface VehiclePin {
  id:           string;
  driver:       string;
  status:       'active' | 'idle' | 'offline';
  speed:        number;
  lat:          number;
  lng:          number;
  fuel:         number;
  tenantId?:    string;
  /* enriched fields */
  make?:        string;
  model?:       string;
  year?:        number;
  category?:    string;
  customerName?: string;
  odometer?:    number;
  tenantName?:  string;
}

interface Props {
  vehicles:    VehiclePin[];
  height?:     number | string;
  zoom?:       number;
  center?:     [number, number];
  selectedId?: string | null;
  onSelectId?: (id: string | null) => void;
  /** Fires when a map pin is clicked — opens the full tracking modal */
  onPinClick?: (pin: VehiclePin) => void;
  trail?:      [number, number][];
  liveLat?:    number;
  liveLng?:    number;
  /* multi-vehicle trails keyed by vehicle id */
  trails?:     Record<string, [number, number][]>;
  /** Auto-fit the viewport to show all vehicle pins */
  fitAll?:     boolean;
}

/* ── Custom vehicle marker icon ───────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _L: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getL(): any {
  if (!_L && typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _L = require('leaflet');
  }
  return _L;
}

/* State → background color (distinct enough to read at a glance) */
const MARKER_BG: Record<string, string> = {
  active:  '#16a34a',   // green  — moving
  idle:    '#d97706',   // amber  — engine on, stopped
  offline: '#64748b',   // slate  — no signal
};

/* Category → Tabler icon class (CSS font — works because Tabler stylesheet is global) */
const CATEGORY_TI: Record<string, string> = {
  Truck:      'ti-truck',
  Van:        'ti-van',
  Pickup:     'ti-car-suv',
  Car:        'ti-car',
  Bus:        'ti-bus',
  Motorcycle: 'ti-motorbike',
  Trailer:    'ti-container',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function vehicleIcon(v: VehiclePin, isSelected: boolean, location?: string): any {
  const L = getL();
  if (!L) return undefined;

  const bg     = MARKER_BG[v.status] ?? '#64748b';
  const ti     = CATEGORY_TI[v.category ?? ''] ?? 'ti-truck';
  const sz     = isSelected ? 40 : 34;
  const border = isSelected ? '3px solid #c4912a' : '2.5px solid rgba(255,255,255,0.95)';
  const shadow = isSelected
    ? '0 0 0 4px rgba(196,145,42,0.30),0 4px 14px rgba(0,0,0,0.50)'
    : '0 2px 8px rgba(0,0,0,0.38)';
  const fs     = isSelected ? 20 : 17;
  const loc    = location?.trim() ?? '';
  const W      = Math.max(sz, 76);   // wide enough for the location label
  const H      = sz + 8 + (loc ? 16 : 0);

  const labelHtml = loc
    ? `<div style="max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;` +
      `font-size:9px;font-weight:700;color:#1e293b;font-family:system-ui,sans-serif;` +
      `background:rgba(255,255,255,0.94);padding:1px 5px;border-radius:3px;` +
      `box-shadow:0 1px 4px rgba(0,0,0,0.18);line-height:14px;margin-top:2px;">${loc}</div>`
    : '';

  const html =
    `<div style="display:flex;flex-direction:column;align-items:center;width:${W}px;">` +
      `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${bg};border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;">` +
        `<i class="ti ${ti}" style="font-size:${fs}px;color:#fff;line-height:1;"></i>` +
      `</div>` +
      `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${bg};"></div>` +
      labelHtml +
    `</div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize:      [W, H],
    iconAnchor:    [W / 2, sz + 8],   // anchor = tip of the tail, not bottom of label
    popupAnchor:   [0, -(sz + 10)],
    tooltipAnchor: [0, -(sz / 2 + 6)],
  });
}

const NEW_YORK: [number, number] = [40.7128, -74.0060];
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/* Flies to the selected vehicle and programmatically opens its popup */
function MapController({ vehicles, selectedId, markerRefs }: {
  vehicles: VehiclePin[];
  selectedId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markerRefs: React.MutableRefObject<Map<string, any>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const v = vehicles.find(x => x.id === selectedId);
    if (!v) return;
    map.flyTo([v.lat, v.lng], Math.max(map.getZoom(), 12), { duration: 0.7 });
    const timer = setTimeout(() => {
      markerRefs.current.get(selectedId)?.openPopup();
    }, 750);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);
  return null;
}

/* Auto-fits the viewport to the bounding box of all vehicle pins */
function FitBounds({ vehicles }: { vehicles: VehiclePin[] }) {
  const map = useMap();
  const count = vehicles.length;
  useEffect(() => {
    if (count === 0) return;
    if (count === 1) {
      map.setView([vehicles[0].lat, vehicles[0].lng], 13);
      return;
    }
    const lats = vehicles.map(v => v.lat);
    const lngs = vehicles.map(v => v.lng);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [48, 48], maxZoom: 13, animate: true, duration: 0.8 },
    );
  // re-fit only when the set of pins changes size (filter applied)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  return null;
}

/* Smoothly pans the map to the live vehicle position on each update */
function LiveTracker({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    map.panTo([lat, lng], { animate: true, duration: 1.0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

export function FleetMap({ vehicles, height = 420, zoom = 11, center, selectedId, onSelectId, onPinClick, trail, liveLat, liveLng, trails, fitAll }: Props) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRefs = useRef<Map<string, any>>(new Map());
  useEffect(() => { setMounted(true); }, []);

  /* ── Reverse-geocode each pin to get a short location label ─────── */
  const geoCache = useRef<Record<string, string>>({});           // key = "lat,lng"
  const [pinLocs, setPinLocs] = useState<Record<string, string>>({}); // key = vehicleId

  useEffect(() => {
    if (!mounted) return;
    // Only geocode vehicles not yet in cache; stagger to respect rate limits
    const todo = vehicles.filter(v => {
      const key = `${v.lat.toFixed(3)},${v.lng.toFixed(3)}`;
      return geoCache.current[key] === undefined;
    });
    todo.forEach((v, i) => {
      const key = `${v.lat.toFixed(3)},${v.lng.toFixed(3)}`;
      geoCache.current[key] = '';   // mark in-flight
      setTimeout(async () => {
        try {
          const r = await fetch(`/api/v1/geocode/reverse?lat=${v.lat}&lng=${v.lng}`);
          const { label } = (await r.json()) as { label: string };
          geoCache.current[key] = label ?? '';
          if (label) setPinLocs(prev => ({ ...prev, [v.id]: label }));
        } catch { /* silently ignore */ }
      }, i * 350);
    });
    // For already-cached vehicles (re-render after filter change) populate state
    vehicles.forEach(v => {
      const key = `${v.lat.toFixed(3)},${v.lng.toFixed(3)}`;
      const cached = geoCache.current[key];
      if (cached) setPinLocs(prev => prev[v.id] === cached ? prev : { ...prev, [v.id]: cached });
    });
  // re-run when the set of vehicle IDs changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, vehicles.map(v => v.id).join(',')]);
  /* ── ────────────────────────────────────────────────────────────── */

  const sel    = selectedId;
  const setSel = onSelectId ?? (() => {});

  if (!mounted) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', color: 'var(--ink3)', fontSize: 13 }}>
      Loading map…
    </div>
  );

  return (
    <MapContainer
      center={center ?? NEW_YORK}
      zoom={zoom}
      style={{ width: '100%', height }}
      scrollWheelZoom
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <MapController vehicles={vehicles} selectedId={sel ?? null} markerRefs={markerRefs} />
      <LiveTracker lat={liveLat} lng={liveLng} />
      {fitAll && vehicles.length > 0 && <FitBounds vehicles={vehicles} />}
      {/* single-vehicle trail (alert modal) */}
      {trail && trail.length > 1 && (
        <Polyline positions={trail} pathOptions={{ color: '#c4912a', weight: 3, opacity: 0.85, dashArray: '6 5' }} />
      )}
      {/* multi-vehicle trails (dashboard) */}
      {trails && Object.entries(trails).map(([vid, pts]) =>
        pts.length > 1 ? (
          <Polyline key={vid} positions={pts} pathOptions={{ color: '#c4912a', weight: 2.5, opacity: 0.7, dashArray: '5 4' }} />
        ) : null
      )}

      {vehicles.map(v => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={vehicleIcon(v, sel === v.id, pinLocs[v.id])}
          ref={(ref: any) => { if (ref) markerRefs.current.set(v.id, ref); }} // eslint-disable-line @typescript-eslint/no-explicit-any
          eventHandlers={{
            click: () => {
              setSel(v.id === sel ? null : v.id);
              onPinClick?.(v);
            },
          }}
        >
          {/* Hover tooltip — plate + speed */}
          <Tooltip direction="top" offset={[0, -4]} opacity={0.97}>
            <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2px 4px', minWidth: 120 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ fontSize: 13, letterSpacing: 0.5 }}>{v.id}</strong>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                  background: v.status === 'active' ? '#ccfbf1' : v.status === 'idle' ? '#fef3c7' : '#f3f4f6',
                  color:      v.status === 'active' ? '#065f46' : v.status === 'idle' ? '#92400e' : '#6b7280',
                }}>{v.status}</span>
              </div>
              {v.driver !== 'No driver' && (
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{v.driver}</div>
              )}
              {v.status === 'active' && v.speed > 0 && (
                <div style={{ fontSize: 10, color: '#c4912a', marginTop: 2, fontWeight: 600 }}>{v.speed} km/h</div>
              )}
              <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 3, textAlign: 'center' }}>Click to open live tracking</div>
            </div>
          </Tooltip>

          {/* Compact popup — shown when selected from sidebar (no onPinClick available here) */}
          <Popup minWidth={200} maxWidth={240}>
            <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#111', letterSpacing: 0.5 }}>{v.id}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase',
                  background: v.status === 'active' ? '#ccfbf1' : v.status === 'idle' ? '#fef3c7' : '#f3f4f6',
                  color:      v.status === 'active' ? '#065f46' : v.status === 'idle' ? '#92400e' : '#6b7280',
                }}>{v.status}</span>
              </div>
              {(v.make || v.model) && (
                <div style={{ fontSize: 11, color: '#374151', marginBottom: 6 }}>
                  {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: '#9ca3af' }}>Driver</span>
                  <span style={{ fontWeight: 600, color: '#111' }}>{v.driver}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: '#9ca3af' }}>Speed</span>
                  <span style={{ fontWeight: 600, color: v.speed > 0 ? '#c4912a' : '#6b7280' }}>
                    {v.status === 'active' && v.speed > 0 ? `${v.speed} km/h` : 'Stopped'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, alignItems: 'center' }}>
                  <span style={{ color: '#9ca3af' }}>Fuel</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 48, height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${v.fuel}%`, height: '100%', borderRadius: 2, background: v.fuel > 50 ? '#c4912a' : v.fuel > 20 ? '#d97706' : '#dc2626' }} />
                    </div>
                    <span style={{ fontWeight: 600, color: v.fuel > 50 ? '#c4912a' : v.fuel > 20 ? '#d97706' : '#dc2626', fontSize: 10 }}>{v.fuel}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
