import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

export async function GET(req: NextRequest) {
  const tenantId  = req.nextUrl.searchParams.get('tenantId');
  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  const action    = req.nextUrl.searchParams.get('action');   // comma-separated
  const actor     = req.nextUrl.searchParams.get('actor');
  const limit     = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '200'), 500);

  try {
    const db = getPool();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (vehicleId) {
      conditions.push(`"Resource" = 'Vehicle'`);
      conditions.push(`"ResourceId" = $${params.length + 1}`);
      params.push(vehicleId);
    }
    if (tenantId) {
      const uuid = toTenantUuid(tenantId);
      if (uuid) {
        conditions.push(`"TenantId" = $${params.length + 1}`);
        params.push(uuid);
      }
    }
    if (action) {
      const actions = action.split(',').map(a => a.trim()).filter(Boolean);
      if (actions.length === 1) {
        conditions.push(`"Action" = $${params.length + 1}`);
        params.push(actions[0]);
      } else if (actions.length > 1) {
        const placeholders = actions.map((_, i) => `$${params.length + i + 1}`).join(',');
        conditions.push(`"Action" IN (${placeholders})`);
        params.push(...actions);
      }
    }
    if (actor) {
      conditions.push(`LOWER("Actor") = LOWER($${params.length + 1})`);
      params.push(actor);
    }

    let query = `SELECT * FROM "AuditEvents"`;
    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY "Timestamp" DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const { rows } = await db.query(query, params);
    return NextResponse.json(rows.map(r => ({
      id:                  r.ShortId,
      tenantId:            r.TenantId ? (fromTenantUuid((r.TenantId as string).toLowerCase()) ?? r.TenantId) : null,
      timestamp:           r.Timestamp instanceof Date ? r.Timestamp.toISOString() : String(r.Timestamp),
      actor:               r.Actor,
      actorRole:           r.ActorRole,
      action:              r.Action,
      resource:            r.Resource,
      resourceId:          r.ResourceId,
      outcome:             r.Outcome,
      ipAddress:           r.IpAddress,
      details:             r.Details,
      crossTenantAttempt:  r.CrossTenantAttempt,
    })));
  } catch (err) {
    console.error('[audit-events] DB error', err);
    return NextResponse.json([]);
  }
}

/** POST /api/v1/audit-events — write a vehicle history event */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const { tenantId, vehicleId, eventType, title, description, by, meta } = body;

  if (!tenantId || !vehicleId || !eventType) {
    return NextResponse.json({ message: 'tenantId, vehicleId, eventType required' }, { status: 400 });
  }
  /* Accept tenantId as either short key ('1') or full UUID */
  const tenantUuid = toTenantUuid(tenantId) ?? (fromTenantUuid(tenantId.toLowerCase()) ? tenantId : null);
  if (!tenantUuid) {
    return NextResponse.json({ message: 'Unknown tenantId', received: tenantId }, { status: 400 });
  }

  const db = getPool();
  const shortId = `ae${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  try {
    await db.query(
      `INSERT INTO "AuditEvents"
         ("Id","ShortId","TenantId","Timestamp","Actor","ActorRole","Action",
          "Resource","ResourceId","Outcome","IpAddress","Details","CrossTenantAttempt")
       VALUES
         (gen_random_uuid(),$1,$2,NOW(),$3,'user',$4,'Vehicle',$5,'success','',$6,false)`,
      [
        shortId, tenantUuid,
        by || 'Fleet Manager',
        eventType,
        vehicleId,
        JSON.stringify({ title, description, meta: meta ?? null }),
      ],
    );
    return NextResponse.json({ id: shortId }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/audit-events]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Database error', detail: msg }, { status: 500 });
  }
}
