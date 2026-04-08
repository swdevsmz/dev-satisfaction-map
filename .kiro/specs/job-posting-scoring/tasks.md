# 実装計画: job-posting-scoring

---

## Phase 0: スキーマ・基盤準備

### 0.1 Supabase スキーマ拡張とマイグレーション
- [ ] 0.1 (P) Supabase `company_scores` テーブルのスキーマ設計・実装
  - フィールド定義: company_id (FK)、tech_stack_score (0-100)、tech_stack_confidence (0-1)、dev_environment_score (0-100)、dev_environment_details (JSON)、skill_support_score (0-100)、skill_support_factors (JSON)、evaluated_at、updated_at、confidence_flag (bool)
  - インデックス設定: company_id での高速検索、evaluated_at での時系列クエリ
  - Foreign Key 制約: company_id → companies.id
  - _Requirements: 9.1, 9.2_

### 0.2 設定管理基盤の構築
- [ ] 0.2 (P) Configuration Manager と環境変数管理の実装
  - .env テンプレートファイル作成: Ollama URL、スコアリング権重、並列処理数、Supabase 接続情報、API キー
  - 環境変数バリデーション: 不正値時はデフォルト値を使用、警告ログ出力
  - MOCK_MODE フラグ対応: テスト実行時の外部 API モック制御
  - クレデンシャル情報は環境変数から読み込み、設定ファイルに含めない
  - _Requirements: 14.1, 14.4, 14.5, 15.2_

### 0.3 ロギング・メトリクス基盤の初期化
- [ ] 0.3 (P) Logging System と Monitoring 基盤の構築
  - 構造化 JSON ロギング設定: ISO 8601 タイムスタンプ、ログレベル、モジュール名、コンテキスト情報
  - 月次ごとに独立したログファイル生成: job-posting-scoring-YYYY-MM-DD.log 形式
  - Prometheus メトリクス初期化: カウンター、ガウジ、ヒストグラム定義
  - エラーメトリクス記録機構の構築
  - _Requirements: 10.3, 10.4, 10.5, 13.4_

---

## Phase 1: 求人情報スクレイパー実装

### 1.1 Job Posting Scraper Orchestrator 実装
- [ ] 1.1 Job Posting Scraper Orchestrator の実装
  - 複数スクレイパー（Wantedly、Indeed、LAPRAS）の並列実行管理（ThreadPoolExecutor、max_workers=5）
  - 企業単位でのスクレイピングタスク投入と結果収集
  - 重複企業の自動検出・統合（last_scraped_at タイムスタンプで判定）
  - スクレイピング失敗時のリトライ管理（最大 3 回）とタイムアウト処理（デフォルト 300 秒）
  - スクレイピングメタデータのログ記録: 取得元、取得日時、レコード件数
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

### 1.2 求人情報スクレイパー Adapter 実装
- [ ] 1.2 (P) Wantedly HTML スクレイパー Adapter 実装
  - Wantedly 企業ページからの HTML パース（BeautifulSoup4）
  - データ抽出: 企業名、業種、求人タイトル、職務記述書、技術スタック表記、開発環境言及
  - 取得データの正規化: テキスト前処理（ホワイトスペース除去、エンコード統一）
  - エラーハンドリング: HTTP エラー、パースエラーの詳細ログ出力
  - _Requirements: 1.1, 1.2_

- [ ] 1.3 (P) Indeed JavaScript スクレイパー Adapter 実装
  - Indeed の動的 JavaScript 対応（Playwright ブラウザ自動化）
  - ページロード完了待機とデータ抽出タイミングの制御
  - 同一企業複数求人の統合処理
  - 正規化されたデータ出力（Wantedly Adapter と同一スキーマ）
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 1.4 (P) LAPRAS スクレイパー Adapter 実装
  - LAPRAS API または HTML スクレイピングによるデータ取得
  - 企業情報、技術スタック、開発環境情報の抽出
  - Wantedly/Indeed と同一の正規化スキーマへの変換
  - データソース固有のエラーハンドリング
  - _Requirements: 1.1, 1.2_

---

## Phase 2: エンタープライズデータ統合層

### 2.1 Enterprise Data Orchestrator 実装
- [ ] 2.1 Enterprise Data Orchestrator の実装
  - OpenWork、GitHub、Connpass データ取得の並列実行管理
  - 各コレクターのエラーハンドリング: 部分失敗は失敗企業をログに記録して処理継続
  - 進捗管理とタイムアウト制御
  - スキップされた企業の追跡ログ記録
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

### 2.2 OpenWork 統合実装
- [ ] 2.2 (P) OpenWork Data Collector 実装
  - OpenWork API（またはスクレイピング）による企業データ取得
  - 離職率（turnover_rate）、平均残業時間（avg_overtime_hours）、社員レビュー文の取得
  - UTF-8 正規化処理: 多言語対応（日本語・英語混在）
  - 個人情報匿名化: 社員氏名、部門名などの削除
  - 90 日以上古いデータの検出とフラグ設定
  - 取得失敗時のグレースフル処理（WARN ログ出力）
  - _Requirements: 2.1, 2.3, 2.5, 12.2_

### 2.3 GitHub 統合実装
- [ ] 2.3 (P) GitHub Organization Collector 実装
  - GitHub API（PyGithub または requests）による Organization データ取得
  - 公開リポジトリのみを対象にフィルタリング
  - 言語分布分析: 各言語の使用率、直近更新日、スター数
  - 技術スタック現況の推定（言語分布から）
  - API レート制限チェック: 制限到達時は翌日に延期（キャッシュから当日はキャッシュ値を使用）
  - GitHub API エラーハンドリングの詳細ログ記録
  - _Requirements: 2.2, 2.4_

### 2.4 Connpass イベント分析実装
- [ ] 2.4 (P) Connpass Event Analyzer 実装
  - Connpass API（または Web スクレイピング）による企業参加イベント検索
  - 過去 1 年の参加イベント集計: イベント開催回数、参加人数、技術カテゴリ
  - メトリクス計算: 参加者数/社員数比率、平均イベント参加頻度、技術カテゴリ多様性スコア
  - データなし企業の処理: 「データなし」フラグを立てて処理継続
  - 月別時系列データの保存準備（Supabase 補助テーブル用）
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

---

## Phase 3: NLP エンジン・テキスト処理

### 3.1 Text Preprocessing Layer 実装
- [ ] 3.1 Text Preprocessing Layer の実装
  - テキスト長制限: 10,000 文字超過時は最初の 10,000 文字に切り詰め
  - 多言語対応トークン化: 日本語・英語混在テキストの統一トークン化（nltk、janome、または MeCab）
  - 個人情報匿名化フィルター: メールアドレス、電話番号、個人名パターンの削除
  - ホワイトスペース正規化: タブ、改行、複数スペースの統一処理
  - テキストエンコーディング統一: UTF-8 への変換と妥当性チェック
  - _Requirements: 2.5, 4.3, 4.4, 12.2_

### 3.2 Ollama NLP Engine 実装
- [ ] 3.2 Ollama NLP Engine の実装
  - Ollama サーバー連携: llama2 または mistral モデルの呼び出し
  - プロンプト設計: 技術スタックキーワード、開発環境言及、スキルアップ施策の抽出
  - JSON 出力パース: detected_technologies、environment_keywords、skill_support_indicators、confidence_score (0.0-1.0) フィールドの構造化
  - 3 回独立解析の実装: 各テキストに対して異なるシード値で 3 回実行
  - 信頼度加重平均計算: 3 回の結果から confidence_score の平均値と各キーワードのスコア算出
  - タイムアウト処理: 30 秒でタイムアウト、フォールバック値（confidence=0.5、空キーワード配列）を返却
  - モックモード対応: MOCK_MODE=true 時はプリセット解析結果を返却
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 10.2, 15.3_

---

## Phase 4: スコアリングエンジン実装

### 4.1 Tech Stack Scoring Engine 実装
- [ ] 4.1 (P) Tech Stack Scoring Engine の実装
  - Ollama から抽出された技術キーワード（detected_technologies）の解析
  - モダンスタック評価: React、Vue、Svelte、TypeScript、Go、Rust などを基準年の相対スコアで評価（0-100）
  - 古い技術の減点: PHP5 以前、Flash などの検出時に減点適用
  - 言語バージョン区別: Python 3.x vs 2.7、Java 8 vs 11+ などの区別
  - 未検出技術の扱い: 中立スコア（デフォルト 50）を採用
  - Confidence 信頼度スレッショルド: confidence_score < 0.6 のときはデフォルト値（50）を採用
  - 監査ログ記録: 抽出キーワード、スコアリングロジック、最終スコアを JSON 形式で記録
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

### 4.2 Dev Environment Scoring Engine 実装
- [ ] 4.2 (P) Dev Environment Scoring Engine の実装
  - 開発環境キーワード検出: リモートワーク、IDE ライセンス、高性能ハードウェア、CI/CD、Docker/Kubernetes
  - ボーナススコア計算規則:
    - リモートワーク検出 → +20
    - Docker/Kubernetes 検出 → +15
    - IDE ライセンス、高性能ハードウェア各々 → +10
  - Diminishing returns 適用: 同一カテゴリ複数検出時は対数関数的減衰（2 回目以降の加算を 50% に削減、以降さらに減衰）
  - ベーススコア: 0 から開始、各ボーナスの合算で 100 を上限
  - 詳細内訳の JSON 記録: 検出されたキーワード、適用ルール、各ステップのスコア推移
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

### 4.3 Skill Support Scoring Engine 実装
- [ ] 4.3 (P) Skill Support Scoring Engine の実装
  - スキル支援指標検出: 研修制度、資格取得支援、書籍購入補助、学習時間確保、カンファレンス参加補助、Connpass 参加実績
  - ボーナススコア計算規則:
    - 研修制度検出 → +15
    - 学習時間確保・Google/AWS 認定資格支援検出 → +20
    - Connpass 参加者数/社員数比 >= 0.5 → +10
  - 言語検出と条件分岐: テキスト言語が日本語のみの場合は英語キーワード検索をスキップ
  - Connpass データの活用: Event Analyzer から得られた参加比率を引き継ぎ
  - スコア要因の詳細 JSON 記録: 検出指標、適用ボーナス、最終スコア
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

### 4.4 Scoring Orchestrator 実装
- [ ] 4.4 Scoring Orchestrator の実装
  - 3 つのスコアリングエンジン（Tech Stack、Dev Environment、Skill Support）の並列実行管理
  - 個別スコアの結果収集と統合
  - スコア計算根拠の統一管理: すべてのスコア計算ロジックと根拠を JSON 形式で記録
  - エラーハンドリング: 個別エンジン失敗時のグレースフル処理（デフォルト値採用、失敗ログ出力）
  - _Requirements: 5.1, 6.1, 7.1_

---

## Phase 5: 月次オーケストレーション・永続化・運用

### 5.1 Job Scoring Orchestrator（月次パイプライン）実装
- [ ] 5.1 Job Scoring Orchestrator（月次スケジューラー）の実装
  - 毎月 1 日午前 2 時のスケジュール設定: APScheduler（開発）、systemd timer/cron（本番）
  - 5 ステップの順序実行: (1) 求人情報スクレイピング、(2) エンタープライズデータ取得、(3) Ollama テキスト解析、(4) スコアリング計算、(5) Supabase へのデータ保存
  - エラー制御:
    - ステップ 1（スクレイピング）失敗時は残り全ステップをスキップ、管理者へメール通知
    - ステップ 2-4（データ取得・解析・スコアリング）の部分失敗は失敗企業をログに記録して処理継続
  - リソース監視:
    - メモリ使用量 > 2GB の場合はキャッシュ自動クリア
    - CPU 使用率 >= 80% の場合は並列処理数を自動削減
  - パフォーマンス計測と制約検証:
    - スクレイピング 1 企業あたり平均 5 秒以内
    - Ollama テキスト解析（3 回分）1 企業あたり平均 10 秒以内
    - 全体で 500 企業を 60 分以内に完了
  - 実行ログ記録: 開始時刻、終了時刻、処理企業数、失敗企業数、全エラーメッセージ、実行結果サマリーレポート
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 11.1, 11.4, 11.5, 11.6_

### 5.2 Data Persistence Layer 実装
- [ ] 5.2 Data Persistence Layer（Supabase 永続化）の実装
  - `company_scores` テーブルへのバッチ upsert 実装: company_id をキーに INSERT または UPDATE
  - 保存フィールド: tech_stack_score、tech_stack_confidence、dev_environment_score、dev_environment_details、skill_support_score、skill_support_factors、evaluated_at、updated_at
  - 重複チェック: company_id に基づく一意性制約とアップデート戦略
  - 接続リトライ: Supabase タイムアウト時に最大 3 回の自動リトライ、最終失敗時はエラーログ出力
  - 信頼度フラグ: confidence < 0.6 の企業に confidence_flag = true を設定
  - 監査ログ: すべての INSERT/UPDATE 操作と件数、操作タイムスタンプ、実行ユーザー情報を JSON ログに記録
  - テストモード対応: MOCK_MODE または テスト環境フラグが有効な場合は `test_company_scores` テーブルに保存
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 15.4_

### 5.3 Error Handler & Logger 実装
- [ ] 5.3 Error Handler & Logger の実装
  - 構造化 JSON ログ出力: [ISO 8601 タイムスタンプ] [ログレベル] [モジュール名] [メッセージ] [コンテキスト JSON]
  - エラーログ記録: エラー内容、処理企業 ID、エラータイプ、スタックトレース
  - リトライ・スキップ判定: 処理可能なエラー（API タイムアウト等）は自動リトライ、不可能なエラー（設定エラー等）はスキップして処理継続
  - ログファイル管理: 月次ごとに独立したログファイル作成、ファイル名に日付を含める（job-posting-scoring-YYYY-MM-DD.log）
  - メトリクス記録: エラーをメトリクス（Prometheus カウンター）として記録、エラータイプ別の集計
  - ロギングレベル管理: DEBUG、INFO、WARN、ERROR レベルの適切な使い分け
  - _Requirements: 10.1, 10.3, 10.4, 10.5_

### 5.4 Monitoring & Alerting System 実装
- [ ] 5.4 Monitoring & Alerting System の実装
  - アラート条件判定と発火:
    - 企業スコアリング失敗率 >= 10% → アラート
    - 平均処理時間 > 15 秒 → アラート
    - Ollama モデル応答時間 > 30 秒 → アラート
    - Supabase 接続エラー発生 → アラート
  - メール通知: アラート発火時に管理者へ自動通知（件名、詳細、推奨アクション含む）
  - メトリクス記録: 成功企業数、失敗企業数、平均処理時間、信頼度分布、データ品質スコア
  - リアルタイムメトリクス: 処理中の進捗メトリクスを Prometheus に記録
  - メトリクス履歴保存: 7 日分の履歴保存でトレンド分析を可能化
  - ダッシュボード保存: 月次実行完了後にサマリーレポートを DB 補助テーブルに保存
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

### 5.5 Data Privacy Handler 実装
- [ ] 5.5 Data Privacy Handler（データセキュリティ）の実装
  - robots.txt 遵守: スクレイピング前に各 URL の robots.txt を確認、許可されたパスのみへのアクセス
  - スクレイピング頻度制限: 1 日 1 回以下に制限（設定値で調整可能）
  - 個人情報匿名化: 社員氏名、部門名、メールアドレス、電話番号パターンの削除（OpenWork データ等）
  - GitHub フィルタリング: 公開リポジトリのみを対象、プライベートリポジトリはスキップ
  - テキスト暗号化: Supabase 保存時に職務記述書、社員レビュー等のテキストフィールドを AES-256 で暗号化
  - ログサニタイズ: スクレイピングログから IP アドレス、ユーザーエージェント情報を削除
  - HTTPS 強制: すべての外部 API 呼び出しに HTTPS を使用
  - データ保持期間管理: 取得データ保持期間を設定（デフォルト 3 年）、期限経過データの自動削除タスク
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

---

## Phase 6: テスト・統合・ドキュメント

### 6.1 ユニットテストの実装
- [ ] 6.1 (P) 各スクレイパー Adapter のユニットテスト実装
  - Wantedly Scraper: HTML パースロジック、データ抽出、エラーハンドリング
  - Indeed Scraper: Playwright ブラウザ操作、JavaScript 待機、データ抽出
  - LAPRAS Scraper: API 呼び出し、データマッピング、エラーハンドリング
  - Mock HTTP レスポンスで外部 API 依存なしのテスト実行
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6.2 (P) エンタープライズデータコレクターのユニットテスト
  - OpenWork Data Collector: データ取得ロジック、個人情報匿名化、古いデータフラグ
  - GitHub Organization Collector: リポジトリ言語分析、公開リポ フィルタリング、API レート制限対応
  - Connpass Event Analyzer: イベント集計、メトリクス計算、データなし処理
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 6.3 (P) NLP Engine と Preprocessing のユニットテスト
  - Text Preprocessing: テキスト長制限、多言語トークン化、個人情報削除、エンコーディング
  - Ollama NLP Engine: プロンプト構成、JSON パース、3 回実行と加重平均、タイムアウト処理、モックモード
  - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6.4 (P) スコアリングエンジンのユニットテスト
  - Tech Stack Scoring: モダンスタック評価、言語バージョン区別、Confidence スレッショルド、監査ログ
  - Dev Environment Scoring: キーワード検出、ボーナス計算、Diminishing returns 適用
  - Skill Support Scoring: 指標検出、ボーナス計算、言語検出、Connpass データ統合
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 6.5 (P) Data Persistence Layer のユニットテスト
  - Supabase upsert ロジック、重複チェック、リトライメカニズム、信頼度フラグ、テストテーブル切り替え
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 15.4_

### 6.2 統合テストの実装
- [ ] 6.6 Job Posting Scraper Orchestrator の統合テスト
  - 複数 Adapter の並列実行、重複検出・統合、リトライロジック
  - 部分失敗シナリオ（1 つの Adapter 失敗時の継続処理）
  - パフォーマンス計測: 1 企業あたり 5 秒以内の確認
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [ ] 6.7 Enterprise Data Orchestrator の統合テスト
  - OpenWork、GitHub、Connpass の並列実行と結果統合
  - 部分失敗時のエラーハンドリングと処理継続
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 6.8 NLP パイプライン（Preprocessing → Ollama → Scoring）の統合テスト
  - テキスト前処理から Ollama 解析、スコアリングまでのエンド・ツー・エンド
  - 3 回独立解析と信頼度加重平均の確認
  - Confidence スレッショルド処理の動作確認
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 6.1, 7.1_

- [ ] 6.9 Scoring Orchestrator の統合テスト
  - 3 つのスコアリングエンジンの並列実行と結果統合
  - 個別エンジン失敗時のグレースフル処理
  - _Requirements: 5.1, 6.1, 7.1_

- [ ] 6.10 月次パイプライン（Job Scoring Orchestrator）の統合テスト
  - 5 ステップの順次実行: スクレイピング → データ取得 → NLP 解析 → スコアリング → Supabase 保存
  - エラー制御: ステップ 1 失敗時スキップ、ステップ 2-4 部分失敗時継続
  - リソース監視: メモリ / CPU 制限到達時の自動管理
  - パフォーマンス検証: 500 企業を 60 分以内に処理可能
  - ログ・メトリクス記録の確認
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 11.1, 11.4, 11.5, 11.6_

- [ ] 6.11 エラーハンドリング・ログ・モニタリングの統合テスト
  - エラー時の ERROR ログ、メトリクス記録、管理者通知メール
  - アラート条件判定と発火（失敗率、処理時間超過等）
  - ログファイル月次分割、7 日分メトリクス履歴保存
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 13.1, 13.2, 13.3, 13.4, 13.5_

### 6.3 エンド・ツー・エンドテスト（モックデータ環境）
- [ ] 6.12 E2E テスト（MOCK_MODE=true）の実行
  - モックデータセット（10 社分の求人情報、OpenWork データ等）を使用
  - 全パイプライン実行: スクレイピング（モック）→ データ取得（モック）→ NLP 解析（プリセット結果）→ スコアリング → test_company_scores テーブル保存
  - パフォーマンス確認: 10 社をモード実行
  - エラーハンドリング、ロギング、メトリクス記録の動作確認
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

### 6.4 セキュリティ・個人情報保護のテスト
- [ ] 6.13 Data Privacy Handler のテスト
  - robots.txt 遵守確認: スクレイピング前のチェック、許可されていない URL へのアクセス防止
  - 個人情報匿名化: メールアドレス、氏名、部門名が削除されることを確認
  - テキスト暗号化: Supabase 保存時に機密フィールドが暗号化されることを確認
  - ログサニタイズ: ログファイルに IP アドレス、ユーザーエージェント情報が含まれないこと確認
  - GitHub 公開リポジトリフィルタリング: プライベートリポはスキップされることを確認
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

### 6.5 パフォーマンス・スケーラビリティテスト
- [ ] 6.14 パフォーマンス検証（500 企業規模）
  - スクレイピング性能: 1 企業あたり平均 5 秒以内の達成確認
  - Ollama NLP 性能: 1 企業あたり 3 回分を平均 10 秒以内で完了
  - 月次全体処理: 500 企業を 60 分以内に完了するスケーラビリティ検証
  - 並列化効果測定: 並列度 5 での性能向上を実測値で確認
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 6.15 リソース管理テスト
  - メモリ監視: 使用量 > 2GB 時のキャッシュ自動クリア動作確認
  - CPU 監視: 使用率 >= 80% 時の並列処理数自動削減動作確認
  - リソース制約下での安定性検証
  - _Requirements: 11.5, 11.6_

### 6.6 Configuration・Mock モードのテスト
- [ ] 6.16 Configuration Manager のテスト
  - .env ファイルからの設定読み込み確認（Ollama モデル名、権重、並列度等）
  - 環境変数優先（.env よりも環境変数が優先される）の確認
  - 不正値時のデフォルト値採用と警告ログ出力確認
  - スコアリング権重変更のログ記録（変更前後の値）確認
  - API キー等のクレデンシャルが環境変数からのみ読み込まれることを確認
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 6.17 MOCK_MODE テストの実行
  - MOCK_MODE=true で全外部 API（Wantedly、Indeed、LAPRAS、OpenWork、GitHub、Connpass、Ollama）がモック化されることを確認
  - モックデータセット（10 社分）が正常に読み込まれることを確認
  - テストテーブル（test_company_scores）へのアクセス確認
  - 本番モード（MOCK_MODE=false）での外部 API 呼び出し確認
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

---

## 要件カバレッジサマリー

| 要件グループ | 対応タスク | 説明 |
|----------|---------|------|
| 要件 1-3 | Phase 1, Phase 2 | 求人情報・エンタープライズデータ取得（スクレイピング、API 統合） |
| 要件 4-7 | Phase 3, Phase 4 | NLP 解析・スコアリング（テキスト処理、3 つのスコアリングエンジン） |
| 要件 8-9 | Phase 5.1, 5.2 | 月次オーケストレーション・Supabase 永続化 |
| 要件 10 | Phase 5.3 | エラーハンドリング・ロギング |
| 要件 11 | Phase 5.1 | パフォーマンス・スケーラビリティ（並列化、リソース監視） |
| 要件 12 | Phase 5.5 | データセキュリティ・個人情報保護 |
| 要件 13 | Phase 5.4 | モニタリング・アラート |
| 要件 14 | Phase 0.2, 5.1 | コンフィグレーション管理 |
| 要件 15 | Phase 0.2, Phase 6.12, Phase 6.17 | テスト環境・モックデータ |

---

## 実行ガイダンス

### Phase 実行順序
1. **Phase 0** (必須): スキーマ、設定、ロギング基盤を最初に準備（タスク 0.1-0.3 はすべて (P) マーク、並列実行可）
2. **Phase 1** (並列可): 3 つのスクレイパー Adapter 実装は互いに独立、並列実行推奨（タスク 1.2-1.4）
3. **Phase 2** (並列可): 3 つのデータコレクター実装は互いに独立、並列実行推奨（タスク 2.2-2.4）
4. **Phase 3** (順序あり): Text Preprocessing (3.1) → Ollama NLP Engine (3.2)
5. **Phase 4** (並列可): 3 つのスコアリングエンジン実装は互いに独立、並列実行推奨（タスク 4.1-4.3）
6. **Phase 5** (順序あり): Data Persistence (5.2) → Job Scoring Orchestrator (5.1、他の全コンポーネント完了後）
7. **Phase 6** (最後): テスト実装（ユニット → 統合 → E2E）、Phase 0-5 完了後

### 並列実行推奨
- Phase 0: すべての基盤タスク (0.1-0.3)
- Phase 1: Adapter 実装 (1.2-1.4)
- Phase 2: データコレクター (2.2-2.4)
- Phase 4: スコアリングエンジン (4.1-4.3)
- Phase 6: ユニットテスト実装 (6.1-6.5) は対応コンポーネント完了後に並列実行可

### 見積もり目安
- Phase 0: 2-3 日（基盤準備）
- Phase 1-2: 5-7 日（データ取得層）
- Phase 3-4: 4-5 日（NLP・スコアリング）
- Phase 5: 3-4 日（オーケストレーション・運用）
- Phase 6: 5-7 日（テスト）
- **合計: 4-5 週間**（並列実行時）
