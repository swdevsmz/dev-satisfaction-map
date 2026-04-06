-- companies テーブルに初期データを投入（パイプラインが上書きする暫定値）
INSERT INTO public.companies (id, name, industry, location, tech_stack_modernity, remote_rate, estimated_overtime_hours, turnover_rate, retention_rate, dev_environment, skill_up_support)
VALUES
  ('rakuten',         '楽天グループ',         'EC・フィンテック',   '東京都渋谷区', 5, 50, 30, 15, 80, 5, 5),
  ('line-corp',       'LINEヤフー',           'SNS・メディア',      '東京都千代田区', 5, 50, 30, 15, 80, 5, 5),
  ('gmo-internet',    'GMOインターネット',     'インターネット',     '東京都渋谷区', 5, 50, 30, 15, 80, 5, 5),
  ('mixi',            'MIXI',                 'SNS・ゲーム',        '東京都渋谷区', 5, 50, 30, 15, 80, 5, 5),
  ('cookpad',         'クックパッド',          'フードテック',       '東京都渋谷区', 5, 50, 30, 15, 80, 5, 5),
  ('wantedly',        'ウォンテッドリー',      'HRテック',          '東京都港区',   5, 50, 30, 15, 80, 5, 5),
  ('money-forward',   'マネーフォワード',      'フィンテック',       '東京都港区',   5, 50, 30, 15, 80, 5, 5),
  ('wealthnavi',      'ウェルスナビ',          'フィンテック',       '東京都渋谷区', 5, 50, 30, 15, 80, 5, 5),
  ('sakura-internet', 'さくらインターネット',  'クラウド・インフラ', '大阪府大阪市', 5, 50, 30, 15, 80, 5, 5)
ON CONFLICT (id) DO NOTHING;
