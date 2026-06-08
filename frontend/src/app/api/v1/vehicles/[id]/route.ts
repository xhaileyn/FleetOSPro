import { NextRequest, NextResponse } from 'next/server';
import { getPool, UUID_TENANT } from '@/lib/pgDb';

function rowToVehicle(v: Record<string, unknown>) {
  return {
    id:                  v.ShortId || v.Id,
    tenantId:            UUID_TENANT[(v.TenantId as string)?.toLowerCase()] ?? v.TenantId,
    plate:               v.Plate,
    vin:                 v.Vin            ?? '',
    make:                v.Make,
    model:               v.Model,
    year:                v.Year,
    category:            v.Category       ?? 'Truck',
    bodyType:            v.BodyType        ?? '',
    color:               v.Color           ?? '',
    engineNo:            v.EngineNo        ?? '',
    engineCapacity:      v.EngineCapacity  ?? '',
    fuelType:            v.FuelType        ?? 'Diesel',
    transmission:        v.Transmission    ?? 'Manual',
    axles:               v.Axles           ?? 2,
    grossWeightKg:       v.GrossWeightKg   ?? 0,
    payloadKg:           v.PayloadKg       ?? 0,
    seatingCapacity:     v.SeatingCapacity ?? 2,
    registrationCountry: v.RegistrationCountry ?? 'Kenya',
    registrationDate:    v.RegistrationDate ? new Date(v.RegistrationDate as string).toISOString().slice(0, 10) : '',
    purchaseDate:        v.PurchaseDate     ? new Date(v.PurchaseDate     as string).toISOString().slice(0, 10) : '',
    purchasePrice:       Number(v.PurchasePrice) || 0,
    supplier:            v.Supplier        ?? '',
    ownerType:           v.OwnerType       ?? undefined,
    ownerName:           v.OwnerName       ?? undefined,
    ownerIdNo:           v.OwnerIdNo       ?? undefined,
    ownerContact:        v.OwnerContact    ?? undefined,
    status:              v.Status,
    odometer:            v.Odometer        ?? 0,
    fuelLevel:           Number(v.FuelLevel) || 0,
    customerId:          v.CustomerId      ?? null,
    customerName:        v.CustomerName    ?? null,
    department:          v.Department      ?? null,
    driverName:          v.AssignedDriverName ?? null,
    driverId:            v.AssignedDriverId   ?? null,
    latitude:            v.Latitude  != null ? Number(v.Latitude)  : null,
    longitude:           v.Longitude != null ? Number(v.Longitude) : null,
    speedKmh:            v.SpeedKmh  != null ? Number(v.SpeedKmh)  : null,
    lastSeenAt:          v.LastSeenAt ? new Date(v.LastSeenAt as string).toISOString() : null,
    documents:           [],
    history:             [],
    maintenance:         [],
  };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getPool();
    // Support lookup by ShortId or UUID
    const { rows } = await db.query(
      `SELECT * FROM "Vehicles" WHERE "ShortId" = $1 OR "Id"::text = $1 LIMIT 1`,
      [id]
    );
    if (!rows[0]) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
    return NextResponse.json(rowToVehicle(rows[0]));
  } catch (err) {
    console.error('[vehicles/[id] GET]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const db = getPool();
    const sets: string[] = [];
    const vals: unknown[] = [];
    const allowed = ['Plate','Make','Model','Year','Category','BodyType','Color','Status',
                     'Odometer','FuelLevel','AssignedDriverName','AssignedDriverId',
                     'OwnerType','OwnerName','OwnerIdNo','OwnerContact',
                     'CustomerId','CustomerName','Department'];
    const bodyMap: Record<string, string> = {
      plate:'Plate', make:'Make', model:'Model', year:'Year', category:'Category',
      bodyType:'BodyType', color:'Color', status:'Status', odometer:'Odometer',
      fuelLevel:'FuelLevel', driverName:'AssignedDriverName', driverId:'AssignedDriverId',
      ownerType:'OwnerType', ownerName:'OwnerName', ownerIdNo:'OwnerIdNo', ownerContact:'OwnerContact',
      customerId:'CustomerId', customerName:'CustomerName', department:'Department',
    };
    for (const [k, col] of Object.entries(bodyMap)) {
      if (body[k] !== undefined && allowed.includes(col)) {
        sets.push(`"${col}" = $${vals.length + 1}`);
        vals.push(body[k]);
      }
    }
    if (!sets.length) return new NextResponse(null, { status: 204 });
    vals.push(id);
    await db.query(
      `UPDATE "Vehicles" SET ${sets.join(', ')} WHERE "ShortId" = $${vals.length} OR "Id"::text = $${vals.length}`,
      vals
    );
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[vehicles/[id] PUT]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getPool();
    const { rowCount } = await db.query(
      `DELETE FROM "Vehicles" WHERE "ShortId" = $1 OR "Id"::text = $1`,
      [id]
    );
    return (rowCount ?? 0) > 0
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ message: 'Not found.' }, { status: 404 });
  } catch (err) {
    console.error('[vehicles/[id] DELETE]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
