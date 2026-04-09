-- ============================================================
-- Add bonus columns to company_scores
-- ============================================================
-- The existing schema stores the 7 base indicators only.
-- This migration adds the bonus score columns used by the new
-- "bonus point" scoring spec and backfills existing rows to 0.

ALTER TABLE public.company_scores
  ADD COLUMN IF NOT EXISTS github_activity_bonus SMALLINT NOT NULL DEFAULT 0
    CHECK (github_activity_bonus BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS connpass_bonus SMALLINT NOT NULL DEFAULT 0
    CHECK (connpass_bonus BETWEEN 0 AND 5);

UPDATE public.company_scores
SET
  github_activity_bonus = COALESCE(github_activity_bonus, 0),
  connpass_bonus = COALESCE(connpass_bonus, 0);
