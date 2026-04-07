-- companies テーブルに初期データを投入（基本情報のみ）
INSERT INTO public.companies (id, name, industry, location)
VALUES
  ('rakuten',         '楽天グループ',         'EC・フィンテック',   '東京都渋谷区'),
  ('line-corp',       'LINEヤフー',           'SNS・メディア',      '東京都千代田区'),
  ('gmo-internet',    'GMOインターネット',     'インターネット',     '東京都渋谷区'),
  ('mixi',            'MIXI',                 'SNS・ゲーム',        '東京都渋谷区'),
  ('cookpad',         'クックパッド',          'フードテック',       '東京都渋谷区'),
  ('wantedly',        'ウォンテッドリー',      'HRテック',          '東京都港区'),
  ('money-forward',   'マネーフォワード',      'フィンテック',       '東京都港区'),
  ('wealthnavi',      'ウェルスナビ',          'フィンテック',       '東京都渋谷区'),
  ('sakura-internet', 'さくらインターネット',  'クラウド・インフラ', '大阪府大阪市')
ON CONFLICT (id) DO NOTHING;

-- company_scores テーブルに暫定スコアを投入
INSERT INTO public.company_scores (company_id, tech_stack_modernity, remote_rate, estimated_overtime_hours, turnover_rate, retention_rate, dev_environment, skill_up_support)
VALUES
  ('rakuten',         5, 50, 30, 15, 80, 5, 5),
  ('line-corp',       5, 50, 30, 15, 80, 5, 5),
  ('gmo-internet',    5, 50, 30, 15, 80, 5, 5),
  ('mixi',            5, 50, 30, 15, 80, 5, 5),
  ('cookpad',         5, 50, 30, 15, 80, 5, 5),
  ('wantedly',        5, 50, 30, 15, 80, 5, 5),
  ('money-forward',   5, 50, 30, 15, 80, 5, 5),
  ('wealthnavi',      5, 50, 30, 15, 80, 5, 5),
  ('sakura-internet', 5, 50, 30, 15, 80, 5, 5)
ON CONFLICT (company_id) DO NOTHING;
