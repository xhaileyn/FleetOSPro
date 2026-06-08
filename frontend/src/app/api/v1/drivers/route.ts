import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT } from '@/lib/pgDb';

/* ── Server-side owner→drivers map (vehicle_owner scoping) ───────────
   Since the DB Drivers table may not have an OwnerId column yet, we track
   ownership in memory. Persists for the life of the server process. */
const ownerDriverMap = new Map<string, Set<string>>(); // ownerId(email) → Set<shortId>

function addOwnerDriver(ownerId: string, shortId: string) {
  if (!ownerDriverMap.has(ownerId)) ownerDriverMap.set(ownerId, new Set());
  ownerDriverMap.get(ownerId)!.add(shortId);
}

function rowToDriver(d: Record<string, unknown>) {
  return {
    id:                   d.ShortId || d.Id,
    tenantId:             UUID_TENANT[(d.TenantId as string)?.toLowerCase()] ?? d.TenantId,
    name:                 d.Name,
    licenseNumber:        d.LicenseNumber        ?? '',
    licenseClass:         d.LicenseClass         ?? 'C',
    status:               d.Status               ?? 'off_duty',
    safetyScore:          Number(d.SafetyScore)  || 80,
    hosDriven:            Number(d.HosDriven)    || 0,
    hosRemaining:         Number(d.HosRemaining) || 11,
    assignedVehiclePlate: d.AssignedVehiclePlate ?? null,
    assignedVehicleId:    d.AssignedVehicleId    ?? null,
    phoneNumber:          d.PhoneNumber          ?? '',
    ownerId:              d.OwnerId              ?? null,
  };
}

export async function GET(req: NextRequest) {
  const tenantShort = req.nextUrl.searchParams.get('tenantId');
  const ownerId     = req.nextUrl.searchParams.get('ownerId');
  const db = getPool();
  try {
    const { rows } = tenantShort && TENANT_UUID[tenantShort]
      ? await db.query(`SELECT * FROM "Drivers" WHERE "TenantId" = $1 ORDER BY "Name"`, [TENANT_UUID[tenantShort]])
      : await db.query(`SELECT * FROM "Drivers" ORDER BY "Name"`);

    let drivers = rows.map(rowToDriver);

    /* Scope to owner-created drivers if ownerId is provided */
    if (ownerId) {
      const owned = ownerDriverMap.get(ownerId);
      if (owned && owned.size > 0) {
        drivers = drivers.filter(d => owned.has(d.id as string));
      } else {
        /* Owner has no drivers yet — also check rows that carry OwnerId in DB */
        drivers = drivers.filter(d => d.ownerId === ownerId);
      }
    }

    return NextResponse.json(drivers);
  } catch (err) {
    console.error('[GET /api/v1/drivers]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const { name, licenseNumber, licenseClass, phoneNumber, tenantId, ownerId } = body;
  if (!name || !tenantId) return NextResponse.json({ message: 'name and tenantId required' }, { status: 400 });

  const tenantUuid = TENANT_UUID[tenantId];
  if (!tenantUuid) return NextResponse.json({ message: 'Unknown tenantId' }, { status: 400 });

  const db = getPool();
  try {
    const shortId = `d-own-${Date.now()}`;

    /* Try inserting with OwnerId column; fall back if column doesn't exist */
    try {
      await db.query(
        `INSERT INTO "Drivers" ("Id","ShortId","TenantId","Name","LicenseNumber","LicenseClass","PhoneNumber","Status","SafetyScore","HosDriven","HosRemaining","OwnerId","CreatedAt")
         VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,'off_duty',80,0,11,$7,NOW())`,
        [shortId, tenantUuid, name, licenseNumber ?? '', licenseClass ?? 'C', phoneNumber ?? '', ownerId ?? null],
      );
    } catch {
      /* OwnerId column may not exist yet — insert without it */
      await db.query(
        `INSERT INTO "Drivers" ("Id","ShortId","TenantId","Name","LicenseNumber","LicenseClass","PhoneNumber","Status","SafetyScore","HosDriven","HosRemaining","CreatedAt")
         VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,'off_duty',80,0,11,NOW())`,
        [shortId, tenantUuid, name, licenseNumber ?? '', licenseClass ?? 'C', phoneNumber ?? ''],
      );
    }

    /* Track ownership in memory regardless of DB column */
    if (ownerId) addOwnerDriver(ownerId, shortId);

    const { rows } = await db.query(`SELECT * FROM "Drivers" WHERE "ShortId"=$1`, [shortId]);
    const driver = rowToDriver(rows[0]);
    /* Attach ownerId to the returned record so the client can filter */
    return NextResponse.json({ ...driver, ownerId: ownerId ?? null }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/drivers]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
