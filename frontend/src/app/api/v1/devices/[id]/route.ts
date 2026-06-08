import { NextRequest, NextResponse } from 'next/server';
import { getPool, UUID_TENANT } from '@/lib/pgDb';

function rowToDevice(r: Record<string, unknown>) {
  return {
    id:           r.ShortId,
    tenantId:     UUID_TENANT[(r.TenantId as string)?.toLowerCase()] ?? r.TenantId,
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

/** PATCH /api/v1/devices/:id — update any device fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Record<string, string | null>;

  const allowed: Record<string, string> = {
    vehicleId:    'VehicleShortId',
    vehiclePlate: 'VehiclePlate',
    type:         'Type',
    model:        'Model',
    serialNo:     'SerialNo',
    imei:         'Imei',
    firmware:     'Firmware',
    signal:       'Signal',
    battery:      'Battery',
    status:       'Status',
    simId:        'SimShortId',
    installedAt:  'InstalledAt',
    notes:        'Notes',
  };

  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, col] of Object.entries(allowed)) {
    if (key in body) {
      const val = body[key];
      if (key === 'battery') {
        values.push(val !== null && val !== '' ? Number(val) : null);
      } else {
        values.push(val ?? null);
      }
      setClauses.push(`"${col}" = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  const db = getPool();
  try {
    const { rowCount } = await db.query(
      `UPDATE "Devices" SET ${setClauses.join(', ')} WHERE "ShortId" = $${values.length}`,
      values,
    );
    if ((rowCount ?? 0) === 0) {
      return NextResponse.json({ message: 'Device not found' }, { status: 404 });
    }
    const { rows } = await db.query(`SELECT * FROM "Devices" WHERE "ShortId" = $1`, [id]);
    return NextResponse.json(rowToDevice(rows[0]));
  } catch (err) {
    console.error('[PATCH /api/v1/devices/:id]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Database error', detail: msg }, { status: 500 });
  }
}

/** DELETE /api/v1/devices/:id */
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getPool();
  try {
    const { rowCount } = await db.query(
      `DELETE FROM "Devices" WHERE "ShortId" = $1`, [id],
    );
    return (rowCount ?? 0) > 0
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ message: 'Device not found' }, { status: 404 });
  } catch (err) {
    console.error('[DELETE /api/v1/devices/:id]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
