import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT } from '@/lib/pgDb';

function rowToPlan(r: Record<string, unknown>) {
  let services: string[] = [];
  let limits: Record<string, unknown> = {};
  try { services = JSON.parse(r.ServicesJson as string || '[]'); } catch { /* keep empty */ }
  try { limits   = JSON.parse(r.LimitsJson   as string || '{}'); } catch { /* keep empty */ }
  return {
    id:           r.ShortId,
    tenantId:     UUID_TENANT[(r.TenantId as string)?.toLowerCase()] ?? r.TenantId,
    name:         r.Name,
    tagline:      r.Tagline,
    price:        Number(r.Price),
    color:        r.Color,
    highlight:    r.Highlight,
    services,
    limits,
    status:       r.Status,
    isDefault:    r.IsDefault,
    vehicleCount: r.VehicleCount,
    createdAt:    r.CreatedAt ? String(r.CreatedAt).slice(0, 10) : '',
    updatedAt:    r.UpdatedAt ? String(r.UpdatedAt).slice(0, 10) : '',
  };
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  try {
    const db = getPool();
    let query = `SELECT * FROM "CustomPlans"`;
    const params: unknown[] = [];

    if (tenantId) {
      const uuid = TENANT_UUID[tenantId];
      if (uuid) { query += ` WHERE "TenantId" = $1`; params.push(uuid); }
    }
    query += ` ORDER BY "CreatedAt"`;

    const { rows } = await db.query(query, params);
    return NextResponse.json(rows.map(rowToPlan));
  } catch (err) {
    console.error('[custom-plans] DB error', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'invalid body' }, { status: 400 });
  try {
    const db = getPool();
    const tenantId = body.tenantId;
    const uuid = TENANT_UUID[tenantId];
    if (!uuid) return NextResponse.json({ message: 'invalid tenantId' }, { status: 400 });

    const shortId = body.id ?? `cp-${Date.now().toString(36)}`;
    await db.query(
      `INSERT INTO "CustomPlans" ("Id","ShortId","TenantId","Name","Tagline","Price","Color","Highlight","ServicesJson","LimitsJson","Status","IsDefault","VehicleCount","CreatedAt","UpdatedAt")
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())`,
      [shortId, uuid, body.name, body.tagline ?? '', body.price ?? 0, body.color ?? '#6b7280', body.highlight ?? false,
       JSON.stringify(body.services ?? []), JSON.stringify(body.limits ?? {}), body.status ?? 'active',
       body.isDefault ?? false, body.vehicleCount ?? 0]
    );
    return NextResponse.json({ id: shortId }, { status: 201 });
  } catch (err) {
    console.error('[custom-plans POST] error', err);
    return NextResponse.json({ message: 'Failed to create plan' }, { status: 500 });
  }
}
