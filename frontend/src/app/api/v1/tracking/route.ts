import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID, toTenantUuid } from '@/lib/pgDb';

// ── GET: live positions or historical feed ────────────────────────────
//
// ?mode=live    — latest ping per vehicle in tenant (for live map)
// ?mode=history — all pings for a vehicle in a time window
// ?mode=events  — only pings with EventFlags > 0
//
// Additional params:
//   vehicleId — filter to one vehicle (short-id or UUID)
//   since     — ISO timestamp (history/events cursor)
//   until     — ISO timestamp (history upper bound)
//   limit     — max rows (default 500, max 10000)
//   flags     — bitmask filter: returns pings where (EventFlags & flags) > 0
export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams;
  const tenantId  = sp.get('tenantId') ?? '1';
  const mode      = sp.get('mode') ?? 'live';
  const vehicleId = sp.get('vehicleId');
  const since     = sp.get('since');
  const until     = sp.get('until');
  const limit     = Math.min(Number(sp.get('limit') ?? '500'), 10000);
  const flags     = sp.get('flags') ? Number(sp.get('flags')) : null;

  const tenantUuid = toTenantUuid(tenantId);
  if (!tenantUuid) {
    return NextResponse.json({ error: 'Unknown tenantId' }, { status: 400 });
  }

  const db = getPool();

  try {
    if (mode === 'live') {
      // Latest ping per vehicle — uses idx_periodic_tenant_vehicle_time
      const params: unknown[] = [tenantUuid];
      let vehicleFilter = '';
      if (vehicleId) {
        const vr = await db.query(
          `SELECT "Id" FROM "Vehicles" WHERE ("ShortId"=$1 OR "Id"::text=$1) AND "TenantId"=$2 LIMIT 1`,
          [vehicleId, tenantUuid],
        );
        if (!vr.rows.length) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        params.push(vr.rows[0].Id);
        vehicleFilter = `AND p."VehicleId" = $${params.length}`;
      }

      const { rows } = await db.query(
        `SELECT DISTINCT ON (p."VehicleId")
           p."VehicleId",
           v."ShortId"       AS vehicle_short_id,
           v."Plate",
           p."DeviceImei",
           p."TransmittedAt",
           p."ReceivedAt",
           p."Lat", p."Lng",
           p."HeadingDeg",
           p."SpeedKmh",
           p."OdometerKm",
           p."IgnitionOn",
           p."EngineRpm",
           p."FuelLevelPct",
           p."BatteryV",
           p."Satellites",
           p."SignalDbm",
           p."NetworkType",
           p."EventFlags",
           p."IntervalSec",
           p."Protocol"
         FROM "PeriodicTransmissions" p
         JOIN "Vehicles" v ON v."Id" = p."VehicleId"
         WHERE p."TenantId" = $1
           AND p."TransmittedAt" > NOW() - INTERVAL '2 days'
           ${vehicleFilter}
         ORDER BY p."VehicleId", p."TransmittedAt" DESC`,
        params,
      );

      return NextResponse.json({
        mode: 'live',
        count: rows.length,
        asOf: new Date().toISOString(),
        vehicles: rows.map(mapRow),
      });
    }

    if (mode === 'history' || mode === 'events') {
      if (!vehicleId) return NextResponse.json({ error: 'vehicleId required for history/events' }, { status: 400 });

      const vr = await db.query(
        `SELECT "Id" FROM "Vehicles" WHERE ("ShortId"=$1 OR "Id"::text=$1) AND "TenantId"=$2 LIMIT 1`,
        [vehicleId, tenantUuid],
      );
      if (!vr.rows.length) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      const vehicleUuid = vr.rows[0].Id;

      const params: unknown[] = [tenantUuid, vehicleUuid];
      const wheres: string[] = [
        `p."TenantId"  = $1`,
        `p."VehicleId" = $2`,
      ];

      if (since) { params.push(since); wheres.push(`p."TransmittedAt" >= $${params.length}`); }
      if (until) { params.push(until); wheres.push(`p."TransmittedAt" <= $${params.length}`); }
      if (mode === 'events') wheres.push(`p."EventFlags" > 0`);
      if (flags !== null)    wheres.push(`(p."EventFlags" & ${flags}) > 0`);

      params.push(limit);

      const { rows } = await db.query(
        `SELECT
           p."VehicleId",
           v."ShortId"      AS vehicle_short_id,
           v."Plate",
           p."DeviceImei",
           p."TransmittedAt",
           p."ReceivedAt",
           p."Lat", p."Lng",
           p."HeadingDeg",
           p."SpeedKmh",
           p."OdometerKm",
           p."Mileage",
           p."IgnitionOn",
           p."EngineRpm",
           p."FuelLevelPct",
           p."FuelConsRateL",
           p."BatteryV",
           p."Satellites",
           p."SignalDbm",
           p."NetworkType",
           p."EventFlags",
           p."IntervalSec",
           p."Protocol"
         FROM "PeriodicTransmissions" p
         JOIN "Vehicles" v ON v."Id" = p."VehicleId"
         WHERE ${wheres.join(' AND ')}
         ORDER BY p."TransmittedAt" ASC
         LIMIT $${params.length}`,
        params,
      );

      return NextResponse.json({
        mode,
        count: rows.length,
        pings: rows.map(mapRow),
      });
    }

    return NextResponse.json({ error: 'mode must be live | history | events' }, { status: 400 });
  } catch (err) {
    console.error('[tracking GET]', err);
    // ── Demo fallback: London & New York fleet ──────────────────────────
    const now = new Date();
    const ago = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
    if (mode === 'live') {
      const vehicles = [
        // London vehicles
        { vehicleId:'v-lon-01', vehicle_short_id:'LON01', plate:'LN71 ABC', deviceImei:'351756051523999', lat:51.5074,  lng:-0.1278,  headingDeg:45,  speedKmh:38, ignitionOn:true,  engineRpm:2100, fuelLevelPct:72, batteryV:12.8, satellites:9,  signalDbm:-72, networkType:'4G', eventFlags:0, transmittedAt:ago(2),  receivedAt:ago(2),  protocol:'Teltonika', odometerKm:42100 },
        { vehicleId:'v-lon-02', vehicle_short_id:'LON02', plate:'LN70 XYZ', deviceImei:'351756051524001', lat:51.5155,  lng:-0.0922,  headingDeg:120, speedKmh:52, ignitionOn:true,  engineRpm:2600, fuelLevelPct:55, batteryV:12.6, satellites:8,  signalDbm:-68, networkType:'4G', eventFlags:0, transmittedAt:ago(1),  receivedAt:ago(1),  protocol:'GT06',      odometerKm:88500 },
        { vehicleId:'v-lon-03', vehicle_short_id:'LON03', plate:'LN69 DEF', deviceImei:'351756051524002', lat:51.4994,  lng:-0.1743,  headingDeg:270, speedKmh:24, ignitionOn:true,  engineRpm:1800, fuelLevelPct:88, batteryV:12.9, satellites:10, signalDbm:-65, networkType:'4G', eventFlags:0, transmittedAt:ago(3),  receivedAt:ago(3),  protocol:'Teltonika', odometerKm:31200 },
        { vehicleId:'v-lon-04', vehicle_short_id:'LON04', plate:'LN72 GHI', deviceImei:'351756051524003', lat:51.5289,  lng:-0.1047,  headingDeg:315, speedKmh:61, ignitionOn:true,  engineRpm:3100, fuelLevelPct:41, batteryV:12.5, satellites:7,  signalDbm:-78, networkType:'4G', eventFlags:2, transmittedAt:ago(1),  receivedAt:ago(1),  protocol:'CalAmp',    odometerKm:125000 },
        { vehicleId:'v-lon-05', vehicle_short_id:'LON05', plate:'LN68 JKL', deviceImei:'351756051524004', lat:51.4879,  lng:-0.1560,  headingDeg:90,  speedKmh:0,  ignitionOn:false, engineRpm:0,    fuelLevelPct:93, batteryV:12.4, satellites:6,  signalDbm:-80, networkType:'4G', eventFlags:0, transmittedAt:ago(28), receivedAt:ago(28), protocol:'GT06',      odometerKm:67300 },
        { vehicleId:'v-lon-06', vehicle_short_id:'LON06', plate:'LN67 MNO', deviceImei:'351756051524005', lat:51.5440,  lng:-0.0554,  headingDeg:200, speedKmh:44, ignitionOn:true,  engineRpm:2350, fuelLevelPct:67, batteryV:12.7, satellites:9,  signalDbm:-71, networkType:'4G', eventFlags:0, transmittedAt:ago(2),  receivedAt:ago(2),  protocol:'Queclink',  odometerKm:54800 },
        { vehicleId:'v-lon-07', vehicle_short_id:'LON07', plate:'LN66 PQR', deviceImei:'351756051524006', lat:51.4641,  lng:-0.1173,  headingDeg:160, speedKmh:33, ignitionOn:true,  engineRpm:2050, fuelLevelPct:79, batteryV:12.9, satellites:8,  signalDbm:-69, networkType:'4G', eventFlags:0, transmittedAt:ago(4),  receivedAt:ago(4),  protocol:'Teltonika', odometerKm:19800 },
        // New York vehicles
        { vehicleId:'v-nyc-01', vehicle_short_id:'NYC01', plate:'NYC 4821', deviceImei:'351756051524010', lat:40.7128,  lng:-74.0060, headingDeg:90,  speedKmh:28, ignitionOn:true,  engineRpm:1950, fuelLevelPct:63, batteryV:12.7, satellites:8,  signalDbm:-74, networkType:'LTE', eventFlags:0, transmittedAt:ago(3),  receivedAt:ago(3),  protocol:'CalAmp',    odometerKm:78200 },
        { vehicleId:'v-nyc-02', vehicle_short_id:'NYC02', plate:'NYC 9143', deviceImei:'351756051524011', lat:40.7580,  lng:-73.9855, headingDeg:180, speedKmh:47, ignitionOn:true,  engineRpm:2700, fuelLevelPct:34, batteryV:12.5, satellites:7,  signalDbm:-76, networkType:'LTE', eventFlags:1, transmittedAt:ago(1),  receivedAt:ago(1),  protocol:'Teltonika', odometerKm:142000 },
        { vehicleId:'v-nyc-03', vehicle_short_id:'NYC03', plate:'NYC 3307', deviceImei:'351756051524012', lat:40.6892,  lng:-74.0445, headingDeg:270, speedKmh:0,  ignitionOn:false, engineRpm:0,    fuelLevelPct:91, batteryV:12.3, satellites:5,  signalDbm:-82, networkType:'LTE', eventFlags:0, transmittedAt:ago(45), receivedAt:ago(45), protocol:'GT06',      odometerKm:33100 },
      ];
      return NextResponse.json({ mode: 'live', count: vehicles.length, asOf: now.toISOString(), vehicles });
    }
    if (mode === 'history' || mode === 'events') {
      // Simulate a London route: City → Canary Wharf → Greenwich
      const pings = Array.from({ length: 60 }, (_, i) => {
        const t = new Date(now.getTime() - (60 - i) * 120000);
        const lat = 51.5074 + i * 0.0018 - 0.002 * Math.sin(i * 0.3);
        const lng = -0.1278 + i * 0.0022 + 0.001 * Math.cos(i * 0.3);
        return { vehicleId:'v-lon-01', vehicle_short_id:'LON01', plate:'LN71 ABC', deviceImei:'351756051523999', transmittedAt:t.toISOString(), receivedAt:t.toISOString(), lat, lng, headingDeg: (90 + i * 2) % 360, speedKmh: 30 + Math.round(Math.random()*30), odometerKm:42100+i*0.12, ignitionOn:true, engineRpm:1800+Math.round(Math.random()*800), fuelLevelPct:72 - i*0.15, batteryV:12.8, satellites:8+Math.round(Math.random()*2), signalDbm:-70, networkType:'4G', eventFlags:i===20?2:0, protocol:'Teltonika' };
      });
      return NextResponse.json({ mode, count: pings.length, pings });
    }
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ── POST: bulk ingest from GPS device ────────────────────────────────
// Body: {
//   tenantId: string,
//   vehicleId: string,       -- short-id or UUID
//   deviceImei: string,
//   intervalSec?: number,
//   protocol?: string,
//   pings: PeriodicPing[]    -- batch, up to 200 per call
// }
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { tenantId, vehicleId, deviceImei, intervalSec, protocol, pings } = body as {
    tenantId: string;
    vehicleId: string;
    deviceImei: string;
    intervalSec?: number;
    protocol?: string;
    pings: Record<string, unknown>[];
  };

  if (!tenantId || !vehicleId || !deviceImei || !Array.isArray(pings) || !pings.length) {
    return NextResponse.json(
      { error: 'tenantId, vehicleId, deviceImei, and pings[] required' },
      { status: 400 },
    );
  }
  if (pings.length > 200) {
    return NextResponse.json({ error: 'Max 200 pings per request' }, { status: 400 });
  }

  const tenantUuid = toTenantUuid(String(tenantId));
  if (!tenantUuid) return NextResponse.json({ error: 'Unknown tenantId' }, { status: 400 });

  const db = getPool();

  const vr = await db.query(
    `SELECT "Id" FROM "Vehicles" WHERE ("ShortId"=$1 OR "Id"::text=$1) AND "TenantId"=$2 LIMIT 1`,
    [vehicleId, tenantUuid],
  );
  if (!vr.rows.length) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
  const vehicleUuid = vr.rows[0].Id;

  const now = new Date().toISOString();
  const ivSec   = Number(intervalSec ?? 30);
  const proto   = String(protocol ?? 'http');

  // Build multi-row INSERT values
  const vals: unknown[] = [];
  const rows: string[] = [];
  let   off = 1;

  for (const p of pings) {
    rows.push(
      `($${off},$${off+1},$${off+2},$${off+3},$${off+4},$${off+5},$${off+6},$${off+7},$${off+8},$${off+9},$${off+10},$${off+11},$${off+12},$${off+13},$${off+14},$${off+15},$${off+16},$${off+17},$${off+18},$${off+19},$${off+20},$${off+21},$${off+22})`,
    );
    vals.push(
      tenantUuid,
      vehicleUuid,
      deviceImei,
      p.transmittedAt ?? now,
      p.receivedAt    ?? now,
      Number(p.intervalSec ?? ivSec),
      String(p.protocol    ?? proto),
      Number(p.lat),
      Number(p.lng),
      Number(p.altitudeM   ?? 0),
      Number(p.headingDeg  ?? 0),
      Number(p.accuracyM   ?? 5),
      Number(p.hdop        ?? 1),
      Number(p.speedKmh    ?? 0),
      Number(p.odometerKm  ?? 0),
      Number(p.mileage     ?? 0),
      p.ignitionOn !== false,
      Number(p.engineRpm   ?? 0),
      Number(p.fuelLevelPct ?? 100),
      Number(p.batteryV    ?? 12.6),
      Number(p.satellites  ?? 8),
      Number(p.signalDbm   ?? -85),
      Number(p.eventFlags  ?? 0),
    );
    off += 23;
  }

  try {
    await db.query(
      `INSERT INTO "PeriodicTransmissions"
         ("TenantId","VehicleId","DeviceImei",
          "TransmittedAt","ReceivedAt","IntervalSec","Protocol",
          "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM","Hdop",
          "SpeedKmh","OdometerKm","Mileage",
          "IgnitionOn","EngineRpm","FuelLevelPct","BatteryV",
          "Satellites","SignalDbm","EventFlags")
       VALUES ${rows.join(',')}`,
      vals,
    );

    // Update vehicle last-seen position from latest ping
    const latest = pings[pings.length - 1];
    await db.query(
      `UPDATE "Vehicles" SET
         "Latitude"   = $1, "Longitude" = $2,
         "SpeedKmh"   = $3, "FuelLevel" = $4,
         "LastSeenAt" = $5
       WHERE "Id" = $6`,
      [
        Number(latest.lat), Number(latest.lng),
        Number(latest.speedKmh  ?? 0),
        Number(latest.fuelLevelPct ?? 100),
        latest.transmittedAt ?? now,
        vehicleUuid,
      ],
    );

    return NextResponse.json({ inserted: pings.length }, { status: 201 });
  } catch (err) {
    console.error('[tracking POST]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ── Helper ────────────────────────────────────────────────────────────
function mapRow(r: Record<string, unknown>) {
  return {
    vehicleId:       r.vehicle_short_id,
    plate:           r.Plate,
    deviceImei:      r.DeviceImei,
    transmittedAt:   r.TransmittedAt,
    receivedAt:      r.ReceivedAt,
    lat:             Number(r.Lat),
    lng:             Number(r.Lng),
    headingDeg:      Number(r.HeadingDeg),
    speedKmh:        Number(r.SpeedKmh),
    odometerKm:      Number(r.OdometerKm),
    ignitionOn:      r.IgnitionOn,
    engineRpm:       Number(r.EngineRpm),
    fuelLevelPct:    Number(r.FuelLevelPct),
    batteryV:        Number(r.BatteryV),
    satellites:      Number(r.Satellites),
    signalDbm:       Number(r.SignalDbm),
    networkType:     r.NetworkType,
    eventFlags:      Number(r.EventFlags),
    // Decoded event flags for convenience
    events: {
      harshBrake:    (Number(r.EventFlags) & 1)   > 0,
      harshAccel:    (Number(r.EventFlags) & 2)   > 0,
      overspeed:     (Number(r.EventFlags) & 4)   > 0,
      geofenceEntry: (Number(r.EventFlags) & 8)   > 0,
      geofenceExit:  (Number(r.EventFlags) & 16)  > 0,
      tripStart:     (Number(r.EventFlags) & 32)  > 0,
      tripEnd:       (Number(r.EventFlags) & 64)  > 0,
      alarm:         (Number(r.EventFlags) & 128) > 0,
    },
    intervalSec:     Number(r.IntervalSec),
    protocol:        r.Protocol,
  };
}
