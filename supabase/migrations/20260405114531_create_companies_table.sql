-- companies テーブル
CREATE TABLE public.companies (
  id                       TEXT PRIMARY KEY,
  name                     TEXT NOT NULL,
  description              TEXT NOT NULL DEFAULT '',
  industry                 TEXT NOT NULL DEFAULT '',
  employee_count           INTEGER NOT NULL DEFAULT 0,
  location                 TEXT NOT NULL DEFAULT '',
  tags                     TEXT[] NOT NULL DEFAULT '{}',
  tech_stack_modernity     SMALLINT NOT NULL CHECK (tech_stack_modernity BETWEEN 1 AND 10),
  remote_rate              SMALLINT NOT NULL CHECK (remote_rate BETWEEN 0 AND 100),
  estimated_overtime_hours SMALLINT NOT NULL CHECK (estimated_overtime_hours >= 0),
  turnover_rate            SMALLINT NOT NULL CHECK (turnover_rate BETWEEN 0 AND 100),
  retention_rate           SMALLINT NOT NULL CHECK (retention_rate BETWEEN 0 AND 100),
  dev_environment          SMALLINT NOT NULL CHECK (dev_environment BETWEEN 1 AND 10),
  skill_up_support         SMALLINT NOT NULL CHECK (skill_up_support BETWEEN 1 AND 10),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS（匿名ユーザーに読み取り許可）
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON public.companies FOR SELECT
  TO anon, authenticated USING (true);
