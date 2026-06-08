'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';

export interface TrackPing {
  ts:       string;
  lat:      number;
  lng:      number;
  speed:    number;
  heading:  string;
  fuel:     number;
  engine:   boolean;
  event:    string;
  eventSev: string;
  address:  string;
}

interface Props {
  pings:   TrackPing[];
  accent:  string;
  height?: number;
}

const TILE_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const key = positions.length > 0
    ? `${positions[0][0]},${positions[0][1]},${positions[positions.length - 1][0]},${positions[positions.length - 1][1]}`
    : '';
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [50, 50], animate: true, duration: 0.8 });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14, { animate: true, duration: 0.6 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

function speedBand(s: number): 'stopped' | 'normal' | 'brisk' | 'speeding' {
  if (s === 0) return 'stopped';
  if (s <= 60)  return 'normal';
  if (s <= 90)  return 'brisk';
  return 'speeding';
}

export function TrackJourneyMap({ pings, accent, height = 440 }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)', color: 'var(--ink3)', fontSize: 13, borderRadius: 8 }}>
      Loading map…
    </div>
  );
  if (pings.length === 0) return null;

  const BAND: Record<string, string> = {
    stopped:  '#9ca3af',
    normal:   accent,
    brisk:    '#f59e0b',
    speeding: '#ef4444',
  };

  /* Build contiguous colour runs so the polyline transitions smoothly */
  const runs: { color: string; coords: [number, number][] }[] = [];
  for (let i = 0; i < pings.length; i++) {
    const color: string = BAND[speedBand(pings[i].speed)];
    const coord: [number, number] = [pings[i].lat, pings[i].lng];
    if (!runs.length || runs[runs.length - 1].color !== color) {
      if (runs.length) runs[runs.length - 1].coords.push(coord); // share junction point
      runs.push({ color, coords: [coord] });
    } else {
      runs[runs.length - 1].coords.push(coord);
    }
  }

  const allPos    = pings.map(p => [p.lat, p.lng] as [number, number]);
  const evPings   = pings.filter(p => p.event !== '—');
  const evFill: Record<string, string> = { warning: '#f59e0b', critical: '#ef4444', info: accent };
  const mapCenter = allPos[Math.floor(allPos.length / 2)] ?? ([-1.2921, 36.8219] as [number, number]);

  return (
    <MapContainer center={mapCenter} zoom={12} style={{ width: '100%', height }} scrollWheelZoom>
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <FitRoute positions={allPos} />

      {/* Ghost full-route outline */}
      <Polyline positions={allPos}
        pathOptions={{ color: '#e5e7eb', weight: 8, opacity: 0.55 }} />

      {/* Speed-coloured segments */}
      {runs.map((run, i) =>
        run.coords.length > 1 && (
          <Polyline key={i} positions={run.coords}
            pathOptions={{ color: run.color, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />
        ),
      )}

      {/* Idle / engine-off pings (small grey dots) */}
      {pings
        .filter(p => !p.engine)
        .map((p, i) => (
          <CircleMarker key={`stop-${i}`} center={[p.lat, p.lng]} radius={4}
            pathOptions={{ color: '#6b7280', weight: 1.5, fillColor: '#d1d5db', fillOpacity: 0.9 }}>
            <Tooltip direction="top" offset={[0, -6]} opacity={0.92}>
              <strong>Engine off</strong><br />{p.ts}<br />{p.address}
            </Tooltip>
          </CircleMarker>
        ))
      }

      {/* Event markers — speeding, hard brake, geofence, etc. */}
      {evPings.map((p, i) => (
        <CircleMarker key={`ev-${i}`} center={[p.lat, p.lng]} radius={7}
          pathOptions={{ color: '#fff', weight: 2.5, fillColor: evFill[p.eventSev] ?? '#9ca3af', fillOpacity: 1 }}>
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
            <div><strong>{p.event}</strong></div>
            <div>{p.ts}</div>
            <div>{p.speed} km/h · {p.address}</div>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* ── Start marker ── */}
      <CircleMarker center={allPos[0]} radius={11}
        pathOptions={{ color: '#fff', weight: 3, fillColor: '#16a34a', fillOpacity: 1 }}>
        <Tooltip permanent direction="top" offset={[0, -14]} opacity={0.95}>
          <div><strong>▶ Journey Start</strong></div>
          <div style={{ fontSize: 11 }}>{pings[0].ts}</div>
          <div style={{ fontSize: 11 }}>{pings[0].address}</div>
        </Tooltip>
      </CircleMarker>

      {/* ── End marker ── */}
      <CircleMarker center={allPos[allPos.length - 1]} radius={11}
        pathOptions={{ color: '#fff', weight: 3, fillColor: '#dc2626', fillOpacity: 1 }}>
        <Tooltip permanent direction="top" offset={[0, -14]} opacity={0.95}>
          <div><strong>⏹ Journey End</strong></div>
          <div style={{ fontSize: 11 }}>{pings[pings.length - 1].ts}</div>
          <div style={{ fontSize: 11 }}>{pings[pings.length - 1].address}</div>
        </Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
