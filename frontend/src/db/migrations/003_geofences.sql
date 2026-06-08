-- ============================================================
-- Migration 003: Geofences table
-- Isolation levels:
--   Tenant  → TenantId UUID (hard boundary between tenants)
--   User    → CreatedBy + Visibility ('tenant' | 'private')
--   Vehicle → VehicleIds JSONB  (empty = applies to all tenant vehicles)
-- ============================================================

CREATE TABLE IF NOT EXISTS "Geofences" (
  "Id"         UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "ShortId"    TEXT             NOT NULL UNIQUE,

  -- Tenant-level isolation
  "TenantId"   UUID             NOT NULL,

  "Name"       TEXT             NOT NULL,
  "Type"       TEXT             NOT NULL DEFAULT 'Home base',
  "Shape"      TEXT             NOT NULL DEFAULT 'circle',   -- 'circle' | 'polygon'
  "Lat"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "Lng"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "Radius"     DOUBLE PRECISION NOT NULL DEFAULT 500,
  "Points"     JSONB,                                        -- [[lat,lng], ...] for polygons
  "Status"     TEXT             NOT NULL DEFAULT 'Active',   -- 'Active' | 'Inactive'
  "Triggers"   JSONB            NOT NULL DEFAULT '["Entry","Exit"]'::jsonb,
  "Inside"     INTEGER          NOT NULL DEFAULT 0,

  -- User-level isolation
  "CreatedBy"  TEXT,                                         -- userId or email of creator
  "Visibility" TEXT             NOT NULL DEFAULT 'tenant',   -- 'tenant' | 'private'

  -- Vehicle-level isolation (empty array = applies to every vehicle in tenant)
  "VehicleIds" JSONB            NOT NULL DEFAULT '[]'::jsonb,

  "CreatedAt"  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "UpdatedAt"  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_geofences_tenant"     ON "Geofences"("TenantId");
CREATE INDEX IF NOT EXISTS "idx_geofences_created_by" ON "Geofences"("CreatedBy");
CREATE INDEX IF NOT EXISTS "idx_geofences_status"     ON "Geofences"("Status");

-- Optional: Row-Level Security (mirrors the policy in isolationData.ts)
-- ALTER TABLE "Geofences" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_geofences_isolation ON "Geofences"
--   USING      ("TenantId" = current_setting('app.tenant_id')::uuid)
--   WITH CHECK ("TenantId" = current_setting('app.tenant_id')::uuid);
