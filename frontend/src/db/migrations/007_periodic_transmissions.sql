-- =====================================================================
-- Migration 007: PeriodicTransmissions
-- =====================================================================
-- Purpose: high-throughput store for every raw GPS frame a device
-- sends at its configured interval (typically 30 s while driving,
-- configurable down to 5 s during events).
--
-- Design choices vs GpsPings:
--   • BIGSERIAL PK       — sequential inserts; no UUID gen overhead
--   • No FK constraints  — omitted on the hot write path for speed
--   • REAL for scalars   — 4 bytes vs 8 for speed/fuel (sufficient)
--   • EventFlags bitmask — one SMALLINT instead of N boolean columns
--   • Range-partitioned by TransmittedAt (monthly)
--       → old partitions can be detached / archived without table lock
--       → partition pruning keeps live queries fast
--   • Partial indexes on IgnitionOn — live-map queries filter active
--
-- EventFlags bitmask:
--   bit 0  (  1)  HarshBrake
--   bit 1  (  2)  HarshAcceleration
--   bit 2  (  4)  Overspeed
--   bit 3  (  8)  GeofenceEntry
--   bit 4  ( 16)  GeofenceExit
--   bit 5  ( 32)  TripStart     (first ignition-on ping after off)
--   bit 6  ( 64)  TripEnd       (last ping before ignition off)
--   bit 7  (128)  Tamper / Alarm
-- =====================================================================

-- ── Parent (partitioned) table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PeriodicTransmissions" (
  -- BIGSERIAL: sequential, 8-byte PK — better insert perf than UUID
  "Id"              BIGSERIAL        NOT NULL,

  -- ── Identity ────────────────────────────────────────────────────
  "TenantId"        UUID             NOT NULL,
  "VehicleId"       UUID             NOT NULL,   -- no FK → write speed
  "DeviceImei"      TEXT             NOT NULL,   -- 15-digit IMEI or serial

  -- ── Dual-clock timestamps ────────────────────────────────────────
  -- Bifurcation point: device RTC vs server wall-clock captures
  -- transmission lag, clock drift, and network jitter independently.
  "TransmittedAt"   TIMESTAMPTZ      NOT NULL,   -- partition key (device)
  "ReceivedAt"      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  -- ── Transmission meta ───────────────────────────────────────────
  "IntervalSec"     SMALLINT         NOT NULL DEFAULT 30,
  "Protocol"        TEXT             NOT NULL DEFAULT 'http',
    -- 'http' | 'mqtt' | 'tcp-gt06' | 'tcp-concox' | 'teltonika' | 'comet'

  -- ── Position ────────────────────────────────────────────────────
  "Lat"             DOUBLE PRECISION NOT NULL,
  "Lng"             DOUBLE PRECISION NOT NULL,
  "AltitudeM"       SMALLINT         NOT NULL DEFAULT 0,
  "HeadingDeg"      SMALLINT         NOT NULL DEFAULT 0,   -- 0–360 °
  "AccuracyM"       SMALLINT         NOT NULL DEFAULT 5,
  "Hdop"            REAL             NOT NULL DEFAULT 1.0,

  -- ── Motion ──────────────────────────────────────────────────────
  "SpeedKmh"        REAL             NOT NULL DEFAULT 0,
  "OdometerKm"      REAL             NOT NULL DEFAULT 0,
  "Mileage"         REAL             NOT NULL DEFAULT 0,   -- trip sub-counter

  -- ── Engine / power ──────────────────────────────────────────────
  "IgnitionOn"      BOOLEAN          NOT NULL DEFAULT TRUE,
  "EngineRpm"       SMALLINT         NOT NULL DEFAULT 0,
  "FuelLevelPct"    SMALLINT         NOT NULL DEFAULT 0,   -- 0–100 whole %
  "FuelConsRateL"   REAL             NOT NULL DEFAULT 0,   -- instantaneous L/h
  "BatteryV"        REAL             NOT NULL DEFAULT 12.6,
  "ExternalPower"   BOOLEAN          NOT NULL DEFAULT TRUE,

  -- ── Environmental ───────────────────────────────────────────────
  "TemperatureC"    REAL,                                  -- cab / cargo temp
  "HumidityPct"     SMALLINT,

  -- ── Signal quality ──────────────────────────────────────────────
  "Satellites"      SMALLINT         NOT NULL DEFAULT 0,
  "SignalDbm"       SMALLINT         NOT NULL DEFAULT 0,
  "NetworkType"     TEXT             NOT NULL DEFAULT '4G',

  -- ── Event flags (bitmask, see header) ───────────────────────────
  "EventFlags"      SMALLINT         NOT NULL DEFAULT 0,

  -- ── Geofence reference ──────────────────────────────────────────
  "GeofenceId"      TEXT,

  PRIMARY KEY ("Id", "TransmittedAt")   -- partition key must be in PK
) PARTITION BY RANGE ("TransmittedAt");


-- ── Monthly partitions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PeriodicTransmissions_2026_04"
  PARTITION OF "PeriodicTransmissions"
  FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS "PeriodicTransmissions_2026_05"
  PARTITION OF "PeriodicTransmissions"
  FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS "PeriodicTransmissions_2026_06"
  PARTITION OF "PeriodicTransmissions"
  FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS "PeriodicTransmissions_2026_07"
  PARTITION OF "PeriodicTransmissions"
  FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS "PeriodicTransmissions_default"
  PARTITION OF "PeriodicTransmissions"
  DEFAULT;


-- ── Indexes (auto-propagated to all partitions) ───────────────────────

-- Primary live-tracking: latest position per vehicle
CREATE INDEX IF NOT EXISTS "idx_periodic_tenant_vehicle_time"
  ON "PeriodicTransmissions" ("TenantId", "VehicleId", "TransmittedAt" DESC);

-- Recent-arrival deduplication window
CREATE INDEX IF NOT EXISTS "idx_periodic_received"
  ON "PeriodicTransmissions" ("ReceivedAt" DESC);

-- Event queries: flag-filtered analytics
CREATE INDEX IF NOT EXISTS "idx_periodic_events"
  ON "PeriodicTransmissions" ("TenantId", "TransmittedAt" DESC)
  WHERE "EventFlags" > 0;

-- Live map: only ignition-on rows (skips parked vehicles)
CREATE INDEX IF NOT EXISTS "idx_periodic_live"
  ON "PeriodicTransmissions" ("TenantId", "TransmittedAt" DESC)
  WHERE "IgnitionOn" = TRUE;

-- Device gap-detection / deduplication
CREATE INDEX IF NOT EXISTS "idx_periodic_imei_time"
  ON "PeriodicTransmissions" ("DeviceImei", "TransmittedAt" DESC);


-- =====================================================================
-- Seed: 30 days of periodic transmissions (May 3 – Jun 2 2026)
-- 5 vehicles at 2-min intervals, active hours 06:00–20:00 EAT
-- (Production cadence = 30 s; 2-min seed keeps rows ≈ 25 k)
-- =====================================================================
DO $$
DECLARE
  seed_start CONSTANT TIMESTAMPTZ := '2026-05-03 03:00:00+00';
  seed_end   CONSTANT TIMESTAMPTZ := '2026-06-02 17:00:00+00';

  -- Helper: integer epoch ÷ bucket for sparse event detection
  -- (avoids MOD(double precision, integer) which has no overload)
  v_v1 UUID; v_v2 UUID; v_v3 UUID; v_v4 UUID; v_v5 UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM "PeriodicTransmissions" LIMIT 1) THEN
    RAISE NOTICE 'PeriodicTransmissions already seeded – skipping.';
    RETURN;
  END IF;

  SELECT "Id" INTO v_v1 FROM "Vehicles" WHERE "ShortId" = 'v1' LIMIT 1;
  SELECT "Id" INTO v_v2 FROM "Vehicles" WHERE "ShortId" = 'v2' LIMIT 1;
  SELECT "Id" INTO v_v3 FROM "Vehicles" WHERE "ShortId" = 'v3' LIMIT 1;
  SELECT "Id" INTO v_v4 FROM "Vehicles" WHERE "ShortId" = 'v4' LIMIT 1;
  SELECT "Id" INTO v_v5 FROM "Vehicles" WHERE "ShortId" = 'v5' LIMIT 1;

  -- ── v1: KAB 001A — Nairobi–Thika patrol, radius ~5 km ──────────
  INSERT INTO "PeriodicTransmissions" (
    "TenantId","VehicleId","DeviceImei",
    "TransmittedAt","ReceivedAt","IntervalSec","Protocol",
    "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM","Hdop",
    "SpeedKmh","OdometerKm","Mileage",
    "IgnitionOn","EngineRpm","FuelLevelPct","FuelConsRateL",
    "BatteryV","ExternalPower","Satellites","SignalDbm","NetworkType",
    "EventFlags"
  )
  SELECT
    '00000000-0000-0000-0000-000000000001'::UUID,
    v_v1, '354678091234501',
    ts,
    ts + INTERVAL '1 second',
    30, 'http',
    -- Circular patrol: radius ~0.045° ≈ 5 km
    -1.2921 + 0.045 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 3600.0),
     36.8219 + 0.045 * COS(EXTRACT(EPOCH FROM ts)::FLOAT8 / 3600.0),
    (1410 + (30.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 7200.0))::INTEGER)::SMALLINT,
    -- Heading: 0–359 cycling every hour
    ((270 + ((EXTRACT(EPOCH FROM ts)::BIGINT / 10) % 360)::INTEGER) % 360)::SMALLINT,
    3::SMALLINT, 0.9::REAL,
    -- Speed: 30–80 kmh, dips during rush hours
    GREATEST(0.0,
      55.0 + 25.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 1800.0)
      - CASE WHEN EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER IN (7,8,17,18) THEN 20.0 ELSE 0.0 END
    )::REAL,
    (45230.0 + EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 52.0)::REAL,
    (MOD((EXTRACT(EPOCH FROM (ts - seed_start))::BIGINT / 3600 * 52)::BIGINT, 500::BIGINT))::REAL,
    TRUE,
    (1600 + (400.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 1800.0))::INTEGER)::SMALLINT,
    GREATEST(10, (80.0 - EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 0.9)::INTEGER)::SMALLINT,
    (18.0 + 8.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 1800.0))::REAL,
    (13.8 + 0.3 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 900.0))::REAL,
    TRUE,
    (8 + (EXTRACT(EPOCH FROM ts)::BIGINT % 4)::INTEGER)::SMALLINT,
    (-82 + (EXTRACT(EPOCH FROM ts)::BIGINT % 12)::INTEGER)::SMALLINT,
    '4G',
    -- Sparse events: harsh brake ~every 36 min, overspeed when fast
    CASE
      WHEN (EXTRACT(EPOCH FROM ts)::BIGINT / 120) % 18 = 0 THEN 1::SMALLINT
      WHEN (EXTRACT(EPOCH FROM ts)::BIGINT / 120) % 25 = 0 THEN 2::SMALLINT
      WHEN (55.0 + 25.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 1800.0)) > 78.0 THEN 4::SMALLINT
      ELSE 0::SMALLINT
    END
  FROM generate_series(seed_start, seed_end, INTERVAL '2 minutes') AS ts
  WHERE EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER BETWEEN 6 AND 19;

  -- ── v2: KAB 002B — Westlands loop, radius ~4 km ─────────────────
  INSERT INTO "PeriodicTransmissions" (
    "TenantId","VehicleId","DeviceImei",
    "TransmittedAt","ReceivedAt","IntervalSec","Protocol",
    "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM","Hdop",
    "SpeedKmh","OdometerKm","Mileage",
    "IgnitionOn","EngineRpm","FuelLevelPct","FuelConsRateL",
    "BatteryV","ExternalPower","Satellites","SignalDbm","NetworkType",
    "EventFlags"
  )
  SELECT
    '00000000-0000-0000-0000-000000000001'::UUID,
    v_v2, '354678091234502',
    ts, ts + INTERVAL '2 seconds', 30, 'mqtt',
    -1.2400 + 0.038 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2400.0 + 1.0),
     36.8700 + 0.038 * COS(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2400.0 + 1.0),
    (1430 + (20.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 5400.0))::INTEGER)::SMALLINT,
    ((90  + ((EXTRACT(EPOCH FROM ts)::BIGINT / 12) % 360)::INTEGER) % 360)::SMALLINT,
    4::SMALLINT, 1.1::REAL,
    GREATEST(0.0,
      48.0 + 22.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2100.0)
      - CASE WHEN EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER IN (7,8,17,18) THEN 18.0 ELSE 0.0 END
    )::REAL,
    (62100.0 + EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 44.0)::REAL,
    (MOD((EXTRACT(EPOCH FROM (ts - seed_start))::BIGINT / 3600 * 44)::BIGINT, 400::BIGINT))::REAL,
    TRUE,
    (1500 + (350.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2100.0))::INTEGER)::SMALLINT,
    GREATEST(10, (75.0 - EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 0.8)::INTEGER)::SMALLINT,
    (15.0 + 7.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2100.0))::REAL,
    (13.6 + 0.4 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 1200.0))::REAL,
    TRUE,
    (7 + (EXTRACT(EPOCH FROM ts)::BIGINT % 5)::INTEGER)::SMALLINT,
    (-85 + (EXTRACT(EPOCH FROM ts)::BIGINT % 10)::INTEGER)::SMALLINT,
    '4G',
    CASE
      WHEN (EXTRACT(EPOCH FROM ts)::BIGINT / 120) % 22 = 0 THEN 1::SMALLINT
      WHEN (EXTRACT(EPOCH FROM ts)::BIGINT / 120) % 30 = 0 THEN 2::SMALLINT
      ELSE 0::SMALLINT
    END
  FROM generate_series(seed_start, seed_end, INTERVAL '2 minutes') AS ts
  WHERE EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER BETWEEN 6 AND 19;

  -- ── v3: KAB 003C — CBD circuit, radius ~3 km ────────────────────
  INSERT INTO "PeriodicTransmissions" (
    "TenantId","VehicleId","DeviceImei",
    "TransmittedAt","ReceivedAt","IntervalSec","Protocol",
    "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM","Hdop",
    "SpeedKmh","OdometerKm","Mileage",
    "IgnitionOn","EngineRpm","FuelLevelPct","FuelConsRateL",
    "BatteryV","ExternalPower","Satellites","SignalDbm","NetworkType",
    "EventFlags"
  )
  SELECT
    '00000000-0000-0000-0000-000000000001'::UUID,
    v_v3, '354678091234503',
    ts, ts + INTERVAL '1 second', 30, 'tcp-gt06',
    -1.2630 + 0.030 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2800.0 + 2.1),
     36.8050 + 0.030 * COS(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2800.0 + 2.1),
    (1440 + (25.0 * COS(EXTRACT(EPOCH FROM ts)::FLOAT8 / 6000.0))::INTEGER)::SMALLINT,
    ((180 + ((EXTRACT(EPOCH FROM ts)::BIGINT / 13) % 360)::INTEGER) % 360)::SMALLINT,
    3::SMALLINT, 0.8::REAL,
    GREATEST(0.0,
      42.0 + 18.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2800.0)
      - CASE WHEN EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER IN (7,8,17,18) THEN 22.0 ELSE 0.0 END
    )::REAL,
    (12050.0 + EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 38.0)::REAL,
    (MOD((EXTRACT(EPOCH FROM (ts - seed_start))::BIGINT / 3600 * 38)::BIGINT, 350::BIGINT))::REAL,
    TRUE,
    (1400 + (300.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2800.0))::INTEGER)::SMALLINT,
    GREATEST(10, (90.0 - EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 1.1)::INTEGER)::SMALLINT,
    (12.0 + 5.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2800.0))::REAL,
    (13.5 + 0.5 * COS(EXTRACT(EPOCH FROM ts)::FLOAT8 / 1800.0))::REAL,
    TRUE,
    (9 + (EXTRACT(EPOCH FROM ts)::BIGINT % 3)::INTEGER)::SMALLINT,
    (-79 + (EXTRACT(EPOCH FROM ts)::BIGINT % 14)::INTEGER)::SMALLINT,
    '3G',
    CASE
      WHEN (EXTRACT(EPOCH FROM ts)::BIGINT / 120) % 15 = 0 THEN 1::SMALLINT
      ELSE 0::SMALLINT
    END
  FROM generate_series(seed_start, seed_end, INTERVAL '2 minutes') AS ts
  WHERE EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER BETWEEN 6 AND 19;

  -- ── v4: KAB 004D — Mombasa Rd corridor, radius ~6 km ────────────
  INSERT INTO "PeriodicTransmissions" (
    "TenantId","VehicleId","DeviceImei",
    "TransmittedAt","ReceivedAt","IntervalSec","Protocol",
    "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM","Hdop",
    "SpeedKmh","OdometerKm","Mileage",
    "IgnitionOn","EngineRpm","FuelLevelPct","FuelConsRateL",
    "BatteryV","ExternalPower","Satellites","SignalDbm","NetworkType",
    "EventFlags"
  )
  SELECT
    '00000000-0000-0000-0000-000000000001'::UUID,
    v_v4, '354678091234504',
    ts, ts + INTERVAL '3 seconds', 30, 'http',
    -1.3100 + 0.055 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 3200.0 + 3.5),
     36.8400 + 0.055 * COS(EXTRACT(EPOCH FROM ts)::FLOAT8 / 3200.0 + 3.5),
    (1400 + (40.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 8000.0))::INTEGER)::SMALLINT,
    ((315 + ((EXTRACT(EPOCH FROM ts)::BIGINT / 9) % 360)::INTEGER) % 360)::SMALLINT,
    4::SMALLINT, 1.2::REAL,
    GREATEST(0.0,
      62.0 + 28.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 3200.0)
      - CASE WHEN EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER IN (7,8,17,18) THEN 25.0 ELSE 0.0 END
    )::REAL,
    (88400.0 + EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 58.0)::REAL,
    (MOD((EXTRACT(EPOCH FROM (ts - seed_start))::BIGINT / 3600 * 58)::BIGINT, 600::BIGINT))::REAL,
    TRUE,
    (1700 + (500.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 3200.0))::INTEGER)::SMALLINT,
    GREATEST(10, (70.0 - EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 0.7)::INTEGER)::SMALLINT,
    (20.0 + 10.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 3200.0))::REAL,
    (14.1 + 0.2 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 1500.0))::REAL,
    TRUE,
    (8 + (EXTRACT(EPOCH FROM ts)::BIGINT % 4)::INTEGER)::SMALLINT,
    (-88 + (EXTRACT(EPOCH FROM ts)::BIGINT % 10)::INTEGER)::SMALLINT,
    '4G',
    CASE
      WHEN (62.0 + 28.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 3200.0)) > 85.0 THEN 4::SMALLINT
      WHEN (EXTRACT(EPOCH FROM ts)::BIGINT / 120) % 12 = 0 THEN 1::SMALLINT
      WHEN (EXTRACT(EPOCH FROM ts)::BIGINT / 120) % 40 = 0 THEN 32::SMALLINT
      ELSE 0::SMALLINT
    END
  FROM generate_series(seed_start, seed_end, INTERVAL '2 minutes') AS ts
  WHERE EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER BETWEEN 6 AND 19;

  -- ── v5: KAB 005E — Ngong Rd, radius ~4.5 km ─────────────────────
  INSERT INTO "PeriodicTransmissions" (
    "TenantId","VehicleId","DeviceImei",
    "TransmittedAt","ReceivedAt","IntervalSec","Protocol",
    "Lat","Lng","AltitudeM","HeadingDeg","AccuracyM","Hdop",
    "SpeedKmh","OdometerKm","Mileage",
    "IgnitionOn","EngineRpm","FuelLevelPct","FuelConsRateL",
    "BatteryV","ExternalPower","Satellites","SignalDbm","NetworkType",
    "EventFlags"
  )
  SELECT
    '00000000-0000-0000-0000-000000000001'::UUID,
    v_v5, '354678091234505',
    ts, ts + INTERVAL '1 second', 30, 'mqtt',
    -1.2600 + 0.042 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2600.0 + 0.7),
     36.8500 + 0.042 * COS(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2600.0 + 0.7),
    (1450 + (35.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 4500.0))::INTEGER)::SMALLINT,
    ((45  + ((EXTRACT(EPOCH FROM ts)::BIGINT / 11) % 360)::INTEGER) % 360)::SMALLINT,
    3::SMALLINT, 0.9::REAL,
    GREATEST(0.0,
      50.0 + 20.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2600.0)
      - CASE WHEN EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER IN (7,8,17,18) THEN 15.0 ELSE 0.0 END
    )::REAL,
    (34780.0 + EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 46.0)::REAL,
    (MOD((EXTRACT(EPOCH FROM (ts - seed_start))::BIGINT / 3600 * 46)::BIGINT, 420::BIGINT))::REAL,
    TRUE,
    (1550 + (380.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2600.0))::INTEGER)::SMALLINT,
    GREATEST(10, (85.0 - EXTRACT(EPOCH FROM (ts - seed_start))::FLOAT8 / 3600.0 * 0.95)::INTEGER)::SMALLINT,
    (16.0 + 6.0 * SIN(EXTRACT(EPOCH FROM ts)::FLOAT8 / 2600.0))::REAL,
    (13.9 + 0.3 * COS(EXTRACT(EPOCH FROM ts)::FLOAT8 / 1100.0))::REAL,
    TRUE,
    (8 + (EXTRACT(EPOCH FROM ts)::BIGINT % 4)::INTEGER)::SMALLINT,
    (-81 + (EXTRACT(EPOCH FROM ts)::BIGINT % 11)::INTEGER)::SMALLINT,
    '4G',
    CASE
      WHEN (EXTRACT(EPOCH FROM ts)::BIGINT / 120) % 20 = 0 THEN 1::SMALLINT
      WHEN (EXTRACT(EPOCH FROM ts)::BIGINT / 120) % 28 = 0 THEN 2::SMALLINT
      ELSE 0::SMALLINT
    END
  FROM generate_series(seed_start, seed_end, INTERVAL '2 minutes') AS ts
  WHERE EXTRACT(HOUR FROM ts AT TIME ZONE 'Africa/Nairobi')::INTEGER BETWEEN 6 AND 19;

  RAISE NOTICE 'Migration 007 OK';
END $$;
