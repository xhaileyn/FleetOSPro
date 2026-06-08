import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT } from '@/lib/pgDb';

function rowToSchedule(r: Record<string, unknown>) {
  return {
    id:             r.ShortId,
    tenantId:       UUID_TENANT[(r.TenantId as string)?.toLowerCase()] ?? r.TenantId,
    vehicleShortId: r.VehicleShortId ?? '',
    vehiclePlate:   r.VehiclePlate   ?? '',
    vehicleMake:    r.VehicleMake    ?? '',
    serviceType:    r.ServiceType,
    lastDoneAt:     r.LastDoneAt  ? String(r.LastDoneAt).slice(0, 10)  : null,
    dueAt:          r.DueAt       ? String(r.DueAt).slice(0, 10)       : null,
    mileage:        r.Mileage     ?? '',
    status:         r.Status,
    priority:       r.Priority,
    notes:          r.Notes       ?? '',
    createdAt:      r.CreatedAt,
  };
}

/** GET /api/v1/maintenance?tenantId=1 */
export async function GET(req: NextRequest) {
  const tenantShort = req.nextUrl.searchParams.get('tenantId');
  const db = getPool();
  try {
    const { rows } = tenantShort && TENANT_UUID[tenantShort]
      ? await db.query(
          `SELECT * FROM "MaintenanceSchedules" WHERE "TenantId" = $1 ORDER BY "CreatedAt" DESC`,
          [TENANT_UUID[tenantShort]],
        )
      : await db.query(`SELECT * FROM "MaintenanceSchedules" ORDER BY "CreatedAt" DESC`);
    return NextResponse.json(rows.map(rowToSchedule));
  } catch (err) {
    console.error('[GET /api/v1/maintenance]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Database error', detail: msg }, { status: 500 });
  }
}

/** POST /api/v1/maintenance — create a new schedule entry */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const {
    tenantId, vehicleShortId, vehiclePlate, vehicleMake,
    serviceType, lastDoneAt, dueAt, mileage, status, priority, notes,
  } = body;

  if (!tenantId || !serviceType) {
    return NextResponse.json({ message: 'tenantId and serviceType required' }, { status: 400 });
  }
  const tenantUuid = TENANT_UUID[tenantId];
  if (!tenantUuid) {
    return NextResponse.json({ message: 'Unknown tenantId' }, { status: 400 });
  }

  const db = getPool();
  const shortId = `ms-${Date.now()}`;
  try {
    await db.query(
      `INSERT INTO "MaintenanceSchedules"
         ("Id","ShortId","TenantId","VehicleShortId","VehiclePlate","VehicleMake",
          "ServiceType","LastDoneAt","DueAt","Mileage","Status","Priority","Notes","CreatedAt")
       VALUES
         (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
      [
        shortId, tenantUuid,
        vehicleShortId ?? '', vehiclePlate ?? '', vehicleMake ?? '',
        serviceType.trim(),
        lastDoneAt || null, dueAt || null,
        mileage ?? '',
        status     ?? 'Scheduled',
        priority   ?? 'Medium',
        notes      ?? '',
      ],
    );
    const { rows } = await db.query(
      `SELECT * FROM "MaintenanceSchedules" WHERE "ShortId" = $1`, [shortId],
    );
    return NextResponse.json(rowToSchedule(rows[0]), { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/maintenance]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Database error', detail: msg }, { status: 500 });
  }
}
