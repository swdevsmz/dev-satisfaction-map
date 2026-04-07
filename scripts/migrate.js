const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSql = `
-- ============================================================
-- Step 1: Create company_scores table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_scores (
  company_id               TEXT PRIMARY KEY
                             REFERENCES public.companies(id) ON DELETE CASCADE,
  tech_stack_modernity     SMALLINT NOT NULL DEFAULT 5  CHECK (tech_stack_modernity BETWEEN 1 AND 10),
  remote_rate              SMALLINT NOT NULL DEFAULT 50 CHECK (remote_rate BETWEEN 0 AND 100),
  estimated_overtime_hours SMALLINT NOT NULL DEFAULT 30 CHECK (estimated_overtime_hours >= 0),
  turnover_rate            SMALLINT NOT NULL DEFAULT 15 CHECK (turnover_rate BETWEEN 0 AND 100),
  retention_rate           SMALLINT NOT NULL DEFAULT 80 CHECK (retention_rate BETWEEN 0 AND 100),
  dev_environment          SMALLINT NOT NULL DEFAULT 5  CHECK (dev_environment BETWEEN 1 AND 10),
  skill_up_support         SMALLINT NOT NULL DEFAULT 5  CHECK (skill_up_support BETWEEN 1 AND 10),
  scored_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for company_scores
ALTER TABLE public.company_scores ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public read access" ON public.company_scores;
CREATE POLICY "Public read access"
  ON public.company_scores FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- Step 2: Migrate existing score data (if companies still has scores)
-- ============================================================
INSERT INTO public.company_scores (
  company_id,
  tech_stack_modernity,
  remote_rate,
  estimated_overtime_hours,
  turnover_rate,
  retention_rate,
  dev_environment,
  skill_up_support,
  scored_at
)
SELECT
  id,
  COALESCE(tech_stack_modernity, 5),
  COALESCE(remote_rate, 50),
  COALESCE(estimated_overtime_hours, 30),
  COALESCE(turnover_rate, 15),
  COALESCE(retention_rate, 80),
  COALESCE(dev_environment, 5),
  COALESCE(skill_up_support, 5),
  updated_at
FROM public.companies
ON CONFLICT (company_id) DO NOTHING;

-- ============================================================
-- Step 3: Drop score columns from companies (if they exist)
-- ============================================================
ALTER TABLE public.companies
  DROP COLUMN IF EXISTS tech_stack_modernity,
  DROP COLUMN IF EXISTS remote_rate,
  DROP COLUMN IF EXISTS estimated_overtime_hours,
  DROP COLUMN IF EXISTS turnover_rate,
  DROP COLUMN IF EXISTS retention_rate,
  DROP COLUMN IF EXISTS dev_environment,
  DROP COLUMN IF EXISTS skill_up_support;

-- ============================================================
-- Step 4: Rename raw_documents → company_scrapes
-- ============================================================
ALTER TABLE IF EXISTS public.raw_documents RENAME TO company_scrapes;

ALTER TABLE IF EXISTS public.company_scrapes
  RENAME CONSTRAINT IF EXISTS raw_documents_source_check TO company_scrapes_source_check;
`;

async function migrate() {
  try {
    console.log('🚀 Starting migration...');

    const { error } = await supabase.rpc('exec', { sql: migrationSql });

    if (error) {
      // RPC method doesn't exist, try direct SQL
      console.log('⚠️  RPC method not available, attempting direct SQL...');
      const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ sql: migrationSql }),
      });

      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${await result.text()}`);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 Tables created:');
    console.log('  - company_scores (new)');
    console.log('  - companies (updated, scores removed)');
    console.log('  - company_scrapes (renamed from raw_documents)');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
