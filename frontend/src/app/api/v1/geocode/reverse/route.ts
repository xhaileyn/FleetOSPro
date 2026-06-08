import { NextRequest, NextResponse } from 'next/server';

/* Server-side Nominatim proxy — sets proper User-Agent, deduplicates in-flight requests */
const _cache: Map<string, string> = new Map();
const _inflight: Map<string, Promise<string>> = new Map();

async function resolve(lat: string, lng: string): Promise<string> {
  const key = `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)}`;
  if (_cache.has(key)) return _cache.get(key)!;
  if (_inflight.has(key)) return _inflight.get(key)!;

  const p = (async () => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&accept-language=en`,
        { headers: { 'User-Agent': 'FleetOS/1.0 fleet-management-demo' } },
      );
      const d = await res.json();
      const a = d.address ?? {};
      const label: string =
        a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district ??
        a.village ?? a.road ?? a.town ?? a.city ?? a.county ?? '';
      _cache.set(key, label);
      return label;
    } catch {
      _cache.set(key, '');
      return '';
    } finally {
      _inflight.delete(key);
    }
  })();

  _inflight.set(key, p);
  return p;
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  if (!lat || !lng) return NextResponse.json({ label: '' });
  const label = await resolve(lat, lng);
  return NextResponse.json({ label }, {
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
