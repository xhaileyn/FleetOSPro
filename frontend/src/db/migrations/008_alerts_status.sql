-- ============================================================
-- Migration 008: Extend Alerts table with lifecycle status,
--               operator response, and closed-at timestamp.
--
-- Run once against the fleetos database:
--   psql -U postgres -d fleetos -f 008_alerts_status.sql
-- ============================================================

-- Status: Active | Acknowledged | Closed
-- Derived from Acknowledged initially; kept in sync going forward.
ALTER TABLE "Alerts"
  ADD COLUMN IF NOT EXISTS "Status"           TEXT        NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS "OperatorResponse" TEXT,
  ADD COLUMN IF NOT EXISTS "OperatorName"     TEXT,
  ADD COLUMN IF NOT EXISTS "ClosedAt"         TIMESTAMPTZ;

-- Back-fill Status from legacy Acknowledged boolean
UPDATE "Alerts"
  SET "Status" = 'Acknowledged'
  WHERE "Acknowledged" = true AND "Status" = 'Active';
