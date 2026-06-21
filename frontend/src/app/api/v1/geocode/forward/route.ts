import { NextRequest, NextResponse } from 'next/server';

export interface GeocodeSuggestion {
  label:       string;
  lat:         number;
  lng:         number;
  displayName: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 2) return NextResponse.json([]);

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FleetOS/1.0 fleet-management-demo' },
    });
    if (!res.ok) return NextResponse.json([]);
    const data: Array<{
      lat: string; lon: string; display_name: string;
      address?: { road?: string; city?: string; state?: string; country?: string; suburb?: string; town?: string; village?: string; county?: string };
    }> = await res.json();

    const suggestions: GeocodeSuggestion[] = data.map(r => {
      const a = r.address ?? {};
      const parts = [
        a.road ?? a.suburb ?? '',
        a.city ?? a.town ?? a.village ?? a.county ?? '',
        a.state ?? '',
        a.country ?? '',
      ].filter(Boolean);
      return {
        label:       parts.slice(0, 3).join(', ') || r.display_name.split(',').slice(0, 2).join(', '),
        lat:         parseFloat(r.lat),
        lng:         parseFloat(r.lon),
        displayName: r.display_name,
      };
    });

    return NextResponse.json(suggestions, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return NextResponse.json([]);
  }
}
