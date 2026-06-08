import { NextRequest, NextResponse } from 'next/server';
import { getPool, UUID_TENANT } from '@/lib/pgDb';

function rowToSim(r: Record<string, unknown>) {
  return {
    id:           r.ShortId,
    tenantId:     UUID_TENANT[(r.TenantId as string)?.toLowerCase()] ?? r.TenantId,
    vehicleId:    r.VehicleShortId ?? '',
    vehiclePlate: r.VehiclePlate   ?? '',
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

/** PATCH /api/v1/sims/:id — update any SIM fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Record<string, string | null>;

  const allowed: Record<string, string> = {
    vehicleId:    'VehicleShortId',
    vehiclePlate: 'VehiclePlate',
    iccid:        'Iccid',
    msisdn:       'Msisdn',
    operator:     'Operator',
    country:      'Country',
    type:         'Type',
    status:       'Status',
    dataPlanMB:   'DataPlanMb',
    apn:          'Apn',
    activatedAt:  'ActivatedAt',
    expiresAt:    'ExpiresAt',
    notes:        'Notes',
  };

  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, col] of Object.entries(allowed)) {
    if (key in body) {
      const val = body[key];
      if (key === 'dataPlanMB') {
        values.push(val ? parseInt(String(val)) : null);
      } else {
        values.push(val ?? null);
      }
      setClauses.push(`"${col}" = $${values.length}`);
    }
  }

  /* Auto-set status when vehicleId is cleared */
  if ('vehicleId' in body && !('status' in body)) {
    const autoStatus = body.vehicleId ? 'Active' : 'Inactive';
    values.push(autoStatus);
    setClauses.push(`"Status" = $${values.length}`);
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  const db = getPool();
  try {
    const { rowCount } = await db.query(
      `UPDATE "SimCards" SET ${setClauses.join(', ')} WHERE "ShortId" = $${values.length}`,
      values,
    );
    if ((rowCount ?? 0) === 0) {
      return NextResponse.json({ message: 'SIM not found' }, { status: 404 });
    }
    const { rows } = await db.query(`SELECT * FROM "SimCards" WHERE "ShortId" = $1`, [id]);
    return NextResponse.json(rowToSim(rows[0]));
  } catch (err) {
    console.error('[PATCH /api/v1/sims/:id]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Database error', detail: msg }, { status: 500 });
  }
}

/** DELETE /api/v1/sims/:id */
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getPool();
  try {
    const { rowCount } = await db.query(
      `DELETE FROM "SimCards" WHERE "ShortId" = $1`, [id],
    );
    return (rowCount ?? 0) > 0
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ message: 'SIM not found' }, { status: 404 });
  } catch (err) {
    console.error('[DELETE /api/v1/sims/:id]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
