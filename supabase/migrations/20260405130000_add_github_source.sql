-- raw_documents の source CHECK 制約に 'github' を追加
ALTER TABLE public.raw_documents
  DROP CONSTRAINT IF EXISTS raw_documents_source_check;

ALTER TABLE public.raw_documents
  ADD CONSTRAINT raw_documents_source_check
  CHECK (source IN ('connpass','openwork','ir','github'));
