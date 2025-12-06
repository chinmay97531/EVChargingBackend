-- Safe migration: add createdAt and updatedAt to Car without data loss
-- Steps:
-- 1) Add nullable columns with defaults for new rows
-- 2) Backfill existing rows with current timestamp
-- 3) Make columns NOT NULL

BEGIN;

-- 1) Add nullable timestamp columns (allow nulls so this step is non-destructive)
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- 1b) Set defaults for future inserts
ALTER TABLE "Car" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Car" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- 2) Backfill existing rows: set timestamps to NOW() where null
UPDATE "Car" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
UPDATE "Car" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- 3) Make columns NOT NULL now that all rows have values
ALTER TABLE "Car" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Car" ALTER COLUMN "updatedAt" SET NOT NULL;

COMMIT;
