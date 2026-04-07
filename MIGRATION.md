# DB Supabase マイグレーション手順

このファイルは Supabase ダッシュボード の SQL Editor で実行するための SQL を含みます。

## 手順

1. ブラウザで Supabase ダッシュボード を開く：
   - https://supabase.com/dashboard

2. プロジェクト選択 → **SQL Editor** をクリック

3. **+ New Query** をクリック

4. 下記の SQL **全体** をコピーして SQL Editor にペースト

5. **Run** ボタンをクリック

---

## 実行する SQL

```sql
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

ALTER TABLE public.company_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.company_scores;
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
-- Step 3: Drop score columns from companies
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
```

---

## 実行後の確認

```sql
-- テーブル確認
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- company_scores テーブル確認（行数が company と同じはず）
SELECT COUNT(*) as count FROM public.company_scores;
SELECT COUNT(*) as count FROM public.companies;

-- company_scrapes テーブル確認（旧 raw_documents）
SELECT COUNT(*) as count FROM public.company_scrapes;
```

実行後、アプリを再起動（`npm run dev`）してください。
