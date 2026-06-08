'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';

export interface RoutePoint {
  lat:       number;
  lng:       number;
  time:      string;
  speed:     number;
  event:     string | null;
  ignition?: boolean;   // true = key on; omitted → derived from speed > 0
}

export type IgnState = 'on-moving' | 'on-idle' | 'off';

export function ignitionState(p: RoutePoint): IgnState {
  const on = p.ignition !== undefined ? p.ignition : p.speed > 0;
  if (!on) return 'off';
  return p.speed > 0 ? 'on-moving' : 'on-idle';
}

export const IGN_COLOR: Record<IgnState, string> = {
  'on-moving': '#16a34a',
  'on-idle':   '#d97706',
  'off':       '#dc2626',
};

export const IGN_LABEL: Record<IgnState, string> = {
  'on-moving': 'IGN ON',
  'on-idle':   'IDLE',
  'off':       'IGN OFF',
};

const SEG_DASH: Record<IgnState, string> = {
  'on-moving': '9 5',
  'on-idle':   '3 6',
  'off':       '4 9',
};

interface Props {
  points:    RoutePoint[];
  stepIndex: number;
  height?:   number | string;
  category?: string;
}

const TILE_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/* ── Leaflet SSR-safe lazy load ──────────────────────────────────────── */
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

const CATEGORY_TI: Record<string, string> = {
  Truck: 'ti-truck', Van: 'ti-van', Pickup: 'ti-car-suv',
  Car: 'ti-car', Bus: 'ti-bus', Motorcycle: 'ti-motorbike', Trailer: 'ti-container',
};

/* Current-position vehicle icon — size and color change with ignition state */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function positionIcon(state: IgnState, category?: string): any {
  const L = getL();
  if (!L) return undefined;

  const bg  = IGN_COLOR[state];
  const lbl = IGN_LABEL[state];
  const ti  = CATEGORY_TI[category ?? ''] ?? 'ti-truck';
  const sz  = 44;
  const W   = 56;

  const html =
    `<div style="display:flex;flex-direction:column;align-items:center;width:${W}px;">` +
      `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${bg};` +
      `border:3px solid #fff;box-shadow:0 0 0 4px ${bg}38,0 4px 16px rgba(0,0,0,0.45);` +
      `display:flex;align-items:center;justify-content:center;">` +
        `<i class="ti ${ti}" style="font-size:22px;color:#fff;line-height:1;"></i>` +
      `</div>` +
      `<div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid ${bg};"></div>` +
      `<div style="font-size:8px;font-weight:800;color:${bg};background:rgba(255,255,255,0.97);` +
      `padding:1px 6px;border-radius:3px;box-shadow:0 1px 5px rgba(0,0,0,0.18);` +
      `line-height:13px;margin-top:1px;letter-spacing:0.8px;white-space:nowrap;">${lbl}</div>` +
    `</div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize:      [W, sz + 10 + 15],
    iconAnchor:    [W / 2, sz + 10],
    popupAnchor:   [0, -(sz + 12)],
    tooltipAnchor: [0, -(sz / 2 + 8)],
  });
}

/* Small flag / pin icons for start and end */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function waypointIcon(color: string, tiClass: string): any {
  const L = getL();
  if (!L) return undefined;
  const sz = 26;
  const html =
    `<div style="display:flex;flex-direction:column;align-items:center;width:${sz}px;">` +
      `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${color};` +
      `border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.32);` +
      `display:flex;align-items:center;justify-content:center;">` +
        `<i class="ti ${tiClass}" style="font-size:13px;color:#fff;line-height:1;"></i>` +
      `</div>` +
      `<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${color};"></div>` +
    `</div>`;
  return L.divIcon({
    html, className: '',
    iconSize:      [sz, sz + 7],
    iconAnchor:    [sz / 2, sz + 7],
    tooltipAnchor: [0, -(sz + 9)],
  });
}

/* Stop-event icon (ignition-off dot shown at mid-route stops) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stopIcon(color: string): any {
  const L = getL();
  if (!L) return undefined;
  const html =
    `<div style="width:14px;height:14px;border-radius:50%;background:${color};` +
    `border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`;
  return L.divIcon({
    html, className: '',
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });
}

/** Re-fits the map whenever the route set changes (new vehicle selected). */
function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const key = positions.length > 0
    ? `${positions[0][0]},${positions[0][1]},${positions[positions.length - 1][0]},${positions[positions.length - 1][1]}`
    : '';
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [48, 48], animate: true, duration: 0.6 });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14, { animate: true, duration: 0.6 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export function PlaybackMap({ points, stepIndex, height = 380, category }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', color: 'var(--ink3)', fontSize: 13 }}>
      Loading map…
    </div>
  );

  const allPos  = points.map(p => [p.lat, p.lng] as [number, number]);
  const current = points[stepIndex];
  const curState = current ? ignitionState(current) : 'off';
  const fallback: [number, number] = allPos[Math.floor(allPos.length / 2)] ?? [40.7128, -74.006];

  /* Build traveled segments grouped by ignition state.
     Segment i→i+1 is colored by the state at point i. */
  type Seg = { state: IgnState; pts: [number, number][] };
  const segments: Seg[] = [];
  for (let i = 0; i < stepIndex && i < points.length - 1; i++) {
    const state = ignitionState(points[i]);
    const last  = segments[segments.length - 1];
    if (!last || last.state !== state) {
      segments.push({ state, pts: [[points[i].lat, points[i].lng]] });
    }
    segments[segments.length - 1].pts.push([points[i + 1].lat, points[i + 1].lng]);
  }

  /* Collect mid-route ignition-off stops that have already been passed */
  const passedStops = points
    .slice(0, stepIndex + 1)
    .filter((p, i) => i > 0 && i < points.length - 1 && ignitionState(p) === 'off');

  const startPos = allPos[0];
  const endPos   = allPos[allPos.length - 1];

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer center={fallback} zoom={12} style={{ width: '100%', height }} scrollWheelZoom>
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
        <FitRoute positions={allPos} />

        {/* Ghost — full route, very faint */}
        <Polyline
          positions={allPos}
          pathOptions={{ color: '#94a3b8', weight: 3, opacity: 0.18, dashArray: '9 7' }}
        />

        {/* Traveled segments — colored by ignition state, dotted */}
        {segments.map((seg, i) => (
          <Polyline
            key={i}
            positions={seg.pts}
            pathOptions={{
              color:     IGN_COLOR[seg.state],
              weight:    seg.state === 'on-moving' ? 5 : 4,
              opacity:   seg.state === 'off' ? 0.8 : 1,
              dashArray: SEG_DASH[seg.state],
            }}
          />
        ))}

        {/* Mid-route ignition-off stops */}
        {passedStops.map((p, i) => (
          <Marker key={`stop-${i}`} position={[p.lat, p.lng]} icon={stopIcon('#dc2626')}>
            <Tooltip direction="top" offset={[0, -8]} opacity={0.93}>
              <span style={{ fontFamily: 'system-ui', fontSize: 11 }}>🔴 Ignition OFF · {p.time}</span>
            </Tooltip>
          </Marker>
        ))}

        {/* Start */}
        {startPos && (
          <Marker position={startPos} icon={waypointIcon('#16a34a', 'ti-flag-2')}>
            <Tooltip permanent direction="top" offset={[0, -2]} opacity={0.92}>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 700 }}>Start</span>
            </Tooltip>
          </Marker>
        )}

        {/* End */}
        {endPos && (
          <Marker position={endPos} icon={waypointIcon('#64748b', 'ti-map-pin')}>
            <Tooltip permanent direction="top" offset={[0, -2]} opacity={0.92}>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 700 }}>End</span>
            </Tooltip>
          </Marker>
        )}

        {/* Current vehicle position */}
        {current && (
          <Marker position={[current.lat, current.lng]} icon={positionIcon(curState, category)}>
            <Tooltip direction="top" offset={[0, -4]} opacity={0.96}>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, minWidth: 110 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{current.time}</strong>
                  <span style={{ color: IGN_COLOR[curState], fontWeight: 700, fontSize: 9 }}>
                    {IGN_LABEL[curState]}
                  </span>
                </div>
                <div style={{ color: '#6b7280', marginTop: 1 }}>
                  {current.speed > 0 ? `${current.speed} km/h` : 'Stopped'}
                </div>
                {current.event && (
                  <div style={{ color: '#d97706', marginTop: 2, fontSize: 10 }}>⚠ {current.event}</div>
                )}
              </div>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

      {/* ── Legend overlay ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 400,
        background: 'rgba(255,255,255,0.96)', borderRadius: 8, border: '1px solid rgba(0,0,0,0.07)',
        padding: '8px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', gap: 5,
        fontSize: 10, fontFamily: 'system-ui', pointerEvents: 'none',
      }}>
        <div style={{ fontWeight: 700, fontSize: 9, letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', marginBottom: 1 }}>Track Legend</div>
        {([
          ['on-moving', 'Ignition ON · Moving'],
          ['on-idle',   'Ignition ON · Idle'],
          ['off',       'Ignition OFF'],
        ] as [IgnState, string][]).map(([state, lbl]) => (
          <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="26" height="6" viewBox="0 0 26 6" style={{ flexShrink: 0 }}>
              <line x1="0" y1="3" x2="26" y2="3"
                stroke={IGN_COLOR[state]}
                strokeWidth={state === 'on-moving' ? 3.5 : 3}
                strokeDasharray={SEG_DASH[state]}
              />
            </svg>
            <span style={{ color: '#1e293b' }}>{lbl}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 2, paddingTop: 4, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', flexShrink: 0 }} />
          <span style={{ color: '#1e293b' }}>Stop event</span>
        </div>
      </div>
    </div>
  );
}
