import { NextRequest, NextResponse } from 'next/server';
import { getPool, UUID_TENANT, fromTenantUuid } from '@/lib/pgDb';

function rowToSchedule(r: Record<string, unknown>) {
  return {
    id:             r.ShortId,
    tenantId:       fromTenantUuid((r.TenantId as string)?.toLowerCase()) ?? r.TenantId,
    vehicleShortId: r.VehicleShortId ?? '',
    vehiclePlate:   r.VehiclePlate   ?? '',
    vehicleMake:    r.VehicleMake    ?? '',
    serviceType:    r.ServiceType,
    lastDoneAt:     r.LastDoneAt  ? String(r.LastDoneAt).slice(0, 10)  : null,
    dueAt:          r.DueAt       ? String(r.DueAt).slice(0, 10)       : null,
    mileage:        r.Mileage     ?? '',
    status:         r.Status,
    priority:       r.Priority,
    notes:          r.Notes       ?? '',
    createdAt:      r.CreatedAt,
  };
}

/** PATCH /api/v1/maintenance/:id — update any field(s) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Record<string, string | null>;

  // Build SET clause dynamically — only update fields that were sent
  const allowed: Record<string, string> = {
    vehicleShortId: 'VehicleShortId',
    vehiclePlate:   'VehiclePlate',
    vehicleMake:    'VehicleMake',
    serviceType:    'ServiceType',
    lastDoneAt:     'LastDoneAt',
    dueAt:          'DueAt',
    mileage:        'Mileage',
    status:         'Status',
    priority:       'Priority',
    notes:          'Notes',
  };

  const setClauses: string[] = [];
  const values: (string | null)[] = [];

  for (const [key, col] of Object.entries(allowed)) {
    if (key in body) {
      values.push(body[key] ?? null);
      setClauses.push(`"${col}" = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
  }

  values.push(id); // last param = WHERE clause
  const db = getPool();
  try {
    const { rowCount } = await db.query(
      `UPDATE "MaintenanceSchedules" SET ${setClauses.join(', ')} WHERE "ShortId" = $${values.length}`,
      values,
    );
    if ((rowCount ?? 0) === 0) {
      return NextResponse.json({ message: 'Schedule not found' }, { status: 404 });
    }
    const { rows } = await db.query(
      `SELECT * FROM "MaintenanceSchedules" WHERE "ShortId" = $1`, [id],
    );
    return NextResponse.json(rowToSchedule(rows[0]));
  } catch (err) {
    console.error('[PATCH /api/v1/maintenance/:id]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Database error', detail: msg }, { status: 500 });
  }
}
