'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  lat:        number;
  lng:        number;
  hasGps?:    boolean;   // false = no real fix, just show country map without marker
  plate:      string;
  speed:      number;
  status?:    string;
  category?:  string;
  onPinClick?: () => void;
}

const TILE_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const MARKER_BG: Record<string, string> = {
  active:      '#16a34a',
  idle:        '#d97706',
  offline:     '#64748b',
  maintenance: '#2563eb',
};

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
let _L: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getL(): any {
  if (!_L && typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _L = require('leaflet');
  }
  return _L;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildIcon(status: string, category: string): any {
  const L = getL();
  if (!L) return undefined;
  const bg = MARKER_BG[status] ?? '#64748b';
  const ti = CATEGORY_TI[category] ?? 'ti-car';
  const sz = 40;
  const html =
    `<div style="display:flex;flex-direction:column;align-items:center;width:${sz}px;">` +
      `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${bg};` +
        `border:3px solid rgba(255,255,255,0.95);` +
        `box-shadow:0 0 0 4px rgba(196,145,42,0.30),0 4px 14px rgba(0,0,0,0.50);` +
        `display:flex;align-items:center;justify-content:center;">` +
        `<i class="ti ${ti}" style="font-size:20px;color:#fff;line-height:1;"></i>` +
      `</div>` +
      `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${bg};"></div>` +
    `</div>`;
  return L.divIcon({ html, className: '', iconSize: [sz, sz + 8], iconAnchor: [sz / 2, sz + 8], popupAnchor: [0, -(sz + 10)] });
}

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 0.7 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

export default function VehicleMap({ lat, lng, hasGps = true, plate, speed, status = 'active', category = 'Car', onPinClick }: Props) {
  const icon = buildIcon(status, category);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={hasGps ? 13 : 6}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
        <MapFlyTo lat={lat} lng={lng} />

        {hasGps && icon && (
          <Marker
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{ click: () => onPinClick?.() }}
          >
            <Popup>
              <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{plate}</div>
                <div style={{ fontSize: 12, color: '#666' }}>Speed: <strong>{speed} km/h</strong></div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{lat.toFixed(5)}, {lng.toFixed(5)}</div>
                {onPinClick && (
                  <button
                    onClick={onPinClick}
                    style={{ marginTop: 8, width: '100%', padding: '5px 0', fontSize: 11, fontWeight: 600, borderRadius: 5, border: 'none', background: '#c4912a', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    ▶ Live tracking
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Overlay when no GPS fix */}
      {!hasGps && (
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '5px 12px',
          fontSize: 11, color: 'var(--ink3)', fontWeight: 600, zIndex: 999,
          display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
        }}>
          <i className="ti ti-map-pin-off" style={{ fontSize: 12 }} /> No GPS signal — showing country map
        </div>
      )}
    </div>
  );
}
