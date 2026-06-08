-- =====================================================================
-- Migration 006: Bifurcated GPS Tracking
-- =====================================================================
-- Two parallel data streams keyed by TripId:
--
--   Stream A — GpsPings:   raw device transmissions (~30 s cadence)
--              every reading the GPS unit sends, stored verbatim
--
--   Stream B — TripStages: server-derived segment records
--              each contiguous block of driving / idle / stopped / parked
--
-- Trips table gets new timestamp + extended-metrics columns so the
-- trip header row can be the single source for quick lookups.
-- =====================================================================

-- ── GpsPings: raw device transmission log ────────────────────────────
CREATE TABLE IF NOT EXISTS "GpsPings" (
  "Id"            UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"      UUID             NOT NULL,
  "VehicleId"     UUID             NOT NULL,          -- FK → Vehicles.Id
  "TripId"        UUID,                               -- NULL before trip is opened
  "Sequence"      BIGINT           NOT NULL DEFAULT 0,-- device sequence number (gap detection)

  -- ── Bifurcation point: two independent clocks ──────────────────
  "TransmittedAt" TIMESTAMPTZ      NOT NULL,          -- device RTC when frame was sent
  "ReceivedAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(), -- server wall-clock on arrival

  -- ── Position ────────────────────────────────────────────────────
  "Lat"           DOUBLE PRECISION NOT NULL,
  "Lng"           DOUBLE PRECISION NOT NULL,
  "AltitudeM"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "HeadingDeg"    DOUBLE PRECISION NOT NULL DEFAULT 0,  -- 0–360 °
  "AccuracyM"     DOUBLE PRECISION NOT NULL DEFAULT 5,  -- GPS fix radius

  -- ── Motion ──────────────────────────────────────────────────────
  "SpeedKmh"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "OdometerKm"    DOUBLE PRECISION NOT NULL DEFAULT 0,

  -- ── Engine / power ──────────────────────────────────────────────
  "IgnitionOn"    BOOLEAN          NOT NULL DEFAULT TRUE,
  "EngineRpm"     INTEGER          NOT NULL DEFAULT 0,
  "FuelLevelPct"  DOUBLE PRECISION NOT NULL DEFAULT 100,
  "BatteryV"      DOUBLE PRECISION NOT NULL DEFAULT 12.6,

  -- ── Signal quality ──────────────────────────────────────────────
  "Satellites"    SMALLINT         NOT NULL DEFAULT 8,
  "SignalDbm"     SMALLINT         NOT NULL DEFAULT -85,

  -- ── Event flags (TRUE on the ping where the event occurred) ─────
  "HarshBrake"    BOOLEAN          NOT NULL DEFAULT FALSE,
  "HarshAccel"    BOOLEAN          NOT NULL DEFAULT FALSE,
  "Overspeed"     BOOLEAN          NOT NULL DEFAULT FALSE,
  "GeofenceEvent" TEXT,                               -- e.g. 'entry:GF-001'

  -- ── Full raw frame for extensibility / debugging ────────────────
  "RawPayload"    JSONB            NOT NULL DEFAULT '{}'
);

-- Time-series index: live feed, replay, and per-vehicle history
CREATE INDEX IF NOT EXISTS "idx_gpspings_tenant_vehicle_time"
  ON "GpsPings"("TenantId", "VehicleId", "TransmittedAt" DESC);

-- Trip replay: fetch all pings for a given trip in order
CREATE INDEX IF NOT EXISTS "idx_gpspings_trip"
  ON "GpsPings"("TripId", "TransmittedAt");

-- Ingest pipeline: recent-arrival window for duplicate detection
CREATE INDEX IF NOT EXISTS "idx_gpspings_received"
  ON "GpsPings"("ReceivedAt" DESC);


-- ── TripStages: server-derived segment records ────────────────────────
CREATE TABLE IF NOT EXISTS "TripStages" (
  "Id"                UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"          UUID             NOT NULL,
  "VehicleId"         UUID             NOT NULL,
  "TripId"            UUID             NOT NULL,
  "StageNo"           SMALLINT         NOT NULL DEFAULT 1,  -- 1-based ordinal in trip
  "Stage"             TEXT             NOT NULL,
    -- 'idle'    — engine on, speed = 0, before/after driving
    -- 'driving' — vehicle in motion
    -- 'stopped' — brief stop (traffic / junction), engine on
    -- 'parked'  — engine off

  -- ── Time window ─────────────────────────────────────────────────
  "StartAt"           TIMESTAMPTZ      NOT NULL,
  "EndAt"             TIMESTAMPTZ,                    -- NULL = currently active
  "DurationSec"       INTEGER          NOT NULL DEFAULT 0,

  -- ── Bounding positions ──────────────────────────────────────────
  "StartLat"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "StartLng"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "EndLat"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "EndLng"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "StartAddress"      TEXT,
  "EndAddress"        TEXT,

  -- ── Motion metrics for this segment ─────────────────────────────
  "DistanceKm"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "MaxSpeedKmh"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "AvgSpeedKmh"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "StartOdometerKm"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "EndOdometerKm"     DOUBLE PRECISION NOT NULL DEFAULT 0,

  -- ── Consumption ─────────────────────────────────────────────────
  "FuelConsumedL"     DOUBLE PRECISION NOT NULL DEFAULT 0,

  -- ── Event counts for this segment ───────────────────────────────
  "PingCount"         INTEGER          NOT NULL DEFAULT 0,
  "HarshBrakeCount"   SMALLINT         NOT NULL DEFAULT 0,
  "HarshAccelCount"   SMALLINT         NOT NULL DEFAULT 0,
  "OverspeedSec"      INTEGER          NOT NULL DEFAULT 0,

  "CreatedAt"         TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_tripstages_trip"
  ON "TripStages"("TripId", "StageNo");

CREATE INDEX IF NOT EXISTS "idx_tripstages_tenant_vehicle"
  ON "TripStages"("TenantId", "VehicleId", "StartAt" DESC);


-- ── Trips: add timestamp + extended-metric columns ───────────────────
ALTER TABLE "Trips"
  ADD COLUMN IF NOT EXISTS "StartAt"         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "EndAt"           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "StartLat"        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "StartLng"        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "EndLat"          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "EndLng"          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "StartOdometerKm" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "EndOdometerKm"   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "EngineHoursSec"  INTEGER,
  ADD COLUMN IF NOT EXISTS "IdleTimeSec"     INTEGER  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "StoppedTimeSec"  INTEGER  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "HarshBrakeCount" SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "HarshAccelCount" SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "OverspeedSec"    INTEGER  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "CO2Grams"        INTEGER,
  ADD COLUMN IF NOT EXISTS "StageCount"      SMALLINT DEFAULT 0;


-- =====================================================================
-- Seed: generate GPS pings + trip stages for all existing trips
-- =====================================================================
DO $$
DECLARE
  r_trip      RECORD;
  r_veh       RECORD;
  v_route     JSONB;
  v_points    INTEGER;
  v_pt_a      JSONB;
  v_pt_b      JSONB;
  i           INTEGER;
  j           INTEGER;

  -- trip-level
  v_trip_uuid       UUID;
  v_tenant_uuid     UUID;
  v_vehicle_uuid    UUID;
  v_date_base       DATE;
  v_start_at        TIMESTAMPTZ;
  v_end_at          TIMESTAMPTZ;
  v_start_lat       DOUBLE PRECISION;
  v_start_lng       DOUBLE PRECISION;
  v_end_lat         DOUBLE PRECISION;
  v_end_lng         DOUBLE PRECISION;
  v_base_odometer   DOUBLE PRECISION;

  -- segment interpolation
  v_seg_start_at    TIMESTAMPTZ;
  v_seg_end_at      TIMESTAMPTZ;
  v_seg_secs        INTEGER;
  v_seg_pings       INTEGER;
  v_lat_a           DOUBLE PRECISION;
  v_lng_a           DOUBLE PRECISION;
  v_lat_b           DOUBLE PRECISION;
  v_lng_b           DOUBLE PRECISION;
  v_speed_a         DOUBLE PRECISION;
  v_speed_b         DOUBLE PRECISION;
  v_lat_k           DOUBLE PRECISION;
  v_lng_k           DOUBLE PRECISION;
  v_speed_k         DOUBLE PRECISION;
  v_heading_k       DOUBLE PRECISION;
  v_odo_k           DOUBLE PRECISION;
  v_fuel_k          DOUBLE PRECISION;
  v_ping_at         TIMESTAMPTZ;
  v_frac            DOUBLE PRECISION;
  v_seq             BIGINT;

  -- stage tracking
  v_stage_no        SMALLINT;
  v_stage           TEXT;
  v_stage_start_at  TIMESTAMPTZ;
  v_stage_start_lat DOUBLE PRECISION;
  v_stage_start_lng DOUBLE PRECISION;
  v_stage_start_odo DOUBLE PRECISION;
  v_stage_max_spd   DOUBLE PRECISION;
  v_stage_spd_sum   DOUBLE PRECISION;
  v_stage_ping_cnt  INTEGER;
  v_stage_dist      DOUBLE PRECISION;
  v_stage_fuel      DOUBLE PRECISION;
  v_stage_hb        SMALLINT;
  v_stage_ha        SMALLINT;
  v_stage_ovs       INTEGER;
  v_prev_odo        DOUBLE PRECISION;

  -- events
  v_event_text      TEXT;
  v_harsh_brake     BOOLEAN;
  v_harsh_accel     BOOLEAN;
  v_overspeed       BOOLEAN;

BEGIN
  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM "GpsPings" LIMIT 1) THEN
    RAISE NOTICE 'GpsPings already seeded – skipping.';
    RETURN;
  END IF;

  FOR r_trip IN
    SELECT
      t."Id", t."ShortId", t."VehicleShortId", t."TenantId",
      t."DateIso", t."Date",
      t."DistanceKm", t."DurationMin", t."FuelUsedL",
      t."RouteJson"::jsonb AS route
    FROM "Trips" t
    ORDER BY t."DateIso", t."Date"
  LOOP
    -- Resolve vehicle UUID
    SELECT "Id", "TenantId" INTO r_veh
      FROM "Vehicles"
     WHERE "ShortId" = r_trip."VehicleShortId"
     LIMIT 1;

    IF r_veh."Id" IS NULL THEN
      RAISE NOTICE 'No vehicle for trip %', r_trip."ShortId";
      CONTINUE;
    END IF;

    v_trip_uuid    := r_trip."Id";
    v_tenant_uuid  := r_veh."TenantId";
    v_vehicle_uuid := r_veh."Id";
    v_route        := r_trip.route;
    v_points       := jsonb_array_length(v_route);

    IF v_points < 2 THEN CONTINUE; END IF;

    -- Parse trip start timestamp from DateIso + first waypoint time
    v_date_base   := r_trip."DateIso"::DATE;
    v_pt_a        := v_route -> 0;
    v_start_lat   := (v_pt_a ->> 'lat')::DOUBLE PRECISION;
    v_start_lng   := (v_pt_a ->> 'lng')::DOUBLE PRECISION;
    v_start_at    := (r_trip."DateIso" || ' ' ||
                      COALESCE(v_pt_a ->> 'time', '06:00') ||
                      ':00+03:00')::TIMESTAMPTZ;

    v_pt_b        := v_route -> (v_points - 1);
    v_end_lat     := (v_pt_b ->> 'lat')::DOUBLE PRECISION;
    v_end_lng     := (v_pt_b ->> 'lng')::DOUBLE PRECISION;
    v_end_at      := v_start_at + (r_trip."DurationMin" || ' minutes')::INTERVAL;

    -- Deterministic base odometer from trip ShortId hash
    v_base_odometer := 50000 + (hashtext(r_trip."ShortId") & 65535);

    -- Update Trips header row with new columns
    UPDATE "Trips" SET
      "StartAt"         = v_start_at,
      "EndAt"           = v_end_at,
      "StartLat"        = v_start_lat,
      "StartLng"        = v_start_lng,
      "EndLat"          = v_end_lat,
      "EndLng"          = v_end_lng,
      "StartOdometerKm" = v_base_odometer,
      "EndOdometerKm"   = v_base_odometer + r_trip."DistanceKm",
      "EngineHoursSec"  = r_trip."DurationMin" * 60 + 600,
      "IdleTimeSec"     = 300,
      "StoppedTimeSec"  = 120,
      "HarshBrakeCount" = 2,
      "HarshAccelCount" = 1,
      "OverspeedSec"    = 90,
      "CO2Grams"        = ROUND(r_trip."FuelUsedL" * 2640),
      "StageCount"      = (v_points - 1) + 2  -- driving segments + idle bookends
    WHERE "Id" = v_trip_uuid;

    -- ── Stage tracking initialisation ────────────────────────────
    v_stage_no   := 1;
    v_stage      := 'idle';
    v_stage_start_at  := v_start_at;
    v_stage_start_lat := v_start_lat;
    v_stage_start_lng := v_start_lng;
    v_stage_start_odo := v_base_odometer;
    v_stage_max_spd   := 0;
    v_stage_spd_sum   := 0;
    v_stage_ping_cnt  := 0;
    v_stage_dist      := 0;
    v_stage_fuel      := 0;
    v_stage_hb        := 0;
    v_stage_ha        := 0;
    v_stage_ovs       := 0;
    v_prev_odo        := v_base_odometer;
    v_seq             := 1;
    v_odo_k           := v_base_odometer;
    v_fuel_k          := 80 + (hashtext(r_trip."ShortId" || 'f') & 15);  -- 80-95 %

    -- ── Emit initial IDLE stage (30 s warm-up at depot) ──────────
    INSERT INTO "GpsPings" (
      "TenantId","VehicleId","TripId","Sequence",
      "TransmittedAt","ReceivedAt",
      "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM",
      "SpeedKmh","OdometerKm","IgnitionOn","EngineRpm",
      "FuelLevelPct","BatteryV","Satellites","SignalDbm",
      "HarshBrake","HarshAccel","Overspeed",
      "RawPayload"
    ) VALUES (
      v_tenant_uuid, v_vehicle_uuid, v_trip_uuid, v_seq,
      v_start_at, v_start_at + INTERVAL '1 second',
      v_start_lat, v_start_lng, 1420, 0, 4,
      0, v_odo_k, TRUE, 800,
      v_fuel_k, 13.8, 9, -78,
      FALSE, FALSE, FALSE,
      jsonb_build_object('src','seed','stage','idle_start')
    );
    v_seq := v_seq + 1;
    v_stage_ping_cnt := v_stage_ping_cnt + 1;

    -- ── Iterate over waypoint segments ────────────────────────────
    FOR i IN 0 .. v_points - 2 LOOP
      v_pt_a   := v_route -> i;
      v_pt_b   := v_route -> (i + 1);

      v_lat_a  := (v_pt_a ->> 'lat')::DOUBLE PRECISION;
      v_lng_a  := (v_pt_a ->> 'lng')::DOUBLE PRECISION;
      v_lat_b  := (v_pt_b ->> 'lat')::DOUBLE PRECISION;
      v_lng_b  := (v_pt_b ->> 'lng')::DOUBLE PRECISION;
      v_speed_a := GREATEST((v_pt_a ->> 'speed')::DOUBLE PRECISION, 0);
      v_speed_b := GREATEST((v_pt_b ->> 'speed')::DOUBLE PRECISION, 0);

      -- Convert HH:MM waypoint times to absolute timestamps
      v_seg_start_at := (r_trip."DateIso" || ' ' ||
                         COALESCE(v_pt_a ->> 'time', '06:00') ||
                         ':00+03:00')::TIMESTAMPTZ;
      v_seg_end_at   := (r_trip."DateIso" || ' ' ||
                         COALESCE(v_pt_b ->> 'time', '06:00') ||
                         ':00+03:00')::TIMESTAMPTZ;

      -- Guard against same-minute waypoints or reversed time
      IF v_seg_end_at <= v_seg_start_at THEN
        v_seg_end_at := v_seg_start_at + INTERVAL '5 minutes';
      END IF;

      v_seg_secs  := EXTRACT(EPOCH FROM (v_seg_end_at - v_seg_start_at))::INTEGER;
      v_seg_pings := GREATEST(FLOOR(v_seg_secs::NUMERIC / 30), 1)::INTEGER;

      -- Detect stage transition: idle→driving or driving→stopped
      IF v_speed_a > 5 OR v_speed_b > 5 THEN
        IF v_stage <> 'driving' THEN
          -- Close current idle/stopped stage
          INSERT INTO "TripStages" (
            "TenantId","VehicleId","TripId","StageNo","Stage",
            "StartAt","EndAt","DurationSec",
            "StartLat","StartLng","EndLat","EndLng",
            "StartAddress","EndAddress",
            "DistanceKm","MaxSpeedKmh","AvgSpeedKmh",
            "StartOdometerKm","EndOdometerKm",
            "FuelConsumedL","PingCount",
            "HarshBrakeCount","HarshAccelCount","OverspeedSec"
          ) VALUES (
            v_tenant_uuid, v_vehicle_uuid, v_trip_uuid, v_stage_no, v_stage,
            v_stage_start_at, v_seg_start_at,
            EXTRACT(EPOCH FROM (v_seg_start_at - v_stage_start_at))::INTEGER,
            v_stage_start_lat, v_stage_start_lng, v_lat_a, v_lng_a,
            v_pt_a ->> 'event', NULL,
            0, 0, 0,
            v_stage_start_odo, v_stage_start_odo,
            0, v_stage_ping_cnt,
            0, 0, 0
          );
          v_stage_no        := v_stage_no + 1;
          v_stage           := 'driving';
          v_stage_start_at  := v_seg_start_at;
          v_stage_start_lat := v_lat_a;
          v_stage_start_lng := v_lng_a;
          v_stage_start_odo := v_odo_k;
          v_stage_max_spd   := 0;
          v_stage_spd_sum   := 0;
          v_stage_ping_cnt  := 0;
          v_stage_dist      := 0;
          v_stage_fuel      := 0;
          v_stage_hb        := 0;
          v_stage_ha        := 0;
          v_stage_ovs       := 0;
        END IF;
      ELSE
        IF v_stage = 'driving' THEN
          -- Close driving stage, open stopped
          INSERT INTO "TripStages" (
            "TenantId","VehicleId","TripId","StageNo","Stage",
            "StartAt","EndAt","DurationSec",
            "StartLat","StartLng","EndLat","EndLng",
            "DistanceKm","MaxSpeedKmh","AvgSpeedKmh",
            "StartOdometerKm","EndOdometerKm",
            "FuelConsumedL","PingCount",
            "HarshBrakeCount","HarshAccelCount","OverspeedSec"
          ) VALUES (
            v_tenant_uuid, v_vehicle_uuid, v_trip_uuid, v_stage_no, 'driving',
            v_stage_start_at, v_seg_start_at,
            EXTRACT(EPOCH FROM (v_seg_start_at - v_stage_start_at))::INTEGER,
            v_stage_start_lat, v_stage_start_lng, v_lat_a, v_lng_a,
            ROUND(v_stage_dist::NUMERIC, 2),
            ROUND(v_stage_max_spd::NUMERIC, 1),
            CASE WHEN v_stage_ping_cnt > 0
                 THEN ROUND((v_stage_spd_sum / v_stage_ping_cnt)::NUMERIC, 1) ELSE 0 END,
            v_stage_start_odo, v_odo_k,
            ROUND(v_stage_fuel::NUMERIC, 3),
            v_stage_ping_cnt,
            v_stage_hb, v_stage_ha, v_stage_ovs
          );
          v_stage_no        := v_stage_no + 1;
          v_stage           := 'stopped';
          v_stage_start_at  := v_seg_start_at;
          v_stage_start_lat := v_lat_a;
          v_stage_start_lng := v_lng_a;
          v_stage_start_odo := v_odo_k;
          v_stage_max_spd   := 0;
          v_stage_spd_sum   := 0;
          v_stage_ping_cnt  := 0;
          v_stage_dist      := 0;
          v_stage_fuel      := 0;
          v_stage_hb        := 0;
          v_stage_ha        := 0;
          v_stage_ovs       := 0;
        END IF;
      END IF;

      -- ── Generate GPS pings along this waypoint segment ──────────
      FOR j IN 0 .. v_seg_pings - 1 LOOP
        v_frac   := j::DOUBLE PRECISION / GREATEST(v_seg_pings, 1);
        v_lat_k  := v_lat_a + (v_lat_b - v_lat_a) * v_frac;
        v_lng_k  := v_lng_a + (v_lng_b - v_lng_a) * v_frac;
        v_speed_k := v_speed_a + (v_speed_b - v_speed_a) * v_frac
                    + SIN(j * 0.7) * 3;  -- gentle variation
        v_speed_k := GREATEST(v_speed_k, 0);

        -- Bearing approximation (degrees)
        v_heading_k := DEGREES(ATAN2(
          v_lng_b - v_lng_a,
          v_lat_b - v_lat_a
        ));
        IF v_heading_k < 0 THEN v_heading_k := v_heading_k + 360; END IF;

        -- Odometer: advance by distance increment
        v_odo_k := v_odo_k + (v_speed_k * 30 / 3600.0);

        -- Fuel: decrease based on speed
        v_fuel_k := GREATEST(v_fuel_k - (v_speed_k * 0.0004), 5);

        v_ping_at := v_seg_start_at + ((j * 30) || ' seconds')::INTERVAL;

        -- Sparse event generation (deterministic via seq mod)
        v_harsh_brake := (v_seq % 120 = 0) AND v_speed_k > 40;
        v_harsh_accel := (v_seq % 180 = 0) AND v_speed_k > 20;
        v_overspeed   := v_speed_k > 90;

        INSERT INTO "GpsPings" (
          "TenantId","VehicleId","TripId","Sequence",
          "TransmittedAt","ReceivedAt",
          "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM",
          "SpeedKmh","OdometerKm","IgnitionOn","EngineRpm",
          "FuelLevelPct","BatteryV","Satellites","SignalDbm",
          "HarshBrake","HarshAccel","Overspeed",
          "RawPayload"
        ) VALUES (
          v_tenant_uuid, v_vehicle_uuid, v_trip_uuid, v_seq,
          v_ping_at, v_ping_at + INTERVAL '2 seconds',
          ROUND(v_lat_k::NUMERIC, 6),
          ROUND(v_lng_k::NUMERIC, 6),
          1420 + SIN(v_seq * 0.1) * 5,
          ROUND(v_heading_k::NUMERIC, 1),
          3 + (v_seq % 3),
          ROUND(v_speed_k::NUMERIC, 1),
          ROUND(v_odo_k::NUMERIC, 3),
          TRUE,
          CASE WHEN v_speed_k < 5 THEN 750 + (v_seq % 100)
               ELSE 1800 + (v_seq % 800) END,
          ROUND(v_fuel_k::NUMERIC, 1),
          13.4 + (v_seq % 5) * 0.1,
          7 + (v_seq % 4),
          -82 + (v_seq % 12),
          v_harsh_brake, v_harsh_accel, v_overspeed,
          jsonb_build_object(
            'src', 'seed',
            'seg', i,
            'frac', ROUND(v_frac::NUMERIC, 3)
          )
        );

        -- Accumulate stage metrics
        v_stage_ping_cnt := v_stage_ping_cnt + 1;
        v_stage_spd_sum  := v_stage_spd_sum + v_speed_k;
        IF v_speed_k > v_stage_max_spd THEN v_stage_max_spd := v_speed_k; END IF;
        v_stage_dist     := v_stage_dist + (v_speed_k * 30 / 3600.0);
        v_stage_fuel     := v_stage_fuel + (v_speed_k * 0.0004);
        IF v_harsh_brake THEN v_stage_hb := v_stage_hb + 1; END IF;
        IF v_harsh_accel THEN v_stage_ha := v_stage_ha + 1; END IF;
        IF v_overspeed   THEN v_stage_ovs := v_stage_ovs + 30; END IF;

        v_seq := v_seq + 1;
      END LOOP;  -- pings
    END LOOP;  -- waypoint segments

    -- ── Close final stage (idle at destination) ─────────────────
    v_pt_b := v_route -> (v_points - 1);

    IF v_stage = 'driving' THEN
      INSERT INTO "TripStages" (
        "TenantId","VehicleId","TripId","StageNo","Stage",
        "StartAt","EndAt","DurationSec",
        "StartLat","StartLng","EndLat","EndLng",
        "StartAddress","EndAddress",
        "DistanceKm","MaxSpeedKmh","AvgSpeedKmh",
        "StartOdometerKm","EndOdometerKm",
        "FuelConsumedL","PingCount",
        "HarshBrakeCount","HarshAccelCount","OverspeedSec"
      ) VALUES (
        v_tenant_uuid, v_vehicle_uuid, v_trip_uuid, v_stage_no, 'driving',
        v_stage_start_at, v_end_at,
        EXTRACT(EPOCH FROM (v_end_at - v_stage_start_at))::INTEGER,
        v_stage_start_lat, v_stage_start_lng, v_end_lat, v_end_lng,
        NULL, v_pt_b ->> 'event',
        ROUND(v_stage_dist::NUMERIC, 2),
        ROUND(v_stage_max_spd::NUMERIC, 1),
        CASE WHEN v_stage_ping_cnt > 0
             THEN ROUND((v_stage_spd_sum / v_stage_ping_cnt)::NUMERIC, 1) ELSE 0 END,
        v_stage_start_odo, v_odo_k,
        ROUND(v_stage_fuel::NUMERIC, 3),
        v_stage_ping_cnt,
        v_stage_hb, v_stage_ha, v_stage_ovs
      );
      v_stage_no := v_stage_no + 1;
    END IF;

    -- Final arrival idle ping
    INSERT INTO "GpsPings" (
      "TenantId","VehicleId","TripId","Sequence",
      "TransmittedAt","ReceivedAt",
      "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM",
      "SpeedKmh","OdometerKm","IgnitionOn","EngineRpm",
      "FuelLevelPct","BatteryV","Satellites","SignalDbm",
      "HarshBrake","HarshAccel","Overspeed",
      "RawPayload"
    ) VALUES (
      v_tenant_uuid, v_vehicle_uuid, v_trip_uuid, v_seq,
      v_end_at, v_end_at + INTERVAL '1 second',
      v_end_lat, v_end_lng, 1420, 0, 4,
      0, ROUND(v_odo_k::NUMERIC, 3), TRUE, 800,
      ROUND(v_fuel_k::NUMERIC, 1), 13.8, 9, -78,
      FALSE, FALSE, FALSE,
      jsonb_build_object('src','seed','stage','idle_end', 'event', v_pt_b ->> 'event')
    );

    -- Arrival idle stage
    INSERT INTO "TripStages" (
      "TenantId","VehicleId","TripId","StageNo","Stage",
      "StartAt","EndAt","DurationSec",
      "StartLat","StartLng","EndLat","EndLng",
      "StartAddress","EndAddress",
      "DistanceKm","MaxSpeedKmh","AvgSpeedKmh",
      "StartOdometerKm","EndOdometerKm",
      "FuelConsumedL","PingCount",
      "HarshBrakeCount","HarshAccelCount","OverspeedSec"
    ) VALUES (
      v_tenant_uuid, v_vehicle_uuid, v_trip_uuid, v_stage_no, 'idle',
      v_end_at, v_end_at + INTERVAL '5 minutes', 300,
      v_end_lat, v_end_lng, v_end_lat, v_end_lng,
      v_pt_b ->> 'event', v_pt_b ->> 'event',
      0, 0, 0,
      ROUND(v_odo_k::NUMERIC, 3), ROUND(v_odo_k::NUMERIC, 3),
      0, 1, 0, 0, 0
    );

    RAISE NOTICE 'Trip % → % pings, % stages',
      r_trip."ShortId", v_seq, v_stage_no;
  END LOOP;  -- trips

  RAISE NOTICE 'Migration 006 OK';
END $$;
