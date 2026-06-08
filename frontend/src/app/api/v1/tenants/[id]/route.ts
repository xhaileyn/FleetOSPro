import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID } from '@/lib/pgDb';

/**
 * PATCH /api/v1/tenants/:id
 * Updates plan and/or status for a tenant. :id is the short numeric ID (e.g. "1").
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const db          = getPool();
  const { id }      = await params;
  const uuid        = TENANT_UUID[id];
  if (!uuid) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
  }

  try {
    const body = await req.json() as { plan?: string; status?: string };
    const setClauses: string[] = [];
    const values: unknown[]    = [];

    if (body.plan) {
      values.push(body.plan);
      setClauses.push(`"Plan" = $${values.length}`);
    }
    if (body.status) {
      values.push(body.status);
      setClauses.push(`"Status" = $${values.length}`);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
    }

    values.push(uuid);
    await db.query(
      `UPDATE "Tenants" SET ${setClauses.join(', ')} WHERE "Id" = $${values.length}`,
      values,
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/v1/tenants/:id]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
