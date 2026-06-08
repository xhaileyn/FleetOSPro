import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT } from '@/lib/pgDb';

function rowToBranch(b: Record<string, unknown>) {
  return {
    id:           b.ShortId || b.Id,
    tenantId:     UUID_TENANT[(b.TenantId as string)?.toLowerCase()] ?? b.TenantId,
    name:         b.Name,
    city:         b.City         ?? '',
    region:       b.Region       ?? '',
    vehicleCount: Number(b.VehicleCount) || 0,
    driverCount:  Number(b.DriverCount)  || 0,
    userCount:    Number(b.UserCount)    || 0,
    active:       b.Active       ?? true,
    managerId:    b.ManagerId    ?? undefined,
    createdAt:    b.CreatedAt ? new Date(b.CreatedAt as string).toISOString().slice(0, 10) : '',
  };
}

export async function GET(req: NextRequest) {
  const tenantShort = req.nextUrl.searchParams.get('tenantId');
  const db = getPool();
  try {
    const { rows } = tenantShort && TENANT_UUID[tenantShort]
      ? await db.query(`SELECT * FROM "Branches" WHERE "TenantId" = $1 ORDER BY "Name"`, [TENANT_UUID[tenantShort]])
      : await db.query(`SELECT * FROM "Branches" ORDER BY "Name"`);
    return NextResponse.json(rows.map(rowToBranch));
  } catch (err) {
    console.error('[GET /api/v1/branches]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
