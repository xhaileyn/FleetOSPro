import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

function rowToSub(r: Record<string, unknown>) {
  let smsNumbers: string[] = [];
  try { smsNumbers = JSON.parse(r.SmsNumbersJson as string || '[]'); } catch { /* keep empty */ }
  return {
    vehicleId:    r.VehicleShortId,
    tenantId:     fromTenantUuid((r.TenantId as string)?.toLowerCase()) ?? r.TenantId,
    plan:         r.Plan,
    customPlanId: r.CustomPlanId ?? undefined,
    startDate:    r.StartDate   ? String(r.StartDate).slice(0, 10)  : '',
    expiryDate:   r.ExpiryDate  ? String(r.ExpiryDate).slice(0, 10) : '',
    autoRenew:    r.AutoRenew,
    contactEmail: r.ContactEmail ?? undefined,
    smsNumbers:   smsNumbers.length ? smsNumbers : undefined,
  };
}

export async function GET(req: NextRequest) {
  const tenantId  = req.nextUrl.searchParams.get('tenantId');
  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  try {
    const db = getPool();
    let query = `SELECT * FROM "VehicleSubscriptions"`;
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

    const { rows } = await db.query(query, params);
    const subs = rows.map(rowToSub);

    // If requesting a single vehicle, return first match directly
    if (vehicleId) return NextResponse.json(subs[0] ?? null);
    return NextResponse.json(subs);
  } catch (err) {
    console.error('[subscriptions] DB error', err);
    return vehicleId
      ? NextResponse.json(null)
      : NextResponse.json([]);
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.vehicleId) return NextResponse.json({ message: 'vehicleId required' }, { status: 400 });
  try {
    const db = getPool();
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    const uuid = tenantId ? toTenantUuid(tenantId) : null;
    if (!uuid) return NextResponse.json({ message: 'invalid tenantId' }, { status: 400 });

    const smsJson = JSON.stringify(body.smsNumbers ?? []);
    await db.query(
      `INSERT INTO "VehicleSubscriptions" ("Id","VehicleShortId","TenantId","Plan","CustomPlanId","StartDate","ExpiryDate","AutoRenew","ContactEmail","SmsNumbersJson")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT ("TenantId","VehicleShortId") DO UPDATE SET
         "Plan"=$3, "CustomPlanId"=$4, "StartDate"=$5, "ExpiryDate"=$6,
         "AutoRenew"=$7, "ContactEmail"=$8, "SmsNumbersJson"=$9`,
      [body.vehicleId, uuid, body.plan, body.customPlanId ?? null,
       body.startDate, body.expiryDate, body.autoRenew ?? false, body.contactEmail ?? null, smsJson]
    );
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[subscriptions PUT] error', err);
    return NextResponse.json({ message: 'Failed to save subscription' }, { status: 500 });
  }
}
