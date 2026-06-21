import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

function rowToRole(r: Record<string, unknown>) {
  let permissions: unknown[] = [];
  let featurePermissions: Record<string, boolean> = {};
  try { permissions        = JSON.parse(r.PermissionsJson        as string || '[]'); } catch { /* keep */ }
  try { featurePermissions = JSON.parse(r.FeaturePermissionsJson as string || '{}'); } catch { /* keep */ }
  return {
    id:                 r.ShortId,
    tenantId:           fromTenantUuid((r.TenantId as string)?.toLowerCase()) ?? r.TenantId,
    name:               r.Name,
    slug:               r.Slug,
    description:        r.Description,
    color:              r.Color,
    userCount:          r.UserCount,
    createdAt:          r.CreatedAt ? String(r.CreatedAt).slice(0, 10) : '',
    permissions,
    featurePermissions,
  };
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  try {
    const db = getPool();
    let query = `SELECT * FROM "TenantCustomRoles"`;
    const params: unknown[] = [];

    if (tenantId) {
      const uuid = toTenantUuid(tenantId);
      if (uuid) { query += ` WHERE "TenantId" = $1`; params.push(uuid); }
    }
    query += ` ORDER BY "CreatedAt"`;

    const { rows } = await db.query(query, params);
    return NextResponse.json(rows.map(rowToRole));
  } catch (err) {
    console.error('[tenant-roles] DB error', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'invalid body' }, { status: 400 });
  try {
    const db = getPool();
    const uuid = toTenantUuid(body.tenantId);
    if (!uuid) return NextResponse.json({ message: 'invalid tenantId' }, { status: 400 });

    const shortId = body.id ?? `tr-${Date.now().toString(36)}`;
    await db.query(
      `INSERT INTO "TenantCustomRoles" ("Id","ShortId","TenantId","Name","Slug","Description","Color","UserCount","CreatedAt","PermissionsJson","FeaturePermissionsJson")
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,NOW(),$8,$9)`,
      [shortId, uuid, body.name, body.slug ?? '', body.description ?? '', body.color ?? '#6b7280',
       body.userCount ?? 0, JSON.stringify(body.permissions ?? []), JSON.stringify(body.featurePermissions ?? {})]
    );
    return NextResponse.json({ id: shortId }, { status: 201 });
  } catch (err) {
    console.error('[tenant-roles POST] error', err);
    return NextResponse.json({ message: 'Failed to create role' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ message: 'id required' }, { status: 400 });
  try {
    const db = getPool();
    await db.query(
      `UPDATE "TenantCustomRoles" SET "Name"=$1,"Slug"=$2,"Description"=$3,"Color"=$4,
       "UserCount"=$5,"PermissionsJson"=$6,"FeaturePermissionsJson"=$7 WHERE "ShortId"=$8`,
      [body.name, body.slug ?? '', body.description ?? '', body.color ?? '#6b7280',
       body.userCount ?? 0, JSON.stringify(body.permissions ?? []), JSON.stringify(body.featurePermissions ?? {}), body.id]
    );
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[tenant-roles PUT] error', err);
    return NextResponse.json({ message: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });
  try {
    const db = getPool();
    await db.query(`DELETE FROM "TenantCustomRoles" WHERE "ShortId" = $1`, [id]);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[tenant-roles DELETE] error', err);
    return NextResponse.json({ message: 'Failed to delete role' }, { status: 500 });
  }
}
