import { NextRequest, NextResponse } from 'next/server';
import { getPool, UUID_TENANT } from '@/lib/pgDb';

function rowToGeofence(r: Record<string, unknown>) {
  return {
    id:         (r.ShortId as string) || (r.Id as string),
    tenantId:   UUID_TENANT[(r.TenantId as string)?.toLowerCase()] ?? r.TenantId,
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

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getPool();
    const { rows } = await db.query(
      `SELECT * FROM "Geofences" WHERE "ShortId" = $1 OR "Id"::text = $1 LIMIT 1`,
      [id],
    );
    if (!rows[0]) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
    return NextResponse.json(rowToGeofence(rows[0]));
  } catch (err) {
    console.error('[geofences/[id] GET]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const db = getPool();

  const bodyMap: Record<string, string> = {
    name:       'Name',
    type:       'Type',
    shape:      'Shape',
    lat:        'Lat',
    lng:        'Lng',
    radius:     'Radius',
    points:     'Points',
    status:     'Status',
    triggers:   'Triggers',
    inside:     'Inside',
    visibility: 'Visibility',
    vehicleIds: 'VehicleIds',
    createdBy:  'CreatedBy',
  };

  const jsonCols = new Set(['Points', 'Triggers', 'VehicleIds']);

  try {
    const sets: string[] = [];
    const vals: unknown[] = [];

    for (const [key, col] of Object.entries(bodyMap)) {
      if (body[key] !== undefined) {
        sets.push(`"${col}" = $${vals.length + 1}`);
        vals.push(jsonCols.has(col) ? JSON.stringify(body[key]) : body[key]);
      }
    }
    if (!sets.length) return new NextResponse(null, { status: 204 });

    sets.push(`"UpdatedAt" = NOW()`);
    vals.push(id);

    await db.query(
      `UPDATE "Geofences" SET ${sets.join(', ')} WHERE "ShortId" = $${vals.length} OR "Id"::text = $${vals.length}`,
      vals,
    );
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[geofences/[id] PUT]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getPool();
    const { rowCount } = await db.query(
      `DELETE FROM "Geofences" WHERE "ShortId" = $1 OR "Id"::text = $1`,
      [id],
    );
    return (rowCount ?? 0) > 0
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ message: 'Not found.' }, { status: 404 });
  } catch (err) {
    console.error('[geofences/[id] DELETE]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
