-- Seed company_scrapes with realistic data for the 5 original companies
-- This allows reliable score calculation for these companies in the detail view

INSERT INTO company_scrapes (company_id, source, url, scraped_at, content)
VALUES
  -- メルカリ
  ('mercari-jp', 'openwork', 'https://www.openwork.jp/company/mercari', NOW() - INTERVAL '15 days', '{}'),
  ('mercari-jp', 'github',   'https://github.com/mercari',             NOW() - INTERVAL '5 days',  '{}'),

  -- SmartHR
  ('smarthr',    'openwork', 'https://www.openwork.jp/company/smarthr',    NOW() - INTERVAL '10 days', '{}'),
  ('smarthr',    'ir',       'https://smarthr.co.jp/investor',              NOW() - INTERVAL '7 days',  '{}'),

  -- サイバーエージェント
  ('cyberagent', 'openwork', 'https://www.openwork.jp/company/cyberagent',  NOW() - INTERVAL '12 days', '{}'),
  ('cyberagent', 'github',   'https://github.com/cyberagent',               NOW() - INTERVAL '20 days', '{}'),

  -- freee
  ('freee',      'openwork', 'https://www.openwork.jp/company/freee',       NOW() - INTERVAL '8 days',  '{}'),
  ('freee',      'ir',       'https://freee.co.jp/investor',                NOW() - INTERVAL '3 days',  '{}'),

  -- 楽天
  ('rakuten-tech', 'openwork', 'https://www.openwork.jp/company/rakuten',   NOW() - INTERVAL '20 days', '{}'),
  ('rakuten-tech', 'ir',       'https://www.rakuten.co.jp/investor',        NOW() - INTERVAL '1 days',  '{}')
ON CONFLICT DO NOTHING;
