-- Ensure website column exists on companies table
-- This is idempotent and safe if column already exists

ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;
