import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT } from '@/lib/pgDb';

function rowToTrip(r: Record<string, unknown>) {
  let route: unknown[] = [];
  try { route = JSON.parse(r.RouteJson as string || '[]'); } catch { /* keep empty */ }
  return {
    id:          r.ShortId,
    tenantId:    UUID_TENANT[(r.TenantId as string)?.toLowerCase()] ?? r.TenantId,
    vehicleId:   r.VehicleShortId,
    date:        r.Date,
    dateISO:     r.DateIso,
    from:        r.From,
    to:          r.To,
    distanceKm:  r.DistanceKm,
    durationMin: r.DurationMin,
    avgSpeed:    r.AvgSpeed,
    maxSpeed:    r.MaxSpeed,
    fuelUsedL:   r.FuelUsedL,
    status:      r.Status,
    route,
  };
}

export async function GET(req: NextRequest) {
  const tenantId  = req.nextUrl.searchParams.get('tenantId');
  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  const tripId    = req.nextUrl.searchParams.get('id');
  try {
    const db = getPool();
    let query = `SELECT * FROM "Trips"`;
    const params: unknown[] = [];
    const wheres: string[] = [];

    if (tenantId) {
      const uuid = TENANT_UUID[tenantId];
      if (uuid) { wheres.push(`"TenantId" = $${params.length + 1}`); params.push(uuid); }
    }
    if (vehicleId) {
      wheres.push(`"VehicleShortId" = $${params.length + 1}`);
      params.push(vehicleId);
    }
    if (tripId) {
      wheres.push(`"ShortId" = $${params.length + 1}`);
      params.push(tripId);
    }
    if (wheres.length) query += ` WHERE ${wheres.join(' AND ')}`;
    query += ` ORDER BY "DateIso" DESC, "Date" DESC`;

    const { rows } = await db.query(query, params);
    return NextResponse.json(rows.map(rowToTrip));
  } catch (err) {
    console.error('[trips] DB error', err);
    return NextResponse.json([], { status: 200 });
  }
}
