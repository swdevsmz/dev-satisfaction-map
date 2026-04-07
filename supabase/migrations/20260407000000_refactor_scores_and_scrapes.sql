-- ============================================================
-- DB Refactoring: Separate scores from companies
-- ============================================================
-- 1. Create company_scores table (1 company = 1 row)
-- 2. Migrate existing score data from companies → company_scores
-- 3. Drop score columns from companies
-- 4. Rename raw_documents → company_scrapes

-- ============================================================
-- Step 1: Create company_scores table
-- ============================================================
CREATE TABLE public.company_scores (
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

-- Public read access (same as companies)
CREATE POLICY "Public read access"
  ON public.company_scores FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- Step 2: Migrate existing score data
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
  tech_stack_modernity,
  remote_rate,
  estimated_overtime_hours,
  turnover_rate,
  retention_rate,
  dev_environment,
  skill_up_support,
  updated_at
FROM public.companies;

-- ============================================================
-- Step 3: Drop score columns from companies
-- ============================================================
ALTER TABLE public.companies
  DROP COLUMN tech_stack_modernity,
  DROP COLUMN remote_rate,
  DROP COLUMN estimated_overtime_hours,
  DROP COLUMN turnover_rate,
  DROP COLUMN retention_rate,
  DROP COLUMN dev_environment,
  DROP COLUMN skill_up_support;

-- ============================================================
-- Step 4: Rename raw_documents → company_scrapes
-- ============================================================
ALTER TABLE IF EXISTS public.raw_documents RENAME TO company_scrapes;

-- Rename constraint for clarity (if it exists)
-- Note: RENAME CONSTRAINT doesn't support IF EXISTS in older PostgreSQL versions
-- So we use a DO block to safely handle this
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'company_scrapes' AND constraint_name = 'raw_documents_source_check'
  ) THEN
    ALTER TABLE public.company_scrapes
      RENAME CONSTRAINT raw_documents_source_check TO company_scrapes_source_check;
  END IF;
END $$;
