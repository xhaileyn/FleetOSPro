import { NextRequest, NextResponse } from 'next/server';

export interface RouteStep {
  instruction: string;
  distance:    number;
  duration:    number;
  name:        string;
  type:        number;
}

export interface RouteOptResult {
  distanceKm:  number;
  durationMin: number;
  geometry:    [number, number][];   // [lat, lng] pairs for Leaflet Polyline
  steps:       RouteStep[];
  index:       number;               // 0 = main route, 1+ = alternatives
}

export interface RouteOptResponse {
  routes:   RouteOptResult[];
  selected: number;                  // currently recommended route index
}

export async function GET(req: NextRequest) {
  const sp    = req.nextUrl.searchParams;
  const waypoints = sp.get('waypoints');   // "lat1,lng1;lat2,lng2;..."
  const profile   = sp.get('profile') ?? 'driving';  // driving | driving-hgv

  if (!waypoints) return NextResponse.json({ error: 'waypoints required' }, { status: 400 });

  const coords = waypoints
    .split(';')
    .map(p => {
      const [lat, lng] = p.split(',').map(Number);
      return { lat, lng };
    })
    .filter(p => !isNaN(p.lat) && !isNaN(p.lng));

  if (coords.length < 2) return NextResponse.json({ error: 'need at least 2 waypoints' }, { status: 400 });

  const coordStr = coords.map(p => `${p.lng},${p.lat}`).join(';');
  const osrmProfile = profile === 'driving-hgv' ? 'driving' : profile;
  const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coordStr}?overview=full&geometries=geojson&steps=true&annotations=false&alternatives=3`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FleetOS/1.0 fleet-management-demo' },
      signal:  AbortSignal.timeout(15_000),
    });
    if (!res.ok) return NextResponse.json({ error: 'Routing service unavailable' }, { status: 502 });

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      return NextResponse.json({ error: 'No route found' }, { status: 404 });
    }

    type OsrmStep = {
      maneuver?: { type?: string; modifier?: string };
      name?: string;
      distance?: number;
      duration?: number;
    };
    type OsrmRoute = {
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: [number, number][] };
      legs?: Array<{ steps?: OsrmStep[] }>;
    };

    const routes: RouteOptResult[] = (data.routes as OsrmRoute[]).map((route, idx) => {
      const leg0 = route.legs?.[0];
      const geometry: [number, number][] = (route.geometry?.coordinates ?? []).map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
      );
      const steps: RouteStep[] = (leg0?.steps ?? []).map((s: OsrmStep) => ({
        instruction: buildInstruction(s.maneuver?.type, s.maneuver?.modifier, s.name ?? ''),
        distance:    Math.round(s.distance ?? 0),
        duration:    Math.round(s.duration ?? 0),
        name:        s.name ?? '',
        type:        typeof s.maneuver?.type === 'number' ? s.maneuver.type : 0,
      }));
      return {
        distanceKm:  Math.round((route.distance ?? 0) / 100) / 10,
        durationMin: Math.round((route.duration ?? 0) / 60),
        geometry,
        steps,
        index: idx,
      };
    });

    const response: RouteOptResponse = { routes, selected: 0 };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err) {
    console.error('[route-optimize]', err);
    return NextResponse.json({ error: 'Routing service error' }, { status: 502 });
  }
}

type ManeuverType = string | number | undefined;

function buildInstruction(type: ManeuverType, modifier: string | undefined, name: string): string {
  const road = name ? ` onto ${name}` : '';
  const mod  = modifier ? ` ${modifier}` : '';
  switch (String(type)) {
    case 'depart':        return `Start${road}`;
    case 'arrive':        return `Arrive at destination`;
    case 'turn':          return `Turn${mod}${road}`;
    case 'new name':      return `Continue${road}`;
    case 'merge':         return `Merge${mod}${road}`;
    case 'on ramp':       return `Take ramp${mod}${road}`;
    case 'off ramp':      return `Take exit${mod}${road}`;
    case 'fork':          return `Keep${mod} at fork${road}`;
    case 'end of road':   return `Turn${mod} at end of road${road}`;
    case 'roundabout':    return `Enter roundabout${road}`;
    case 'rotary':        return `Enter rotary${road}`;
    case 'roundabout turn': return `Continue in roundabout${road}`;
    case 'notification':  return `Note${road}`;
    default:              return `Continue${road}`;
  }
}
