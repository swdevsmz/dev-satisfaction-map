INSERT INTO public.companies
  (id, name, description, industry, employee_count, location, tags,
   tech_stack_modernity, remote_rate, estimated_overtime_hours,
   turnover_rate, retention_rate, dev_environment, skill_up_support)
VALUES
  ('mercari-jp', 'メルカリ', 'Go・Kubernetesを中心としたモダンなマイクロサービスアーキテクチャ。フルリモート可で自律的な働き方を推奨。', 'ECプラットフォーム', 2000, '東京都港区', ARRAY['Go','Kubernetes','React','リモートOK','フルスタック'], 9, 90, 15, 18, 82, 9, 8),
  ('smarthr', 'SmartHR', 'HR Techのリーディングカンパニー。Ruby on Rails + ReactのモダンなSaaS開発。定着率が高く心理的安全性を重視。', 'HR Tech / SaaS', 800, '東京都港区', ARRAY['Ruby','React','TypeScript','リモートOK','SaaS'], 8, 95, 10, 8, 92, 8, 7),
  ('cyberagent', 'サイバーエージェント', 'Abema TVやAmeba等の大規模サービスを展開。技術カンファレンス参加支援が充実。', 'インターネット総合', 6000, '東京都渋谷区', ARRAY['Go','Kotlin','Swift','Scala','スキルアップ支援充実'], 7, 60, 30, 25, 75, 7, 9),
  ('freee', 'freee', 'クラウド会計・HR SaaSのパイオニア。開発環境への投資が手厚い。', 'FinTech / SaaS', 1500, '東京都品川区', ARRAY['Ruby','Java','React','TypeScript','リモート可'], 7, 80, 20, 15, 85, 9, 7),
  ('rakuten-tech', '楽天テクノロジー', '楽天グループの巨大なシステム基盤を支える。スケールの大きな課題に取り組める。', 'ECプラットフォーム / 金融', 28000, '東京都世田谷区', ARRAY['Java','PHP','大規模システム','グローバル'], 4, 40, 45, 30, 70, 5, 5)
ON CONFLICT (id) DO NOTHING;
