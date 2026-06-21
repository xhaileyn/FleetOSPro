import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, UUID_TENANT, toTenantUuid, fromTenantUuid } from '@/lib/pgDb';

function rowToVehicle(v: Record<string, unknown>) {
  return {
    id:                  v.ShortId || v.Id,
    tenantId:            fromTenantUuid((v.TenantId as string)?.toLowerCase()) ?? v.TenantId,
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
    driverName:          v.DriverName      ?? v.AssignedDriverName ?? null,
    driverId:            v.DriverId        ?? v.AssignedDriverId  ?? null,
    latitude:            v.Latitude  != null ? Number(v.Latitude)  : null,
    longitude:           v.Longitude != null ? Number(v.Longitude) : null,
    speedKmh:            v.SpeedKmh  != null ? Number(v.SpeedKmh)  : null,
    lastSeenAt:          v.LastSeenAt ? new Date(v.LastSeenAt as string).toISOString() : null,
    deviceId:            v.DeviceShortId != null && v.DeviceShortId !== '' ? String(v.DeviceShortId) : null,
    documents:           [],
    history:             [],
    maintenance:         [],
  };
}

export async function GET(req: NextRequest) {
  const tenantShort = req.nextUrl.searchParams.get('tenantId');
  const db = getPool();
  try {
    const deviceSubquery = `(SELECT d."ShortId" FROM "Devices" d WHERE d."VehicleShortId" = v."ShortId" LIMIT 1) AS "DeviceShortId"`;
    const { rows } = tenantShort && toTenantUuid(tenantShort)
      ? await db.query(`SELECT v.*, ${deviceSubquery} FROM "Vehicles" v WHERE v."TenantId" = $1 ORDER BY v."Plate"`, [toTenantUuid(tenantShort)])
      : await db.query(`SELECT v.*, ${deviceSubquery} FROM "Vehicles" v ORDER BY v."Plate"`);
    return NextResponse.json(rows.map(rowToVehicle));
  } catch (err) {
    console.error('[GET /api/v1/vehicles]', err);
    // ── Demo fallback: London & New York fleet ──────────────────────────
    const now = new Date();
    const ago = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
    const demoVehicles = [
      { id:'LON01', tenantId:'1', plate:'LN71 ABC', vin:'WBA3A5G59FNS12301', make:'Mercedes', model:'Sprinter 314', year:2022, category:'Van', bodyType:'Panel Van', color:'White', fuelType:'Diesel', transmission:'Automatic', status:'active', odometer:42100, fuelLevel:72, latitude:51.5074, longitude:-0.1278, speedKmh:38, lastSeenAt:ago(2), deviceId:'DEV-LON-01', driverName:'James Wilson', documents:[], history:[], maintenance:[] },
      { id:'LON02', tenantId:'1', plate:'LN70 XYZ', vin:'WBA3A5G59FNS12302', make:'Ford', model:'Transit Connect', year:2023, category:'Van', bodyType:'Panel Van', color:'Silver', fuelType:'Diesel', transmission:'Manual', status:'active', odometer:88500, fuelLevel:55, latitude:51.5155, longitude:-0.0922, speedKmh:52, lastSeenAt:ago(1), deviceId:'DEV-LON-02', driverName:'Sarah Chen', documents:[], history:[], maintenance:[] },
      { id:'LON03', tenantId:'1', plate:'LN69 DEF', vin:'WBA3A5G59FNS12303', make:'Volkswagen', model:'Crafter 35', year:2021, category:'Truck', bodyType:'Box Body', color:'White', fuelType:'Diesel', transmission:'Manual', status:'active', odometer:31200, fuelLevel:88, latitude:51.4994, longitude:-0.1743, speedKmh:24, lastSeenAt:ago(3), deviceId:'DEV-LON-03', driverName:'Mohammed Ali', documents:[], history:[], maintenance:[] },
      { id:'LON04', tenantId:'1', plate:'LN72 GHI', vin:'WBA3A5G59FNS12304', make:'Iveco', model:'Daily 35S14', year:2022, category:'Truck', bodyType:'Curtainsider', color:'Blue', fuelType:'Diesel', transmission:'Manual', status:'active', odometer:125000, fuelLevel:41, latitude:51.5289, longitude:-0.1047, speedKmh:61, lastSeenAt:ago(1), deviceId:'DEV-LON-04', driverName:'Emma Thompson', documents:[], history:[], maintenance:[] },
      { id:'LON05', tenantId:'1', plate:'LN68 JKL', vin:'WBA3A5G59FNS12305', make:'Renault', model:'Master L3H2', year:2020, category:'Van', bodyType:'Panel Van', color:'White', fuelType:'Diesel', transmission:'Manual', status:'idle', odometer:67300, fuelLevel:93, latitude:51.4879, longitude:-0.1560, speedKmh:0, lastSeenAt:ago(28), deviceId:'DEV-LON-05', driverName:'David O\'Brien', documents:[], history:[], maintenance:[] },
      { id:'LON06', tenantId:'1', plate:'LN67 MNO', vin:'WBA3A5G59FNS12306', make:'Peugeot', model:'Boxer 330', year:2023, category:'Van', bodyType:'Panel Van', color:'Grey', fuelType:'Diesel', transmission:'Automatic', status:'active', odometer:54800, fuelLevel:67, latitude:51.5440, longitude:-0.0554, speedKmh:44, lastSeenAt:ago(2), deviceId:'DEV-LON-06', driverName:'Sophie Martin', documents:[], history:[], maintenance:[] },
      { id:'LON07', tenantId:'1', plate:'LN66 PQR', vin:'WBA3A5G59FNS12307', make:'Vauxhall', model:'Movano L3H2', year:2021, category:'Van', bodyType:'Panel Van', color:'White', fuelType:'Diesel', transmission:'Manual', status:'active', odometer:19800, fuelLevel:79, latitude:51.4641, longitude:-0.1173, speedKmh:33, lastSeenAt:ago(4), deviceId:'DEV-LON-07', driverName:'Liam Patel', documents:[], history:[], maintenance:[] },
      { id:'LON08', tenantId:'1', plate:'LN65 STU', vin:'WBA3A5G59FNS12308', make:'DAF', model:'LF 180', year:2020, category:'Truck', bodyType:'Flatbed', color:'Red', fuelType:'Diesel', transmission:'Automatic', status:'maintenance', odometer:198000, fuelLevel:30, latitude:null, longitude:null, speedKmh:0, lastSeenAt:ago(1440), deviceId:'DEV-LON-08', driverName:null, documents:[], history:[], maintenance:[] },
      { id:'NYC01', tenantId:'1', plate:'NYC 4821', vin:'WBA3A5G59FNS12310', make:'Freightliner', model:'Sprinter 2500', year:2022, category:'Van', bodyType:'Cargo Van', color:'White', fuelType:'Gasoline', transmission:'Automatic', status:'active', odometer:78200, fuelLevel:63, latitude:40.7128, longitude:-74.0060, speedKmh:28, lastSeenAt:ago(3), deviceId:'DEV-NYC-01', driverName:'Carlos Rivera', documents:[], history:[], maintenance:[] },
      { id:'NYC02', tenantId:'1', plate:'NYC 9143', vin:'WBA3A5G59FNS12311', make:'Ford', model:'E-350 Cutaway', year:2021, category:'Van', bodyType:'Box Van', color:'Brown', fuelType:'Gasoline', transmission:'Automatic', status:'active', odometer:142000, fuelLevel:34, latitude:40.7580, longitude:-73.9855, speedKmh:47, lastSeenAt:ago(1), deviceId:'DEV-NYC-02', driverName:'Aisha Johnson', documents:[], history:[], maintenance:[] },
      { id:'NYC03', tenantId:'1', plate:'NYC 3307', vin:'WBA3A5G59FNS12312', make:'Ram', model:'ProMaster 2500', year:2023, category:'Van', bodyType:'Panel Van', color:'White', fuelType:'Gasoline', transmission:'Automatic', status:'idle', odometer:33100, fuelLevel:91, latitude:40.6892, longitude:-74.0445, speedKmh:0, lastSeenAt:ago(45), deviceId:'DEV-NYC-03', driverName:'Marcus Lee', documents:[], history:[], maintenance:[] },
      // Europe fleet
      { id:'PAR01', tenantId:'1', plate:'AB-123-CD', vin:'VF1AA000012345601', make:'Renault', model:'Master L3H2', year:2022, category:'Van', bodyType:'Panel Van', color:'White', fuelType:'Diesel', transmission:'Manual', status:'active', odometer:61200, fuelLevel:58, latitude:48.8566, longitude:2.3522, speedKmh:41, lastSeenAt:ago(2), deviceId:'DEV-PAR-01', driverName:'Jean Dupont', documents:[], history:[], maintenance:[] },
      { id:'PAR02', tenantId:'1', plate:'EF-456-GH', vin:'VF1AA000012345602', make:'Peugeot', model:'Boxer 330', year:2021, category:'Van', bodyType:'Panel Van', color:'Grey', fuelType:'Diesel', transmission:'Manual', status:'active', odometer:44800, fuelLevel:71, latitude:48.8742, longitude:2.3470, speedKmh:29, lastSeenAt:ago(3), deviceId:'DEV-PAR-02', driverName:'Marie Lambert', documents:[], history:[], maintenance:[] },
      { id:'BER01', tenantId:'1', plate:'B-AB 1234', vin:'WBA1B910X0ZX12301', make:'Mercedes', model:'Sprinter 314', year:2023, category:'Van', bodyType:'Panel Van', color:'White', fuelType:'Diesel', transmission:'Automatic', status:'active', odometer:28900, fuelLevel:84, latitude:52.5200, longitude:13.4050, speedKmh:55, lastSeenAt:ago(1), deviceId:'DEV-BER-01', driverName:'Hans Müller', documents:[], history:[], maintenance:[] },
      { id:'BER02', tenantId:'1', plate:'B-CD 5678', vin:'WBA1B910X0ZX12302', make:'Volkswagen', model:'Crafter 35', year:2022, category:'Truck', bodyType:'Box Body', color:'Blue', fuelType:'Diesel', transmission:'Manual', status:'active', odometer:73400, fuelLevel:47, latitude:52.5100, longitude:13.3800, speedKmh:38, lastSeenAt:ago(4), deviceId:'DEV-BER-02', driverName:'Anna Schmidt', documents:[], history:[], maintenance:[] },
      { id:'AMS01', tenantId:'1', plate:'12-AB-34', vin:'VSSZZZ6FZHR012301', make:'Ford', model:'Transit Custom', year:2023, category:'Van', bodyType:'Panel Van', color:'Silver', fuelType:'Diesel', transmission:'Automatic', status:'active', odometer:19600, fuelLevel:92, latitude:52.3676, longitude:4.9041, speedKmh:33, lastSeenAt:ago(2), deviceId:'DEV-AMS-01', driverName:'Pieter van den Berg', documents:[], history:[], maintenance:[] },
      { id:'MAD01', tenantId:'1', plate:'1234 ABC', vin:'VS7ZZZ4N0NT012301', make:'Iveco', model:'Daily 35S14', year:2021, category:'Truck', bodyType:'Curtainsider', color:'White', fuelType:'Diesel', transmission:'Manual', status:'active', odometer:95100, fuelLevel:36, latitude:40.4168, longitude:-3.7038, speedKmh:48, lastSeenAt:ago(3), deviceId:'DEV-MAD-01', driverName:'Carlos García', documents:[], history:[], maintenance:[] },
    ];
    return NextResponse.json(demoVehicles);
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

  const tenantUuid = toTenantUuid(tenantId);
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
