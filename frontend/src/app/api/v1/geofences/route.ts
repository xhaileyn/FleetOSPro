import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

function rowToGeofence(r: Record<string, unknown>) {
  return {
    id:         (r.ShortId as string) || (r.Id as string),
    tenantId:   fromTenantUuid((r.TenantId as string)?.toLowerCase()) ?? r.TenantId,
    name:       r.Name       as string,
    type:       r.Type       as string,
    shape:      r.Shape      as 'circle' | 'polygon',
    lat:        Number(r.Lat),
    lng:        Number(r.Lng),
    radius:     Number(r.Radius),
    points:     (r.Points    as [number, number][] | null) ?? undefined,
    status:     r.Status     as 'Active' | 'Inactive',
    triggers:   (r.Triggers  as ('Entry' | 'Exit')[]) ?? [],
    inside:     Number(r.Inside) || 0,
    createdBy:  (r.CreatedBy as string | null) ?? null,
    visibility: (r.Visibility as string) ?? 'tenant',
    vehicleIds: (r.VehicleIds as string[]) ?? [],
    createdAt:  r.CreatedAt  as string,
    updatedAt:  r.UpdatedAt  as string,
  };
}

/* ── GET /api/v1/geofences
 *   ?tenantId=1        tenant-level filter (required for non-super-admin)
 *   &userId=xxx        user-level filter  (returns tenant-visible + own private zones)
 *   &vehicleId=xxx     vehicle-level filter (zones with empty VehicleIds OR contains vehicleId)
 */
export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams;
  const tenantShort = sp.get('tenantId');
  const userId      = sp.get('userId');
  const vehicleId   = sp.get('vehicleId');

  const db = getPool();
  const conditions: string[] = [];
  const params: unknown[]    = [];

  // Tenant isolation
  if (tenantShort) {
    const uuid = toTenantUuid(tenantShort);
    if (!uuid) return NextResponse.json({ message: 'Unknown tenantId' }, { status: 400 });
    params.push(uuid);
    conditions.push(`"TenantId" = $${params.length}`);
  }

  // User-level isolation: see tenant-wide zones OR own private zones
  if (userId) {
    params.push(userId);
    conditions.push(`("Visibility" = 'tenant' OR "CreatedBy" = $${params.length})`);
  }

  // Vehicle-level isolation: all-vehicle zones OR specifically includes this vehicle
  if (vehicleId) {
    params.push(JSON.stringify([vehicleId]));
    conditions.push(`("VehicleIds" = '[]'::jsonb OR "VehicleIds" @> $${params.length}::jsonb)`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await db.query(
      `SELECT * FROM "Geofences" ${where} ORDER BY "CreatedAt" DESC`,
      params,
    );
    return NextResponse.json(rows.map(rowToGeofence));
  } catch (err) {
    console.error('[GET /api/v1/geofences]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

/* ── POST /api/v1/geofences ── create a new geofence */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { name, type, shape, lat, lng, radius, points, status, triggers,
          tenantId, createdBy, visibility, vehicleIds } = body;

  if (!name || !tenantId) {
    return NextResponse.json({ message: 'name and tenantId are required' }, { status: 400 });
  }
  const tenantUuid = toTenantUuid(tenantId as string);
  if (!tenantUuid) return NextResponse.json({ message: 'Unknown tenantId' }, { status: 400 });

  const db      = getPool();
  const shortId = `gf-${Date.now()}`;

  try {
    await db.query(
      `INSERT INTO "Geofences"
         ("Id","ShortId","TenantId","Name","Type","Shape",
          "Lat","Lng","Radius","Points",
          "Status","Triggers","Inside",
          "CreatedBy","Visibility","VehicleIds",
          "CreatedAt","UpdatedAt")
       VALUES
         (gen_random_uuid(),$1,$2,$3,$4,$5,
          $6,$7,$8,$9,
          $10,$11,0,
          $12,$13,$14,
          NOW(),NOW())`,
      [
        shortId, tenantUuid,
        String(name), String(type ?? 'Home base'), String(shape ?? 'circle'),
        Number(lat) || 0, Number(lng) || 0, Number(radius) || 500,
        points ? JSON.stringify(points) : null,
        String(status ?? 'Active'),
        JSON.stringify(triggers ?? ['Entry', 'Exit']),
        (createdBy as string) ?? null,
        String(visibility ?? 'tenant'),
        JSON.stringify(vehicleIds ?? []),
      ],
    );
    const { rows } = await db.query(`SELECT * FROM "Geofences" WHERE "ShortId" = $1`, [shortId]);
    return NextResponse.json(rowToGeofence(rows[0]), { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/geofences]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
