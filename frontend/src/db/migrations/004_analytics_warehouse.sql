-- ============================================================
-- Migration 004: Analytics Data Warehouse
--
-- Star-schema pre-aggregated fact tables for the Analytics
-- dashboard. Data is isolated per tenant and stored at:
--   FactOpsDaily         → one row per tenant per calendar day
--   FactFinancialMonthly → one row per tenant per month
--   FactSalesMonthly     → one row per tenant per month
--
-- Query patterns:
--   period=week    → last 7 days from FactOpsDaily
--   period=month   → last 30 days from FactOpsDaily
--   period=quarter → last 90 days grouped by week
--   period=monthly   → FactFinancialMonthly / FactSalesMonthly
--   period=quarterly → GROUP BY year+quarter
--   period=yearly    → GROUP BY year
-- ============================================================

-- ── Operations daily fact table ──────────────────────────────
CREATE TABLE IF NOT EXISTS "FactOpsDaily" (
  "Id"                    UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"              UUID             NOT NULL,
  "Date"                  DATE             NOT NULL,
  "TotalTrips"            INTEGER          NOT NULL DEFAULT 0,
  "DistanceKm"            DECIMAL(10,1)    NOT NULL DEFAULT 0,
  "FleetUtilizationPct"   DECIMAL(5,1)     NOT NULL DEFAULT 0,
  "FuelEfficiencyKmL"     DECIMAL(5,2)     NOT NULL DEFAULT 0,
  "OnTimeRatePct"         DECIMAL(5,1)     NOT NULL DEFAULT 0,
  "DriverAvgScore"        DECIMAL(5,1)     NOT NULL DEFAULT 0,
  "ActiveVehicles"        SMALLINT         NOT NULL DEFAULT 0,
  "IdleVehicles"          SMALLINT         NOT NULL DEFAULT 0,
  "OfflineVehicles"       SMALLINT         NOT NULL DEFAULT 0,
  "InServiceVehicles"     SMALLINT         NOT NULL DEFAULT 0,
  "SpeedingAlerts"        INTEGER          NOT NULL DEFAULT 0,
  "HarshBrakingAlerts"    INTEGER          NOT NULL DEFAULT 0,
  "IdleTimeAlerts"        INTEGER          NOT NULL DEFAULT 0,
  "GeofenceAlerts"        INTEGER          NOT NULL DEFAULT 0,
  "OtherAlerts"           INTEGER          NOT NULL DEFAULT 0,
  "CreatedAt"             TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  UNIQUE ("TenantId", "Date")
);

-- ── Financial monthly fact table ─────────────────────────────
CREATE TABLE IF NOT EXISTS "FactFinancialMonthly" (
  "Id"                UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"          UUID             NOT NULL,
  "Year"              SMALLINT         NOT NULL,
  "Month"             SMALLINT         NOT NULL,   -- 1–12
  "Revenue"           DECIMAL(12,2)    NOT NULL DEFAULT 0,
  "CellularCost"      DECIMAL(12,2)    NOT NULL DEFAULT 0,
  "OpsCost"           DECIMAL(12,2)    NOT NULL DEFAULT 0,
  "ActiveVehicles"    SMALLINT         NOT NULL DEFAULT 0,
  "CreatedAt"         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  UNIQUE ("TenantId", "Year", "Month")
);

-- ── Sales monthly fact table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "FactSalesMonthly" (
  "Id"                UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"          UUID             NOT NULL,
  "Year"              SMALLINT         NOT NULL,
  "Month"             SMALLINT         NOT NULL,
  "NewContracts"      SMALLINT         NOT NULL DEFAULT 0,
  "Renewals"          SMALLINT         NOT NULL DEFAULT 0,
  "Churned"           SMALLINT         NOT NULL DEFAULT 0,
  "PipelineValue"     DECIMAL(12,2)    NOT NULL DEFAULT 0,
  "ClosedRevenue"     DECIMAL(12,2)    NOT NULL DEFAULT 0,
  "CreatedAt"         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  UNIQUE ("TenantId", "Year", "Month")
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_factops_tenant_date
  ON "FactOpsDaily" ("TenantId", "Date" DESC);

CREATE INDEX IF NOT EXISTS idx_factfin_tenant_ym
  ON "FactFinancialMonthly" ("TenantId", "Year" DESC, "Month" DESC);

CREATE INDEX IF NOT EXISTS idx_factsale_tenant_ym
  ON "FactSalesMonthly" ("TenantId", "Year" DESC, "Month" DESC);


-- ============================================================
-- SEED — Tenant 1 (ACME Fleet) — operations last 365 days
-- Uses deterministic math (sin/cos on day-of-year) so re-runs
-- are idempotent via ON CONFLICT DO NOTHING.
-- ============================================================
INSERT INTO "FactOpsDaily" (
  "Id", "TenantId", "Date",
  "TotalTrips", "DistanceKm",
  "FleetUtilizationPct", "FuelEfficiencyKmL",
  "OnTimeRatePct", "DriverAvgScore",
  "ActiveVehicles", "IdleVehicles", "OfflineVehicles", "InServiceVehicles",
  "SpeedingAlerts", "HarshBrakingAlerts", "IdleTimeAlerts",
  "GeofenceAlerts", "OtherAlerts"
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::UUID,
  d,
  -- Trips: ~47/day, -12 on weekends, gentle sine wave
  GREATEST(12,
    47
    + CASE WHEN EXTRACT(DOW FROM d) IN (0,6) THEN -12 ELSE 0 END
    + ROUND(7 * SIN(EXTRACT(DOY FROM d)::numeric / 14))
  )::INTEGER,
  -- Distance ≈ trips × 82 km
  GREATEST(1000,
    (47 + CASE WHEN EXTRACT(DOW FROM d) IN (0,6) THEN -12 ELSE 0 END
         + ROUND(7 * SIN(EXTRACT(DOY FROM d)::numeric / 14))) * 82.0
  )::DECIMAL(10,1),
  -- Fleet utilization 68–83%
  LEAST(95, GREATEST(62,
    76 + ROUND(5 * SIN(EXTRACT(DOY FROM d)::numeric / 28))
  ))::DECIMAL(5,1),
  -- Fuel efficiency 8.5–9.5 km/L
  ROUND(CAST(9.0 + 0.35 * SIN(EXTRACT(DOY FROM d)::numeric / 20) AS numeric), 2)::DECIMAL(5,2),
  -- On-time rate 87–94%
  LEAST(98, GREATEST(82,
    91 + ROUND(3 * SIN(EXTRACT(DOY FROM d)::numeric / 22))
  ))::DECIMAL(5,1),
  -- Driver score 83–92
  LEAST(100, GREATEST(78,
    87 + ROUND(3 * COS(EXTRACT(DOY FROM d)::numeric / 18))
  ))::DECIMAL(5,1),
  -- Active vehicles 24–32
  GREATEST(18, 28 + ROUND(4 * SIN(EXTRACT(DOY FROM d)::numeric / 30)))::SMALLINT,
  7::SMALLINT,
  4::SMALLINT,
  2::SMALLINT,
  -- Speeding alerts
  GREATEST(4, 18 + ROUND(5 * SIN(EXTRACT(DOY FROM d)::numeric / 11)))::INTEGER,
  -- Harsh braking
  GREATEST(2, 11 + ROUND(4 * SIN(EXTRACT(DOY FROM d)::numeric / 13)))::INTEGER,
  -- Idle time
  GREATEST(1,  7 + ROUND(2 * SIN(EXTRACT(DOY FROM d)::numeric /  9)))::INTEGER,
  -- Geofence
  GREATEST(0,  4 + ROUND(2 * COS(EXTRACT(DOY FROM d)::numeric / 16)))::INTEGER,
  -- Other
  GREATEST(0,  2 + ROUND(    SIN(EXTRACT(DOY FROM d)::numeric /  7)))::INTEGER
FROM generate_series(
  CURRENT_DATE - INTERVAL '364 days',
  CURRENT_DATE,
  '1 day'::INTERVAL
) AS d
ON CONFLICT ("TenantId", "Date") DO NOTHING;


-- ============================================================
-- SEED — Tenant 1 financial monthly (Jul 2024 – Jun 2025)
-- ============================================================
INSERT INTO "FactFinancialMonthly"
  ("TenantId","Year","Month","Revenue","CellularCost","OpsCost","ActiveVehicles")
VALUES
  ('00000000-0000-0000-0000-000000000001', 2024,  7, 19800, 1820, 3640, 36),
  ('00000000-0000-0000-0000-000000000001', 2024,  8, 20600, 1880, 3780, 37),
  ('00000000-0000-0000-0000-000000000001', 2024,  9, 21400, 1950, 3920, 37),
  ('00000000-0000-0000-0000-000000000001', 2024, 10, 22100, 2020, 4060, 38),
  ('00000000-0000-0000-0000-000000000001', 2024, 11, 22800, 2080, 4180, 39),
  ('00000000-0000-0000-0000-000000000001', 2024, 12, 23600, 2150, 4320, 39),
  ('00000000-0000-0000-0000-000000000001', 2025,  1, 22400, 2060, 4100, 39),
  ('00000000-0000-0000-0000-000000000001', 2025,  2, 23200, 2120, 4240, 40),
  ('00000000-0000-0000-0000-000000000001', 2025,  3, 24100, 2190, 4410, 40),
  ('00000000-0000-0000-0000-000000000001', 2025,  4, 24850, 2260, 4550, 40),
  ('00000000-0000-0000-0000-000000000001', 2025,  5, 25700, 2330, 4700, 41),
  ('00000000-0000-0000-0000-000000000001', 2025,  6, 26600, 2410, 4860, 41)
ON CONFLICT ("TenantId","Year","Month") DO NOTHING;

-- Historical yearly data (2021–2023 broken into monthly estimates for quarterly roll-up)
INSERT INTO "FactFinancialMonthly"
  ("TenantId","Year","Month","Revenue","CellularCost","OpsCost","ActiveVehicles")
VALUES
  -- 2021  (annual ~168K → ~14K/mo)
  ('00000000-0000-0000-0000-000000000001', 2021,  1, 12500, 1150, 2450, 26),
  ('00000000-0000-0000-0000-000000000001', 2021,  2, 12800, 1170, 2500, 26),
  ('00000000-0000-0000-0000-000000000001', 2021,  3, 13200, 1210, 2560, 27),
  ('00000000-0000-0000-0000-000000000001', 2021,  4, 13600, 1240, 2620, 27),
  ('00000000-0000-0000-0000-000000000001', 2021,  5, 14100, 1290, 2720, 28),
  ('00000000-0000-0000-0000-000000000001', 2021,  6, 14400, 1310, 2770, 28),
  ('00000000-0000-0000-0000-000000000001', 2021,  7, 14600, 1330, 2820, 28),
  ('00000000-0000-0000-0000-000000000001', 2021,  8, 14200, 1300, 2760, 28),
  ('00000000-0000-0000-0000-000000000001', 2021,  9, 13900, 1270, 2700, 28),
  ('00000000-0000-0000-0000-000000000001', 2021, 10, 14500, 1320, 2790, 28),
  ('00000000-0000-0000-0000-000000000001', 2021, 11, 14800, 1360, 2840, 28),
  ('00000000-0000-0000-0000-000000000001', 2021, 12, 15400, 1430, 2970, 28),
  -- 2022  (annual ~212K → ~17.7K/mo)
  ('00000000-0000-0000-0000-000000000001', 2022,  1, 15600, 1420, 2980, 29),
  ('00000000-0000-0000-0000-000000000001', 2022,  2, 16100, 1470, 3060, 30),
  ('00000000-0000-0000-0000-000000000001', 2022,  3, 16800, 1530, 3180, 30),
  ('00000000-0000-0000-0000-000000000001', 2022,  4, 17200, 1570, 3260, 31),
  ('00000000-0000-0000-0000-000000000001', 2022,  5, 17600, 1600, 3340, 31),
  ('00000000-0000-0000-0000-000000000001', 2022,  6, 18000, 1640, 3420, 32),
  ('00000000-0000-0000-0000-000000000001', 2022,  7, 18200, 1660, 3460, 32),
  ('00000000-0000-0000-0000-000000000001', 2022,  8, 17800, 1620, 3380, 32),
  ('00000000-0000-0000-0000-000000000001', 2022,  9, 17400, 1580, 3300, 32),
  ('00000000-0000-0000-0000-000000000001', 2022, 10, 18100, 1650, 3440, 33),
  ('00000000-0000-0000-0000-000000000001', 2022, 11, 18600, 1690, 3530, 33),
  ('00000000-0000-0000-0000-000000000001', 2022, 12, 20600, 1860, 3840, 33),
  -- 2023  (annual ~232K → ~19.3K/mo)
  ('00000000-0000-0000-0000-000000000001', 2023,  1, 17600, 1620, 3360, 34),
  ('00000000-0000-0000-0000-000000000001', 2023,  2, 18200, 1660, 3460, 34),
  ('00000000-0000-0000-0000-000000000001', 2023,  3, 19000, 1730, 3640, 35),
  ('00000000-0000-0000-0000-000000000001', 2023,  4, 19400, 1770, 3720, 35),
  ('00000000-0000-0000-0000-000000000001', 2023,  5, 19800, 1810, 3800, 35),
  ('00000000-0000-0000-0000-000000000001', 2023,  6, 20200, 1840, 3880, 36),
  ('00000000-0000-0000-0000-000000000001', 2023,  7, 20400, 1860, 3920, 36),
  ('00000000-0000-0000-0000-000000000001', 2023,  8, 19600, 1790, 3760, 36),
  ('00000000-0000-0000-0000-000000000001', 2023,  9, 19000, 1730, 3640, 36),
  ('00000000-0000-0000-0000-000000000001', 2023, 10, 19800, 1810, 3800, 36),
  ('00000000-0000-0000-0000-000000000001', 2023, 11, 20200, 1840, 3880, 36),
  ('00000000-0000-0000-0000-000000000001', 2023, 12, 20800, 1900, 3980, 36)
ON CONFLICT ("TenantId","Year","Month") DO NOTHING;


-- ============================================================
-- SEED — Tenant 1 sales monthly (Jul 2024 – Jun 2025)
-- ============================================================
INSERT INTO "FactSalesMonthly"
  ("TenantId","Year","Month","NewContracts","Renewals","Churned","PipelineValue","ClosedRevenue")
VALUES
  ('00000000-0000-0000-0000-000000000001', 2024,  7,  4, 31, 1, 38000,  18200),
  ('00000000-0000-0000-0000-000000000001', 2024,  8,  5, 32, 1, 41000,  19100),
  ('00000000-0000-0000-0000-000000000001', 2024,  9,  3, 33, 0, 36000,  18800),
  ('00000000-0000-0000-0000-000000000001', 2024, 10,  6, 33, 1, 44000,  20400),
  ('00000000-0000-0000-0000-000000000001', 2024, 11,  4, 34, 0, 40000,  20900),
  ('00000000-0000-0000-0000-000000000001', 2024, 12,  7, 35, 2, 52000,  22100),
  ('00000000-0000-0000-0000-000000000001', 2025,  1,  3, 35, 1, 38000,  20600),
  ('00000000-0000-0000-0000-000000000001', 2025,  2,  5, 36, 0, 45000,  21800),
  ('00000000-0000-0000-0000-000000000001', 2025,  3,  6, 37, 1, 50000,  23200),
  ('00000000-0000-0000-0000-000000000001', 2025,  4,  5, 37, 0, 48000,  23900),
  ('00000000-0000-0000-0000-000000000001', 2025,  5,  8, 38, 1, 58000,  25100),
  ('00000000-0000-0000-0000-000000000001', 2025,  6,  6, 39, 0, 54000,  26000)
ON CONFLICT ("TenantId","Year","Month") DO NOTHING;

-- Historical sales (2021–2023)
INSERT INTO "FactSalesMonthly"
  ("TenantId","Year","Month","NewContracts","Renewals","Churned","PipelineValue","ClosedRevenue")
VALUES
  ('00000000-0000-0000-0000-000000000001', 2021,  1, 2,17,1,18000,12200),
  ('00000000-0000-0000-0000-000000000001', 2021,  2, 2,17,0,19000,12500),
  ('00000000-0000-0000-0000-000000000001', 2021,  3, 3,18,1,21000,13400),
  ('00000000-0000-0000-0000-000000000001', 2021,  4, 2,19,1,20000,13000),
  ('00000000-0000-0000-0000-000000000001', 2021,  5, 3,19,0,22000,13800),
  ('00000000-0000-0000-0000-000000000001', 2021,  6, 2,19,1,21000,13400),
  ('00000000-0000-0000-0000-000000000001', 2021,  7, 2,20,1,22000,13800),
  ('00000000-0000-0000-0000-000000000001', 2021,  8, 3,20,0,23000,14200),
  ('00000000-0000-0000-0000-000000000001', 2021,  9, 2,20,1,21000,13400),
  ('00000000-0000-0000-0000-000000000001', 2021, 10, 2,21,1,22000,13800),
  ('00000000-0000-0000-0000-000000000001', 2021, 11, 3,21,2,24000,14600),
  ('00000000-0000-0000-0000-000000000001', 2021, 12, 2,22,1,22000,13800),
  ('00000000-0000-0000-0000-000000000001', 2022,  1, 3,22,1,26000,15200),
  ('00000000-0000-0000-0000-000000000001', 2022,  2, 3,23,0,27000,16100),
  ('00000000-0000-0000-0000-000000000001', 2022,  3, 4,23,1,29000,17200),
  ('00000000-0000-0000-0000-000000000001', 2022,  4, 3,24,1,28000,16600),
  ('00000000-0000-0000-0000-000000000001', 2022,  5, 4,24,0,30000,17800),
  ('00000000-0000-0000-0000-000000000001', 2022,  6, 3,25,1,29000,17200),
  ('00000000-0000-0000-0000-000000000001', 2022,  7, 4,25,1,30000,17800),
  ('00000000-0000-0000-0000-000000000001', 2022,  8, 3,25,1,28000,16600),
  ('00000000-0000-0000-0000-000000000001', 2022,  9, 3,25,0,27000,16100),
  ('00000000-0000-0000-0000-000000000001', 2022, 10, 4,26,1,30000,17800),
  ('00000000-0000-0000-0000-000000000001', 2022, 11, 4,26,1,31000,18400),
  ('00000000-0000-0000-0000-000000000001', 2022, 12, 5,27,1,34000,20200),
  ('00000000-0000-0000-0000-000000000001', 2023,  1, 3,27,1,30000,17200),
  ('00000000-0000-0000-0000-000000000001', 2023,  2, 4,28,0,32000,18400),
  ('00000000-0000-0000-0000-000000000001', 2023,  3, 5,28,1,35000,19800),
  ('00000000-0000-0000-0000-000000000001', 2023,  4, 4,29,1,33000,19000),
  ('00000000-0000-0000-0000-000000000001', 2023,  5, 5,29,0,36000,20200),
  ('00000000-0000-0000-0000-000000000001', 2023,  6, 4,30,1,34000,19400),
  ('00000000-0000-0000-0000-000000000001', 2023,  7, 4,30,2,34000,19400),
  ('00000000-0000-0000-0000-000000000001', 2023,  8, 5,30,0,36000,20200),
  ('00000000-0000-0000-0000-000000000001', 2023,  9, 4,30,1,33000,18800),
  ('00000000-0000-0000-0000-000000000001', 2023, 10, 5,31,1,36000,20200),
  ('00000000-0000-0000-0000-000000000001', 2023, 11, 5,31,2,37000,20800),
  ('00000000-0000-0000-0000-000000000001', 2023, 12, 4,32,1,34000,19400)
ON CONFLICT ("TenantId","Year","Month") DO NOTHING;
