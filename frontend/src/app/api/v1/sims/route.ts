import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

function rowToSim(r: Record<string, unknown>) {
  return {
    id:           r.ShortId,
    tenantId:     fromTenantUuid((r.TenantId as string)?.toLowerCase()) ?? r.TenantId,
    vehicleId:    r.VehicleShortId,
    vehiclePlate: r.VehiclePlate,
    iccid:        r.Iccid,
    msisdn:       r.Msisdn,
    operator:     r.Operator,
    country:      r.Country,
    type:         r.Type,
    status:       r.Status,
    dataUsedMB:   r.DataUsedMb,
    dataPlanMB:   r.DataPlanMb,
    apn:          r.Apn,
    activatedAt:  r.ActivatedAt ? String(r.ActivatedAt).slice(0, 10) : '',
    expiresAt:    r.ExpiresAt   ? String(r.ExpiresAt).slice(0, 10)   : '',
    notes:        r.Notes ?? '',
  };
}

export async function GET(req: NextRequest) {
  const tenantId  = req.nextUrl.searchParams.get('tenantId');
  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  try {
    const db = getPool();
    let query = `SELECT * FROM "SimCards"`;
    const params: unknown[] = [];
    const wheres: string[] = [];

    if (tenantId) {
      const uuid = toTenantUuid(tenantId);
      if (uuid) { wheres.push(`"TenantId" = $${params.length + 1}`); params.push(uuid); }
    }
    if (vehicleId) {
      wheres.push(`"VehicleShortId" = $${params.length + 1}`);
      params.push(vehicleId);
    }
    if (wheres.length) query += ` WHERE ${wheres.join(' AND ')}`;
    query += ` ORDER BY "VehicleShortId", "Type"`;

    const { rows } = await db.query(query, params);
    return NextResponse.json(rows.map(rowToSim));
  } catch (err) {
    console.error('[sims] DB error', err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string | number>;
  const {
    tenantId, vehicleId, vehiclePlate,
    iccid, msisdn, operator, country, type, apn,
    dataPlanMB, expiresAt, notes,
  } = body as Record<string, string>;

  if (!tenantId || !iccid) {
    return NextResponse.json({ message: 'tenantId and iccid are required' }, { status: 400 });
  }

  const tenantUuid = toTenantUuid(tenantId);
  if (!tenantUuid) return NextResponse.json({ message: 'Unknown tenantId' }, { status: 400 });

  const db      = getPool();
  const shortId = `s-${Date.now()}`;
  const today   = new Date().toISOString().slice(0, 10);
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);

  try {
    await db.query(
      `INSERT INTO "SimCards"
         ("Id","ShortId","TenantId","VehicleShortId","VehiclePlate",
          "Iccid","Msisdn","Operator","Country","Type","Status",
          "DataUsedMb","DataPlanMb","Apn","ActivatedAt","ExpiresAt","Notes")
       VALUES
         (gen_random_uuid(),$1,$2,$3,$4,
          $5,$6,$7,$8,$9,'Active',
          0,$10,$11,$12,$13,$14)`,
      [
        shortId, tenantUuid, vehicleId, vehiclePlate ?? '',
        iccid.trim(),
        msisdn   ?? '',
        operator ?? 'AT&T',
        country  ?? 'United States',
        type     ?? 'Primary',
        parseInt(String(dataPlanMB)) || 10240,
        apn      ?? 'internet',
        today,
        expiresAt ?? oneYear.toISOString().slice(0, 10),
        notes    ?? '',
      ],
    );
    const { rows } = await db.query(`SELECT * FROM "SimCards" WHERE "ShortId"=$1`, [shortId]);
    return NextResponse.json(rowToSim(rows[0]), { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/sims]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
