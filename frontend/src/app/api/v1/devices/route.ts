import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

function rowToDevice(r: Record<string, unknown>) {
  return {
    id:           r.ShortId,
    tenantId:     fromTenantUuid((r.TenantId as string)?.toLowerCase()) ?? r.TenantId,
    vehicleId:    r.VehicleShortId ?? '',
    vehiclePlate: r.VehiclePlate   ?? '',
    type:         r.Type,
    model:        r.Model,
    serialNo:     r.SerialNo       ?? '',
    imei:         r.Imei           ?? '',
    firmware:     r.Firmware       ?? '',
    signal:       r.Signal         ?? 'None',
    battery:      r.Battery ?? null,
    lastSeen:     r.LastSeen       ?? 'Never',
    status:       r.Status         ?? 'Offline',
    simId:        r.SimShortId     ?? null,
    installedAt:  r.InstalledAt ? String(r.InstalledAt).slice(0, 10) : '',
    notes:        r.Notes          ?? '',
  };
}

export async function GET(req: NextRequest) {
  const tenantId  = req.nextUrl.searchParams.get('tenantId');
  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  try {
    const db = getPool();
    const wheres: string[] = [];
    const params: unknown[] = [];

    if (tenantId) {
      const uuid = toTenantUuid(tenantId);
      if (uuid) { wheres.push(`"TenantId" = $${params.length + 1}`); params.push(uuid); }
    }
    if (vehicleId) {
      wheres.push(`"VehicleShortId" = $${params.length + 1}`);
      params.push(vehicleId);
    }

    let query = `SELECT * FROM "Devices"`;
    if (wheres.length) query += ` WHERE ${wheres.join(' AND ')}`;
    query += ` ORDER BY "VehicleShortId", "Type"`;

    const { rows } = await db.query(query, params);
    return NextResponse.json(rows.map(rowToDevice));
  } catch (err) {
    console.error('[devices] DB error', err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const {
    tenantId, vehicleId, vehiclePlate, type, model, serialNo, imei,
    firmware, signal, battery, status, simId, installedAt, notes,
  } = body;

  if (!tenantId) {
    return NextResponse.json({ message: 'tenantId is required' }, { status: 400 });
  }
  const tenantUuid = toTenantUuid(tenantId);
  if (!tenantUuid) return NextResponse.json({ message: 'Unknown tenantId' }, { status: 400 });

  const db      = getPool();
  const shortId = `d-${Date.now()}`;
  const today   = new Date().toISOString().slice(0, 10);

  try {
    await db.query(
      `INSERT INTO "Devices"
         ("Id","ShortId","TenantId","VehicleShortId","VehiclePlate",
          "Type","Model","SerialNo","Imei","Firmware",
          "Signal","Battery","LastSeen","Status","SimShortId","InstalledAt","Notes")
       VALUES
         (gen_random_uuid(),$1,$2,$3,$4,
          $5,$6,$7,$8,$9,
          $10,$11,'Never',$12,$13,$14,$15)`,
      [
        shortId, tenantUuid,
        vehicleId    ?? '',
        vehiclePlate ?? '',
        type         ?? 'GPS Tracker',
        model        ?? '',
        serialNo     ?? '',
        imei         ?? '',
        firmware     ?? '',
        signal       ?? 'None',
        battery !== undefined && battery !== '' ? Number(battery) : null,
        status       ?? 'Offline',
        simId        || null,
        installedAt  ?? today,
        notes        ?? '',
      ],
    );
    const { rows } = await db.query(`SELECT * FROM "Devices" WHERE "ShortId"=$1`, [shortId]);
    return NextResponse.json(rowToDevice(rows[0]), { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/devices]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Database error', detail: msg }, { status: 500 });
  }
}
