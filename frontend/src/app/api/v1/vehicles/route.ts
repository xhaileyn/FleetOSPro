import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT } from '@/lib/pgDb';

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

export async function GET(req: NextRequest) {
  const tenantShort = req.nextUrl.searchParams.get('tenantId');
  const db = getPool();
  try {
    const { rows } = tenantShort && TENANT_UUID[tenantShort]
      ? await db.query(`SELECT * FROM "Vehicles" WHERE "TenantId" = $1 ORDER BY "Plate"`, [TENANT_UUID[tenantShort]])
      : await db.query(`SELECT * FROM "Vehicles" ORDER BY "Plate"`);
    return NextResponse.json(rows.map(rowToVehicle));
  } catch (err) {
    console.error('[GET /api/v1/vehicles]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const {
    plate, make, model, year, category, color, engineNo, vin, tenantId,
    customerId, customerName, department,
    ownerType, ownerName, ownerIdNo, ownerContact,
  } = body;

  if (!plate || !tenantId) return NextResponse.json({ message: 'plate and tenantId required' }, { status: 400 });

  const tenantUuid = TENANT_UUID[tenantId];
  if (!tenantUuid) return NextResponse.json({ message: 'Unknown tenantId' }, { status: 400 });

  const db = getPool();
  try {
    const shortId = `v-new-${Date.now()}`;
    await db.query(
      `INSERT INTO "Vehicles"
         ("Id","ShortId","TenantId",
          "Plate","Make","Model","Year","Category","BodyType",
          "Color","EngineNo","EngineCapacity","Vin",
          "FuelType","Transmission","Axles","GrossWeightKg","PayloadKg","SeatingCapacity",
          "RegistrationCountry","PurchasePrice","Supplier",
          "CustomerId","CustomerName","Department",
          "OwnerType","OwnerName","OwnerIdNo","OwnerContact",
          "Status","Odometer","FuelLevel","CreatedAt")
       VALUES
         (gen_random_uuid(),$1,$2,
          $3,$4,$5,$6,$7,$7,
          $8,$9,'',$10,
          'Diesel','Manual',2,0,0,2,
          'Kenya',0,'',
          $11,$12,$13,
          $14,$15,$16,$17,
          'active',0,0,NOW())`,
      [
        shortId, tenantUuid,
        plate.trim().toUpperCase(), make ?? '', model ?? '',
        parseInt(year) || new Date().getFullYear(), category ?? 'Truck',
        color ?? 'White', engineNo ?? '', vin ? vin.toUpperCase() : '',
        customerId ?? null, customerName ?? null, department ?? null,
        ownerType ?? null, ownerName ?? null, ownerIdNo ?? null, ownerContact ?? null,
      ],
    );
    const { rows } = await db.query(`SELECT * FROM "Vehicles" WHERE "ShortId"=$1`, [shortId]);
    return NextResponse.json(rowToVehicle(rows[0]), { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/vehicles]', err);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}
