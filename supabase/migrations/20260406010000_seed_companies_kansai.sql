INSERT INTO public.companies (id, name, industry, location)
VALUES
  ('nintendo',          '任天堂',                         'ゲーム・エンタメ',         '京都府京都市'),
  ('capcom',            'カプコン',                       'ゲーム',                   '大阪府大阪市'),
  ('omron',             'オムロン',                       '産業・IoT',                '京都府京都市'),
  ('rakus',             'ラクス',                         'SaaS・クラウド',           '大阪府大阪市'),
  ('ntt-west',          'NTT西日本',                      '通信・ITサービス',         '大阪府大阪市'),
  ('sharp',             'シャープ',                       '電機・IoT',                '大阪府堺市'),
  ('kyocera',           '京セラ',                         '電機・精密機器',           '京都府京都市'),
  ('murata',            '村田製作所',                     '電子部品・IoT',            '京都府長岡京市'),
  ('iridge',            'アイリッジ',                     'アプリマーケ・SaaS',       '大阪府大阪市'),
  ('aiming',            'Aiming',                         'ゲーム・スマホ',           '東京都千代田区'),
  ('medley',            'メドレー',                       'ヘルステック・HRテック',   '東京都港区'),
  ('lifull',            'LIFULL',                         '不動産テック',             '東京都千代田区'),
  ('brainpad',          'ブレインパッド',                 'データ分析・AI',           '東京都港区'),
  ('usetech',           'ユーステクノロジー',             'SaaS・マーケティング',     '大阪府大阪市'),
  ('daikin',            'ダイキン工業',                   '空調・DX',                 '大阪府大阪市'),
  ('panasonic-connect', 'パナソニック コネクト',          'IoT・エンタープライズIT',  '大阪府門真市'),
  ('ines',              'アイネス',                       'SIer・ITサービス',         '大阪府大阪市'),
  ('system-exe',        'システムエグゼ',                 'SIer・金融システム',       '大阪府大阪市'),
  ('osaka-gas',         '大阪ガス（ITソリューション）',   'エネルギー・DX',           '大阪府大阪市'),
  ('techfirm',          'テックファーム',                 'Webシステム開発',          '大阪府大阪市')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.company_scores (company_id, tech_stack_modernity, remote_rate, estimated_overtime_hours, turnover_rate, retention_rate, dev_environment, skill_up_support)
VALUES
  ('nintendo',            5, 50, 30, 15, 80, 5, 5),
  ('capcom',              5, 50, 30, 15, 80, 5, 5),
  ('omron',               5, 50, 30, 15, 80, 5, 5),
  ('rakus',               5, 50, 30, 15, 80, 5, 5),
  ('ntt-west',            5, 50, 30, 15, 80, 5, 5),
  ('sharp',               5, 50, 30, 15, 80, 5, 5),
  ('kyocera',             5, 50, 30, 15, 80, 5, 5),
  ('murata',              5, 50, 30, 15, 80, 5, 5),
  ('iridge',              5, 50, 30, 15, 80, 5, 5),
  ('aiming',              5, 50, 30, 15, 80, 5, 5),
  ('medley',              5, 50, 30, 15, 80, 5, 5),
  ('lifull',              5, 50, 30, 15, 80, 5, 5),
  ('brainpad',            5, 50, 30, 15, 80, 5, 5),
  ('usetech',             5, 50, 30, 15, 80, 5, 5),
  ('daikin',              5, 50, 30, 15, 80, 5, 5),
  ('panasonic-connect',   5, 50, 30, 15, 80, 5, 5),
  ('ines',                5, 50, 30, 15, 80, 5, 5),
  ('system-exe',          5, 50, 30, 15, 80, 5, 5),
  ('osaka-gas',           5, 50, 30, 15, 80, 5, 5),
  ('techfirm',            5, 50, 30, 15, 80, 5, 5)
ON CONFLICT (company_id) DO NOTHING;
