import { NextRequest, NextResponse } from 'next/server';
import { getPool, UUID_TENANT, fromTenantUuid } from '@/lib/pgDb';

function rowToDriver(d: Record<string, unknown>) {
  return {
    id:                    d.ShortId || d.Id,
    tenantId:              fromTenantUuid((d.TenantId as string)?.toLowerCase()) ?? d.TenantId,
    firstName:             d.FirstName ?? '',
    lastName:              d.LastName  ?? '',
    name:                  `${d.FirstName ?? ''} ${d.LastName ?? ''}`.trim(),
    email:                 d.Email      ?? '',
    phone:                 d.Phone      ?? '',
    licenseNumber:         d.LicenseNo  ?? '',
    licenseClass:          d.LicenseClass ?? '',
    licenseExpiry:         d.LicenseExpiry ? new Date(d.LicenseExpiry as string).toISOString().slice(0, 10) : '',
    status:                d.Status,
    safetyScore:           d.SafetyScore  ?? 0,
    hosDriven:             d.HosDriven   ?? 0,
    hosRemaining:          d.HosRemaining ?? 0,
    assignedVehiclePlate:  d.AssignedVehiclePlate ?? null,
    assignedVehicleId:     d.AssignedVehicleId    ?? null,
    photo:                 d.Photo ?? null,
  };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getPool();
    const { rows } = await db.query(
      `SELECT * FROM "Drivers" WHERE "ShortId" = $1 OR "Id"::text = $1 LIMIT 1`,
      [id]
    );
    if (!rows[0]) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
    return NextResponse.json(rowToDriver(rows[0]));
  } catch (err) {
    console.error('[drivers/[id] GET]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getPool();
    const { rowCount } = await db.query(
      `DELETE FROM "Drivers" WHERE "ShortId" = $1 OR "Id"::text = $1`,
      [id]
    );
    return (rowCount ?? 0) > 0
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ message: 'Not found.' }, { status: 404 });
  } catch (err) {
    console.error('[drivers/[id] DELETE]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
