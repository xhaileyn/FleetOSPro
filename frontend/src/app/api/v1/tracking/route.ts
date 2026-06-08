import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID } from '@/lib/pgDb';

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

  const tenantUuid = TENANT_UUID[tenantId];
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

  const tenantUuid = TENANT_UUID[String(tenantId)];
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
