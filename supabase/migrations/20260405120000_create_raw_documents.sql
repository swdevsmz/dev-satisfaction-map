CREATE TABLE public.raw_documents (
  id          BIGSERIAL PRIMARY KEY,
  company_id  TEXT NOT NULL REFERENCES public.companies(id),
  source      TEXT NOT NULL CHECK (source IN ('connpass','openwork','ir','github')),
  url         TEXT,
  content     TEXT NOT NULL,
  scraped_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.raw_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.raw_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public read" ON public.raw_documents
  FOR SELECT TO anon, authenticated USING (true);
