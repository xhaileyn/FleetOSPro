-- ============================================================
-- Migration 005: Analytics Reference / Dimension Tables
--
-- Completes the analytics data warehouse by storing every
-- value that was previously hardcoded in the frontend page.
--
-- Tables:
--   FactSpeedProfile      — speed-range distribution snapshot
--   FactSalesRep          — per-rep sales performance
--   FactSalesChannel      — revenue by sales channel
--   FactCellularCarrier   — telco carrier mix
--   FactRevStream         — revenue stream breakdown
--   FactPlanMix           — ARR by subscription plan
--   FactFunnelSnapshot    — sales pipeline funnel stages
--   FactVehicleOpsMonthly — per-vehicle ops aggregates
--   FactDriverMonthly     — per-driver performance aggregates
--   AnalyticsInsight      — AI-style insight cards per view/period
-- ============================================================

-- ── Speed profile ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FactSpeedProfile" (
  "Id"        UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"  UUID      NOT NULL,
  "Range"     TEXT      NOT NULL,
  "Pct"       DECIMAL(5,1) NOT NULL DEFAULT 0,
  "Safe"      BOOLEAN   NOT NULL DEFAULT TRUE,
  "SortOrder" SMALLINT  NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "Range")
);

-- ── Sales rep performance ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FactSalesRep" (
  "Id"            UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"      UUID      NOT NULL,
  "Name"          TEXT      NOT NULL,
  "DealsWon"      SMALLINT  NOT NULL DEFAULT 0,
  "Revenue"       DECIMAL(12,2) NOT NULL DEFAULT 0,
  "Quota"         DECIMAL(12,2) NOT NULL DEFAULT 0,
  "ConversionPct" SMALLINT  NOT NULL DEFAULT 0,
  "SortOrder"     SMALLINT  NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "Name")
);

-- ── Sales channel mix ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FactSalesChannel" (
  "Id"        UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"  UUID      NOT NULL,
  "Channel"   TEXT      NOT NULL,
  "Pct"       DECIMAL(5,1) NOT NULL DEFAULT 0,
  "Color"     TEXT      NOT NULL DEFAULT '#0d9488',
  "SortOrder" SMALLINT  NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "Channel")
);

-- ── Cellular carrier breakdown ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "FactCellularCarrier" (
  "Id"        UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"  UUID      NOT NULL,
  "Carrier"   TEXT      NOT NULL,
  "Pct"       DECIMAL(5,1) NOT NULL DEFAULT 0,
  "Color"     TEXT      NOT NULL DEFAULT '#0d9488',
  "SortOrder" SMALLINT  NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "Carrier")
);

-- ── Revenue stream mix ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FactRevStream" (
  "Id"        UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"  UUID      NOT NULL,
  "Stream"    TEXT      NOT NULL,
  "Pct"       DECIMAL(5,1) NOT NULL DEFAULT 0,
  "Color"     TEXT      NOT NULL DEFAULT '#0d9488',
  "SortOrder" SMALLINT  NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "Stream")
);

-- ── ARR / plan mix ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FactPlanMix" (
  "Id"        UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"  UUID      NOT NULL,
  "PlanName"  TEXT      NOT NULL,
  "ARR"       DECIMAL(12,2) NOT NULL DEFAULT 0,
  "Vehicles"  SMALLINT  NOT NULL DEFAULT 0,
  "Color"     TEXT      NOT NULL DEFAULT '#0d9488',
  "SortOrder" SMALLINT  NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "PlanName")
);

-- ── Sales funnel stages ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FactFunnelSnapshot" (
  "Id"        UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"  UUID      NOT NULL,
  "Stage"     TEXT      NOT NULL,
  "Count"     INTEGER   NOT NULL DEFAULT 0,
  "Color"     TEXT      NOT NULL DEFAULT '#0d9488',
  "SortOrder" SMALLINT  NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "Stage")
);

-- ── Per-vehicle ops aggregates (for the fuel / km table) ───────
CREATE TABLE IF NOT EXISTS "FactVehicleOpsMonthly" (
  "Id"        UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"  UUID      NOT NULL,
  "Year"      SMALLINT  NOT NULL,
  "Month"     SMALLINT  NOT NULL,
  "Plate"     TEXT      NOT NULL,
  "DistanceKm"   INTEGER NOT NULL DEFAULT 0,
  "FuelLitres"   INTEGER NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "Year", "Month", "Plate")
);

-- ── Per-driver performance aggregates ─────────────────────────
CREATE TABLE IF NOT EXISTS "FactDriverMonthly" (
  "Id"         UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"   UUID      NOT NULL,
  "Year"       SMALLINT  NOT NULL,
  "Month"      SMALLINT  NOT NULL,
  "DriverName" TEXT      NOT NULL,
  "SafetyScore" DECIMAL(5,1) NOT NULL DEFAULT 0,
  "Trips"      INTEGER   NOT NULL DEFAULT 0,
  "DistanceKm" INTEGER   NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "Year", "Month", "DriverName")
);

-- ── Insights (AI-style callout cards) ─────────────────────────
CREATE TABLE IF NOT EXISTS "AnalyticsInsight" (
  "Id"        UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "TenantId"  UUID      NOT NULL,
  "View"      TEXT      NOT NULL,   -- 'operations' | 'financial' | 'sales'
  "Period"    TEXT      NOT NULL,   -- 'week' | 'month' | 'quarter' | 'monthly' | 'quarterly' | 'yearly'
  "Icon"      TEXT      NOT NULL DEFAULT '📌',
  "Title"     TEXT      NOT NULL,
  "Body"      TEXT      NOT NULL,
  "Bg"        TEXT      NOT NULL DEFAULT '#f0fdf4',
  "Bd"        TEXT      NOT NULL DEFAULT '#86efac',
  "SortOrder" SMALLINT  NOT NULL DEFAULT 0,
  UNIQUE ("TenantId", "View", "Period", "Title")
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_factvehops_tenant_ym    ON "FactVehicleOpsMonthly" ("TenantId","Year" DESC,"Month" DESC);
CREATE INDEX IF NOT EXISTS idx_factdrvmon_tenant_ym    ON "FactDriverMonthly"     ("TenantId","Year" DESC,"Month" DESC);
CREATE INDEX IF NOT EXISTS idx_analinsight_tenant_view ON "AnalyticsInsight"      ("TenantId","View","Period");


-- ============================================================
-- SEED — Tenant 1
-- ============================================================

-- Speed profile
INSERT INTO "FactSpeedProfile" ("TenantId","Range","Pct","Safe","SortOrder") VALUES
  ('00000000-0000-0000-0000-000000000001','0–30',   8,  TRUE,  1),
  ('00000000-0000-0000-0000-000000000001','31–50',  22, TRUE,  2),
  ('00000000-0000-0000-0000-000000000001','51–70',  41, TRUE,  3),
  ('00000000-0000-0000-0000-000000000001','71–90',  24, TRUE,  4),
  ('00000000-0000-0000-0000-000000000001','91–110',  4, FALSE, 5),
  ('00000000-0000-0000-0000-000000000001','110+',    1, FALSE, 6)
ON CONFLICT ("TenantId","Range") DO UPDATE
  SET "Pct"=EXCLUDED."Pct","Safe"=EXCLUDED."Safe";

-- Sales reps
INSERT INTO "FactSalesRep" ("TenantId","Name","DealsWon","Revenue","Quota","ConversionPct","SortOrder") VALUES
  ('00000000-0000-0000-0000-000000000001','Alice Njoroge',  14, 62400, 60000, 38, 1),
  ('00000000-0000-0000-0000-000000000001','Brian Odhiambo', 11, 49800, 55000, 31, 2),
  ('00000000-0000-0000-0000-000000000001','Carol Wanjiru',   9, 41200, 45000, 29, 3),
  ('00000000-0000-0000-0000-000000000001','David Kamau',     8, 36500, 40000, 26, 4),
  ('00000000-0000-0000-0000-000000000001','Eve Achieng',     6, 28900, 35000, 22, 5)
ON CONFLICT ("TenantId","Name") DO UPDATE
  SET "DealsWon"=EXCLUDED."DealsWon","Revenue"=EXCLUDED."Revenue",
      "Quota"=EXCLUDED."Quota","ConversionPct"=EXCLUDED."ConversionPct";

-- Sales channels
INSERT INTO "FactSalesChannel" ("TenantId","Channel","Pct","Color","SortOrder") VALUES
  ('00000000-0000-0000-0000-000000000001','Direct sales',    45, '#0d9488', 1),
  ('00000000-0000-0000-0000-000000000001','Partner network', 28, '#6366f1', 2),
  ('00000000-0000-0000-0000-000000000001','Inbound / Web',   18, '#0ea5e9', 3),
  ('00000000-0000-0000-0000-000000000001','Referral',         9, '#f59e0b', 4)
ON CONFLICT ("TenantId","Channel") DO UPDATE
  SET "Pct"=EXCLUDED."Pct","Color"=EXCLUDED."Color";

-- Cellular carriers
INSERT INTO "FactCellularCarrier" ("TenantId","Carrier","Pct","Color","SortOrder") VALUES
  ('00000000-0000-0000-0000-000000000001','Safaricom',     47, '#16a34a', 1),
  ('00000000-0000-0000-0000-000000000001','Airtel Kenya',  28, '#dc2626', 2),
  ('00000000-0000-0000-0000-000000000001','Telkom Kenya',  15, '#2563eb', 3),
  ('00000000-0000-0000-0000-000000000001','Roaming / Int', 10, '#f97316', 4)
ON CONFLICT ("TenantId","Carrier") DO UPDATE
  SET "Pct"=EXCLUDED."Pct","Color"=EXCLUDED."Color";

-- Revenue streams
INSERT INTO "FactRevStream" ("TenantId","Stream","Pct","Color","SortOrder") VALUES
  ('00000000-0000-0000-0000-000000000001','Vehicle subscriptions', 62, '#0d9488', 1),
  ('00000000-0000-0000-0000-000000000001','Driver management',     18, '#2563eb', 2),
  ('00000000-0000-0000-0000-000000000001','API & integrations',    11, '#7c3aed', 3),
  ('00000000-0000-0000-0000-000000000001','Support & SLA',          6, '#d97706', 4),
  ('00000000-0000-0000-0000-000000000001','Overage charges',        3, '#94a3b8', 5)
ON CONFLICT ("TenantId","Stream") DO UPDATE
  SET "Pct"=EXCLUDED."Pct","Color"=EXCLUDED."Color";

-- Plan / ARR mix
INSERT INTO "FactPlanMix" ("TenantId","PlanName","ARR","Vehicles","Color","SortOrder") VALUES
  ('00000000-0000-0000-0000-000000000001','Enterprise', 124000, 14, '#6366f1', 1),
  ('00000000-0000-0000-0000-000000000001','Business',   108000, 18, '#0d9488', 2),
  ('00000000-0000-0000-0000-000000000001','Starter',     48000,  7, '#0ea5e9', 3),
  ('00000000-0000-0000-0000-000000000001','Custom',      22400,  2, '#f59e0b', 4)
ON CONFLICT ("TenantId","PlanName") DO UPDATE
  SET "ARR"=EXCLUDED."ARR","Vehicles"=EXCLUDED."Vehicles","Color"=EXCLUDED."Color";

-- Sales funnel
INSERT INTO "FactFunnelSnapshot" ("TenantId","Stage","Count","Color","SortOrder") VALUES
  ('00000000-0000-0000-0000-000000000001','Leads',       284, '#6366f1', 1),
  ('00000000-0000-0000-0000-000000000001','Qualified',   142, '#0ea5e9', 2),
  ('00000000-0000-0000-0000-000000000001','Proposal',     68, '#0d9488', 3),
  ('00000000-0000-0000-0000-000000000001','Negotiation',  31, '#f59e0b', 4),
  ('00000000-0000-0000-0000-000000000001','Closed Won',   19, '#16a34a', 5)
ON CONFLICT ("TenantId","Stage") DO UPDATE
  SET "Count"=EXCLUDED."Count","Color"=EXCLUDED."Color";

-- ── Per-vehicle monthly ops (Jul 2025 = latest full month) ────
INSERT INTO "FactVehicleOpsMonthly" ("TenantId","Year","Month","Plate","DistanceKm","FuelLitres") VALUES
  ('00000000-0000-0000-0000-000000000001',2025,6,'KAB 001A',4800,720),
  ('00000000-0000-0000-0000-000000000001',2025,6,'KAB 002B',5900,840),
  ('00000000-0000-0000-0000-000000000001',2025,6,'KAB 003C',3900,580),
  ('00000000-0000-0000-0000-000000000001',2025,6,'KAB 004D',2400,380),
  ('00000000-0000-0000-0000-000000000001',2025,6,'KAB 005E',4400,660),
  ('00000000-0000-0000-0000-000000000001',2025,6,'KAB 006F',3400,520),
  -- week-level (approximate from weekly data)
  ('00000000-0000-0000-0000-000000000001',2025,5,'KAB 001A',1240,180),
  ('00000000-0000-0000-0000-000000000001',2025,5,'KAB 002B',1580,210),
  ('00000000-0000-0000-0000-000000000001',2025,5,'KAB 003C', 980,145),
  ('00000000-0000-0000-0000-000000000001',2025,5,'KAB 004D', 620, 95),
  ('00000000-0000-0000-0000-000000000001',2025,5,'KAB 005E',1120,165),
  ('00000000-0000-0000-0000-000000000001',2025,5,'KAB 006F', 860,130),
  -- quarter
  ('00000000-0000-0000-0000-000000000001',2025,4,'KAB 001A',14800,2160),
  ('00000000-0000-0000-0000-000000000001',2025,4,'KAB 002B',17400,2520),
  ('00000000-0000-0000-0000-000000000001',2025,4,'KAB 003C',11600,1740),
  ('00000000-0000-0000-0000-000000000001',2025,4,'KAB 004D', 7200,1140),
  ('00000000-0000-0000-0000-000000000001',2025,4,'KAB 005E',13200,1980),
  ('00000000-0000-0000-0000-000000000001',2025,4,'KAB 006F',10200,1560)
ON CONFLICT ("TenantId","Year","Month","Plate") DO NOTHING;

-- ── Per-driver monthly performance ────────────────────────────
INSERT INTO "FactDriverMonthly" ("TenantId","Year","Month","DriverName","SafetyScore","Trips","DistanceKm") VALUES
  -- June 2025 (month)
  ('00000000-0000-0000-0000-000000000001',2025,6,'James M.',  93,182,13240),
  ('00000000-0000-0000-0000-000000000001',2025,6,'Sarah K.',  90,198,14920),
  ('00000000-0000-0000-0000-000000000001',2025,6,'Peter O.',  87,155,11400),
  ('00000000-0000-0000-0000-000000000001',2025,6,'Grace N.',  84,168,12450),
  ('00000000-0000-0000-0000-000000000001',2025,6,'David W.',  78,141,10680),
  -- May 2025 (week-proxy)
  ('00000000-0000-0000-0000-000000000001',2025,5,'James M.',  94, 47, 3420),
  ('00000000-0000-0000-0000-000000000001',2025,5,'Sarah K.',  91, 52, 3810),
  ('00000000-0000-0000-0000-000000000001',2025,5,'Peter O.',  88, 39, 2950),
  ('00000000-0000-0000-0000-000000000001',2025,5,'Grace N.',  85, 44, 3210),
  ('00000000-0000-0000-0000-000000000001',2025,5,'David W.',  79, 36, 2740),
  -- Quarter (Apr 2025)
  ('00000000-0000-0000-0000-000000000001',2025,4,'James M.',  92,540,39800),
  ('00000000-0000-0000-0000-000000000001',2025,4,'Sarah K.',  89,592,44200),
  ('00000000-0000-0000-0000-000000000001',2025,4,'Peter O.',  86,462,33900),
  ('00000000-0000-0000-0000-000000000001',2025,4,'Grace N.',  83,505,37600),
  ('00000000-0000-0000-0000-000000000001',2025,4,'David W.',  77,421,31400)
ON CONFLICT ("TenantId","Year","Month","DriverName") DO NOTHING;

-- ── Insights ──────────────────────────────────────────────────
INSERT INTO "AnalyticsInsight" ("TenantId","View","Period","Icon","Title","Body","Bg","Bd","SortOrder") VALUES
  -- Operations — week
  ('00000000-0000-0000-0000-000000000001','operations','week','🔥',
   'KAB 002B highest consumption',
   'KAB 002B: 210L this week — 30% above fleet average. Consider a maintenance check or reassign to lighter routes.',
   '#fef2f2','#fca5a5',1),
  ('00000000-0000-0000-0000-000000000001','operations','week','⭐',
   'James M. top driver this week',
   '94 safety score across 47 trips — on track for the monthly performance bonus.',
   '#f0fdf4','#86efac',2),
  ('00000000-0000-0000-0000-000000000001','operations','week','⚡',
   '5% over-speed events above 90 km/h',
   'Concentrated on Route 7 and the Nairobi bypass. Targeted coaching recommended for 3 drivers.',
   '#fffbeb','#fcd34d',3),
  -- Operations — month
  ('00000000-0000-0000-0000-000000000001','operations','month','📉',
   'On-time rate dipped 2pp this month',
   '89.5% vs 91.5% last month. Traffic congestion on Route 3 is the primary contributor.',
   '#fef2f2','#fca5a5',1),
  ('00000000-0000-0000-0000-000000000001','operations','month','⭐',
   'Sarah K. most productive this month',
   '198 trips and 14,920 km with a 90 safety score — fleet-leading output.',
   '#f0fdf4','#86efac',2),
  ('00000000-0000-0000-0000-000000000001','operations','month','⛽',
   'Fuel efficiency stable at 9.0 km/L',
   'Up 2% from last month. KAB 003C leads at 9.8 km/L — eco-driving recognised.',
   '#eff6ff','#93c5fd',3),
  -- Operations — quarter
  ('00000000-0000-0000-0000-000000000001','operations','quarter','📈',
   'Fleet utilization up 5pp quarter-on-quarter',
   '75% active utilization. Expansion onto 5 new routes contributed to the gains.',
   '#f0fdf4','#86efac',1),
  ('00000000-0000-0000-0000-000000000001','operations','quarter','🛡',
   'Harsh braking events down 12%',
   'Safety coaching deployed in Month 2 has measurably reduced harsh braking incidents.',
   '#eff6ff','#93c5fd',2),
  ('00000000-0000-0000-0000-000000000001','operations','quarter','⛽',
   'Fuel efficiency up 7% to 9.4 km/L',
   'Route optimisation and eco-driving programmes are paying off. Best quarter on record.',
   '#fefce8','#fde047',3),
  -- Financial — monthly
  ('00000000-0000-0000-0000-000000000001','financial','monthly','📈',
   'Revenue up 3.5% month-on-month',
   '$26,600 in June — driven by adding 1 new vehicle and full-month billing of April activations.',
   '#f0fdf4','#86efac',1),
  ('00000000-0000-0000-0000-000000000001','financial','monthly','📡',
   'Cellular costs at 9.1% of revenue',
   'Within target (<10%). Safaricom data bundle renegotiation saved $180 vs May rates.',
   '#eff6ff','#93c5fd',2),
  ('00000000-0000-0000-0000-000000000001','financial','monthly','💰',
   'Net margin 63.8% — best in 12 months',
   '$16,980 net after all costs. Improved route density reduced per-trip connectivity spend.',
   '#fefce8','#fde047',3),
  -- Financial — quarterly
  ('00000000-0000-0000-0000-000000000001','financial','quarterly','📈',
   'Q2 2025 highest revenue quarter',
   '$76,350 — 9.1% above Q1. Fleet expansion to 41 vehicles and new API tier contributed.',
   '#f0fdf4','#86efac',1),
  ('00000000-0000-0000-0000-000000000001','financial','quarterly','📡',
   'Cellular costs grew slower than revenue',
   'Telco costs up 9.9% while revenue grew 26.5% year-on-year. Bundle negotiations working.',
   '#eff6ff','#93c5fd',2),
  ('00000000-0000-0000-0000-000000000001','financial','quarterly','⚠️',
   'Q3 2024 revenue dip — investigate',
   'Revenue fell to $63,800 vs $70,200 in Q2. Linked to vehicle downtime and 2 contract pauses.',
   '#fef2f2','#fca5a5',3),
  -- Financial — yearly
  ('00000000-0000-0000-0000-000000000001','financial','yearly','🚀',
   '42.9% revenue CAGR over 4 years',
   'From $168K in 2021 to $302K in 2025. Fleet growth from 28 to 41 vehicles is the primary driver.',
   '#f0fdf4','#86efac',1),
  ('00000000-0000-0000-0000-000000000001','financial','yearly','📡',
   'Cellular cost ratio stable at ~9.1%',
   'Telco spend grew proportionally with fleet — bundle pricing has kept the ratio consistent.',
   '#eff6ff','#93c5fd',2),
  ('00000000-0000-0000-0000-000000000001','financial','yearly','💰',
   '2025 ARR tracking at $302,400',
   'On track to close the year at $302K+. 5 vehicle expansion planned for Q4 adds ~$15K ARR.',
   '#fefce8','#fde047',3),
  -- Sales — monthly
  ('00000000-0000-0000-0000-000000000001','sales','monthly','🏆',
   'June best new-contract month in H1',
   '6 new contracts closed in June — 20% above the monthly average. Direct sales team lead by Alice.',
   '#f0fdf4','#86efac',1),
  ('00000000-0000-0000-0000-000000000001','sales','monthly','🔄',
   'Zero churn in Feb, Apr, Jun',
   'Three churn-free months this year. Onboarding improvements and quarterly reviews are reducing early cancellations.',
   '#eff6ff','#93c5fd',2),
  ('00000000-0000-0000-0000-000000000001','sales','monthly','📊',
   'Pipeline $54K — 2.1× monthly target',
   'Healthy pipeline coverage. 8 proposals in negotiation stage expected to close within 30 days.',
   '#fefce8','#fde047',3),
  -- Sales — quarterly
  ('00000000-0000-0000-0000-000000000001','sales','quarterly','🚀',
   'Q2 2025 — record new contracts (22)',
   '22 new contracts in Q2, up 57% from Q1. Partner channel now accounts for 34% of new business.',
   '#f0fdf4','#86efac',1),
  ('00000000-0000-0000-0000-000000000001','sales','quarterly','⚠️',
   'Q3 2024 churn spike — investigate',
   '5 churns in Q3 2024 — highest in 2 years. Linked to a competitor pricing promotion. Retention package deployed.',
   '#fef2f2','#fca5a5',2),
  ('00000000-0000-0000-0000-000000000001','sales','quarterly','📈',
   'Win rate improving — 28% in Q2 2025',
   'Up from 22% in Q1. Shorter proposal review cycle and new ROI calculator contributed.',
   '#eff6ff','#93c5fd',3),
  -- Sales — yearly
  ('00000000-0000-0000-0000-000000000001','sales','yearly','📈',
   'New contracts up 164% since 2021',
   '28 new deals in 2021 to 74 in 2025. Partner network expansion and inbound marketing are key drivers.',
   '#f0fdf4','#86efac',1),
  ('00000000-0000-0000-0000-000000000001','sales','yearly','🛡',
   'Churn rate declining — 2.6% in 2025',
   'Down from 4.3% in 2021. Customer success programme and annual contract incentives are working.',
   '#eff6ff','#93c5fd',2),
  ('00000000-0000-0000-0000-000000000001','sales','yearly','💰',
   '2025 ARR $302K — on track for $350K by year-end',
   'Q4 expansion of 5 vehicles plus 3 pipeline enterprise deals expected to add $48K ARR.',
   '#fefce8','#fde047',3)
ON CONFLICT ("TenantId","View","Period","Title") DO NOTHING;
