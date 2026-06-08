-- ============================================================
-- Migration 009: Add extended user fields to Users table.
--
-- These fields were previously only stored in the browser's
-- localStorage and were lost on page refresh when loadUsers
-- fetched from the DB. Storing them in the DB makes edits durable.
--
-- Run once:
--   psql -U postgres -d fleetos -f 009_users_extended_fields.sql
-- ============================================================

ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "AdditionalRoles"      JSONB,
  ADD COLUMN IF NOT EXISTS "CustomRoleIds"        JSONB,
  ADD COLUMN IF NOT EXISTS "VehicleId"            TEXT,
  ADD COLUMN IF NOT EXISTS "VehicleIds"           JSONB,
  ADD COLUMN IF NOT EXISTS "RestrictedVehicleIds" JSONB,
  ADD COLUMN IF NOT EXISTS "RestrictedDeviceIds"  JSONB,
  ADD COLUMN IF NOT EXISTS "BranchIds"            JSONB;
