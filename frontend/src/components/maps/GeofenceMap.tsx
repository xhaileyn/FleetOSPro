'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MapContainer, TileLayer, Circle, Polygon,
  Popup, CircleMarker, Polyline, useMap,
} from 'react-leaflet';
import { useMapEvents } from 'react-leaflet/hooks';

/* Re-center the map whenever center/zoom changes after initial mount */
function MapCenterSetter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [map, center[0], center[1], zoom]);
  return null;
}

export interface GeoZone {
  id:       string;
  name:     string;
  type:     string;
  shape:    'circle' | 'polygon';
  // circle fields
  lat:      number;
  lng:      number;
  radius:   number;
  // polygon fields
  points?:  [number, number][];
  status:   'Active' | 'Inactive';
  inside:   number;
  triggers: ('Entry' | 'Exit')[];
}

const ZONE_COLOR: Record<string, string> = {
  'Home base': '#c4912a',
  Depot:       '#c4912a',
  Restricted:  '#dc2626',
  Airport:     '#2563eb',
  Customer:    '#7c3aed',
};

const TILE_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/* ─── Drawing event handler ─────────────────────────────────────────── */
interface DrawHandlerProps {
  drawMode:       'circle' | 'polygon' | null;
  circleCenter:   [number, number] | null;
  polygonPoints:  [number, number][];
  mousePos:       [number, number] | null;
  onMapClick:     (lat: number, lng: number) => void;
  onMapDblClick:  () => void;
  onMouseMove:    (lat: number, lng: number) => void;
}

function DrawHandler({
  drawMode, onMapClick, onMapDblClick, onMouseMove,
}: DrawHandlerProps) {
  useMapEvents({
    click(e) {
      if (!drawMode) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    dblclick(e) {
      if (drawMode === 'polygon') {
        e.originalEvent.preventDefault();
        onMapDblClick();
      }
    },
    mousemove(e) {
      if (drawMode) onMouseMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* ─── Props ─────────────────────────────────────────────────────────── */
export interface DrawingState {
  mode:          'circle' | 'polygon' | null;
  circleCenter:  [number, number] | null;
  circleRadius:  number;
  polygonPoints: [number, number][];
}

interface Props {
  zones:       GeoZone[];
  height?:     number | string;
  center?:     [number, number];
  zoom?:       number;
  drawingState?: DrawingState;
  onCircleCenterSet?: (lat: number, lng: number) => void;
  onPolygonPoint?:    (lat: number, lng: number) => void;
  onPolygonClose?:    () => void;
}

export function GeofenceMap({
  zones,
  height = 460,
  center = [-1.2921, 36.8600],
  zoom   = 11,
  drawingState,
  onCircleCenterSet,
  onPolygonPoint,
  onPolygonClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  useEffect(() => { setMounted(true); }, []);

  const handleClick = useCallback((lat: number, lng: number) => {
    if (!drawingState) return;
    if (drawingState.mode === 'circle') onCircleCenterSet?.(lat, lng);
    if (drawingState.mode === 'polygon') onPolygonPoint?.(lat, lng);
  }, [drawingState, onCircleCenterSet, onPolygonPoint]);

  const handleDblClick = useCallback(() => {
    onPolygonClose?.();
  }, [onPolygonClose]);

  if (!mounted) return (
    <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--cream)', color:'var(--ink3)', fontSize:13 }}>
      Loading map…
    </div>
  );

  const drawing = drawingState;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width:'100%', height }}
      scrollWheelZoom
      doubleClickZoom={drawing?.mode === 'polygon' ? false : true}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <MapCenterSetter center={center} zoom={zoom} />

      <DrawHandler
        drawMode={drawing?.mode ?? null}
        circleCenter={drawing?.circleCenter ?? null}
        polygonPoints={drawing?.polygonPoints ?? []}
        mousePos={mousePos}
        onMapClick={handleClick}
        onMapDblClick={handleDblClick}
        onMouseMove={(lat, lng) => setMousePos([lat, lng])}
      />

      {/* Existing zones */}
      {zones.map(z => {
        const color = z.status === 'Inactive' ? '#9ca3af' : (ZONE_COLOR[z.type] ?? '#6b7280');
        const popupContent = (
          <div style={{ minWidth:150, fontFamily:'system-ui, sans-serif' }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{z.name}</div>
            {([
              ['Type',   z.type],
              ['Shape',  z.shape === 'polygon' ? 'Polygon' : 'Circle'],
              ['Inside', `${z.inside} vehicle${z.inside !== 1 ? 's' : ''}`],
              ['Status', z.status],
            ] as [string,string][]).map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid #eee' }}>
                <span style={{ color:'#999' }}>{l}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        );

        if (z.shape === 'polygon' && z.points && z.points.length >= 3) {
          return (
            <Polygon
              key={z.id}
              positions={z.points}
              pathOptions={{ color, weight:2, opacity:0.9, fillColor:color, fillOpacity:0.15 }}
            >
              <Popup>{popupContent}</Popup>
            </Polygon>
          );
        }

        return (
          <Circle
            key={z.id}
            center={[z.lat, z.lng]}
            radius={z.radius}
            pathOptions={{ color, weight:2, opacity:0.9, fillColor:color, fillOpacity:0.15 }}
          >
            <Popup>{popupContent}</Popup>
          </Circle>
        );
      })}

      {/* Drawing previews */}
      {drawing?.mode === 'circle' && drawing.circleCenter && (
        <>
          <Circle
            center={drawing.circleCenter}
            radius={drawing.circleRadius || 300}
            pathOptions={{ color:'#c4912a', weight:2, dashArray:'6 4', fillColor:'#c4912a', fillOpacity:0.1 }}
          />
          <CircleMarker
            center={drawing.circleCenter}
            radius={6}
            pathOptions={{ color:'#c4912a', fillColor:'#c4912a', fillOpacity:1 }}
          />
        </>
      )}

      {drawing?.mode === 'polygon' && drawing.polygonPoints.length > 0 && (
        <>
          {/* Lines between points */}
          <Polyline
            positions={[...drawing.polygonPoints, ...(mousePos ? [mousePos] : [])]}
            pathOptions={{ color:'#c4912a', weight:2, dashArray:'6 4' }}
          />
          {/* Filled preview polygon (once 3+ points) */}
          {drawing.polygonPoints.length >= 3 && (
            <Polygon
              positions={drawing.polygonPoints}
              pathOptions={{ color:'#c4912a', weight:2, dashArray:'6 4', fillColor:'#c4912a', fillOpacity:0.1 }}
            />
          )}
          {/* Vertex markers */}
          {drawing.polygonPoints.map((pt, i) => (
            <CircleMarker
              key={i}
              center={pt}
              radius={i === 0 ? 8 : 5}
              pathOptions={{ color:'#c4912a', fillColor: i === 0 ? '#fff' : '#c4912a', fillOpacity:1, weight:2 }}
            />
          ))}
        </>
      )}
    </MapContainer>
  );
}
