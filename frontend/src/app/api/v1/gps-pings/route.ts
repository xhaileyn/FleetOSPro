import { NextRequest, NextResponse } from 'next/server';
import { getPool, TENANT_UUID } from '@/lib/pgDb';

// ── GET: fetch pings for a trip or live vehicle feed ─────────────────
export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams;
  const tenantId  = sp.get('tenantId') ?? '1';
  const tripId    = sp.get('tripId');         // filter by trip (playback)
  const vehicleId = sp.get('vehicleId');      // filter by vehicle (live)
  const since     = sp.get('since');          // ISO timestamp – live feed cursor
  const limit     = Math.min(Number(sp.get('limit') ?? '500'), 5000);

  const tenantUuid = TENANT_UUID[tenantId];
  if (!tenantUuid) {
    return NextResponse.json({ error: 'Unknown tenantId' }, { status: 400 });
  }
  if (!tripId && !vehicleId) {
    return NextResponse.json({ error: 'tripId or vehicleId required' }, { status: 400 });
  }

  try {
    const db     = getPool();
    const params: unknown[] = [tenantUuid];
    const wheres = [`p."TenantId" = $1`];

    if (tripId) {
      // Resolve short-id or UUID
      const tripRow = await db.query(
        `SELECT "Id" FROM "Trips" WHERE ("ShortId"=$1 OR "Id"::text=$1) AND "TenantId"=$2 LIMIT 1`,
        [tripId, tenantUuid],
      );
      if (!tripRow.rows.length) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
      params.push(tripRow.rows[0].Id);
      wheres.push(`p."TripId" = $${params.length}`);
    }

    if (vehicleId) {
      const vehRow = await db.query(
        `SELECT "Id" FROM "Vehicles" WHERE ("ShortId"=$1 OR "Id"::text=$1) AND "TenantId"=$2 LIMIT 1`,
        [vehicleId, tenantUuid],
      );
      if (!vehRow.rows.length) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      params.push(vehRow.rows[0].Id);
      wheres.push(`p."VehicleId" = $${params.length}`);
    }

    if (since) {
      params.push(since);
      wheres.push(`p."TransmittedAt" > $${params.length}`);
    }

    const query = `
      SELECT
        p."Id",
        p."Sequence",
        p."TransmittedAt",
        p."ReceivedAt",
        p."Lat",
        p."Lng",
        p."AltitudeM",
        p."HeadingDeg",
        p."AccuracyM",
        p."SpeedKmh",
        p."OdometerKm",
        p."IgnitionOn",
        p."EngineRpm",
        p."FuelLevelPct",
        p."BatteryV",
        p."Satellites",
        p."SignalDbm",
        p."HarshBrake",
        p."HarshAccel",
        p."Overspeed",
        p."GeofenceEvent"
      FROM "GpsPings" p
      WHERE ${wheres.join(' AND ')}
      ORDER BY p."TransmittedAt" ASC
      LIMIT $${params.length + 1}`;
    params.push(limit);

    const { rows } = await db.query(query, params);

    return NextResponse.json({
      count: rows.length,
      pings: rows.map(r => ({
        id:           r.Id,
        seq:          Number(r.Sequence),
        transmittedAt: r.TransmittedAt,
        receivedAt:   r.ReceivedAt,
        lat:          Number(r.Lat),
        lng:          Number(r.Lng),
        altitudeM:    Number(r.AltitudeM),
        headingDeg:   Number(r.HeadingDeg),
        accuracyM:    Number(r.AccuracyM),
        speedKmh:     Number(r.SpeedKmh),
        odometerKm:   Number(r.OdometerKm),
        ignitionOn:   r.IgnitionOn,
        engineRpm:    Number(r.EngineRpm),
        fuelLevelPct: Number(r.FuelLevelPct),
        batteryV:     Number(r.BatteryV),
        satellites:   Number(r.Satellites),
        signalDbm:    Number(r.SignalDbm),
        harshBrake:   r.HarshBrake,
        harshAccel:   r.HarshAccel,
        overspeed:    r.Overspeed,
        geofenceEvent: r.GeofenceEvent ?? null,
      })),
    });
  } catch (err) {
    console.error('[gps-pings GET]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ── POST: ingest one or more pings from a GPS device ─────────────────
// Body: { tenantId, vehicleId, pings: PingPayload[] }
// Each PingPayload mirrors the GpsPings columns (camelCase).
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { tenantId, vehicleId, pings } = body as {
    tenantId: string;
    vehicleId: string;
    pings: Record<string, unknown>[];
  };

  if (!tenantId || !vehicleId || !Array.isArray(pings) || !pings.length) {
    return NextResponse.json({ error: 'tenantId, vehicleId, and pings[] required' }, { status: 400 });
  }

  const tenantUuid = TENANT_UUID[String(tenantId)];
  if (!tenantUuid) {
    return NextResponse.json({ error: 'Unknown tenantId' }, { status: 400 });
  }

  try {
    const db = getPool();

    // Resolve vehicle UUID
    const vehRow = await db.query(
      `SELECT "Id" FROM "Vehicles" WHERE ("ShortId"=$1 OR "Id"::text=$1) AND "TenantId"=$2 LIMIT 1`,
      [vehicleId, tenantUuid],
    );
    if (!vehRow.rows.length) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    const vehicleUuid = vehRow.rows[0].Id;

    // Resolve optional tripId (short-id or UUID)
    const tripId = pings[0]?.tripId as string | undefined;
    let tripUuid: string | null = null;
    if (tripId) {
      const tripRow = await db.query(
        `SELECT "Id" FROM "Trips" WHERE ("ShortId"=$1 OR "Id"::text=$1) AND "TenantId"=$2 LIMIT 1`,
        [tripId, tenantUuid],
      );
      tripUuid = tripRow.rows[0]?.Id ?? null;
    }

    // Bulk insert — build VALUES list
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let offset = 1;

    for (const p of pings) {
      placeholders.push(
        `($${offset},$${offset+1},$${offset+2},$${offset+3},$${offset+4},$${offset+5},$${offset+6},$${offset+7},$${offset+8},$${offset+9},$${offset+10},$${offset+11},$${offset+12},$${offset+13},$${offset+14},$${offset+15},$${offset+16},$${offset+17},$${offset+18},$${offset+19},$${offset+20},$${offset+21})`,
      );
      values.push(
        tenantUuid,
        vehicleUuid,
        tripUuid ?? null,
        Number(p.seq ?? 0),
        p.transmittedAt ?? new Date().toISOString(),
        new Date().toISOString(),
        Number(p.lat),
        Number(p.lng),
        Number(p.altitudeM ?? 0),
        Number(p.headingDeg ?? 0),
        Number(p.accuracyM ?? 5),
        Number(p.speedKmh ?? 0),
        Number(p.odometerKm ?? 0),
        p.ignitionOn !== false,
        Number(p.engineRpm ?? 0),
        Number(p.fuelLevelPct ?? 100),
        Number(p.batteryV ?? 12.6),
        Number(p.satellites ?? 8),
        Number(p.signalDbm ?? -85),
        Boolean(p.harshBrake),
        Boolean(p.harshAccel),
        Boolean(p.overspeed),
      );
      offset += 22;
    }

    await db.query(
      `INSERT INTO "GpsPings"
         ("TenantId","VehicleId","TripId","Sequence",
          "TransmittedAt","ReceivedAt",
          "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM",
          "SpeedKmh","OdometerKm","IgnitionOn","EngineRpm",
          "FuelLevelPct","BatteryV","Satellites","SignalDbm",
          "HarshBrake","HarshAccel","Overspeed")
       VALUES ${placeholders.join(',')}`,
      values,
    );

    // Update Vehicles.LastSeenAt and position from most recent ping
    const latest = pings[pings.length - 1];
    await db.query(
      `UPDATE "Vehicles" SET
         "Latitude"    = $1,
         "Longitude"   = $2,
         "SpeedKmh"    = $3,
         "FuelLevel"   = $4,
         "LastSeenAt"  = $5
       WHERE "Id" = $6`,
      [
        Number(latest.lat),
        Number(latest.lng),
        Number(latest.speedKmh ?? 0),
        Number(latest.fuelLevelPct ?? 100),
        latest.transmittedAt ?? new Date().toISOString(),
        vehicleUuid,
      ],
    );

    return NextResponse.json({ inserted: pings.length }, { status: 201 });
  } catch (err) {
    console.error('[gps-pings POST]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
