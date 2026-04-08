# 要件定義書

## プロジェクト説明

求人情報スクレイピング + Ollama NLP で企業スコアリング指標を自動化するシステム。複数データソース（Wantedly/Indeed/LAPRAS等の求人情報サイト、OpenWork、GitHub、Connpass）から企業データを収集し、Ollama（llama2/mistral等）による自然言語処理で技術スタック、開発環境、スキルアップ支援度の3指標を自動的にスコア化する。スコア化されたデータはSupabaseの`company_scores`テーブルに保存され、エンジニア幸福度マップのフロントエンドで可視化される。月1回の定期実行によって全企業のスコアを更新する。

## 要件

### 要件 1: 求人情報の複数データソース対応

**目的:** スクレイピングシステム管理者として、複数の求人情報サイトから企業データを効率的に収集したい。これにより、データの偏りを減らし、より包括的な企業評価が可能になる。

#### 受入条件
1. When 月次スケジュール実行時刻に達したとき、Job Posting Scraper システムは Wantedly、Indeed、LAPRAS から企業データを並列で取得すること。
2. When それぞれのデータソースから求人情報を取得したとき、Job Posting Scraper システムは以下のフィールドを正規化して保存すること：企業名、業種、求人タイトル、職務記述書、技術スタック表記、開発環境言及、スキルアップ支援言及。
3. If データソースからのデータ取得がタイムアウトしたとき、Job Posting Scraper システムは３回まで自動リトライをしてから失敗ログを出力すること。
4. If 既存のスクレイピング結果との重複企業を検出したとき、Job Posting Scraper システムは最新データで上書きして統合すること。
5. The Job Posting Scraper system shall ログに取得元データソース、取得日時、レコード件数を記録すること。

### 要件 2: OpenWork と GitHub からの企業情報取得

**目的:** データ分析担当者として、離職率、保有技術、開発文化に関する追加情報を取得したい。これにより、求人情報だけでは得られない企業内部の実態を把握できる。

#### 受入条件
1. When スクレイピング実行時に OpenWork API へのアクセスが可能なとき、OpenWork Integration システムは企業の離職率、平均残業時間、社員レビュー文を取得すること。
2. When GitHub Organization ページを確認するとき、GitHub Data Collector システムは公開リポジトリの言語分布、直近更新日、スター数から技術スタック現況を推定すること。
3. While OpenWork データが90日以内に更新されていないとき、OpenWork Integration システムは古いデータとしてフラグを立てて保存すること。
4. If GitHub API レート制限に達したとき、GitHub Data Collector システムは再度の試行を翌日に延期すること。
5. The OpenWork Integration system shall 取得した社員レビュー文を UTF-8 で正規化して保存すること。

### 要件 3: Connpass イベント参加履歴からスキルアップ支援度推定

**目的:** HR担当者として、企業のエンジニアスキルアップへの投資度を推定したい。これにより、スキル成長機会の有無を評価できる。

#### 受入条件
1. When 企業名から Connpass 参加履歴を検索するとき、Connpass Event Analyzer システムは過去1年のイベント参加人数、勉強会開催回数、社外イベント参加実績を集計すること。
2. When 取得したイベント情報を処理するとき、Connpass Event Analyzer システムは以下の指標を計算すること：参加者数/社員数比率、平均イベント参加頻度、技術カテゴリの多様性スコア。
3. If Connpass から特定企業のデータが取得できないとき、Connpass Event Analyzer システムは「データなし」として記録して処理を継続すること。
4. The Connpass Event Analyzer system shall イベント参加人数データを月別時系列で保存すること。

### 要件 4: Ollama 自然言語処理によるテキスト解析

**目的:** AI分析エンジニアとして、非構造化テキスト（職務記述書、社員レビュー）から標準化されたスコアを自動生成したい。これにより、大量の企業データを効率的にスコア化できる。

#### 受入条件
1. When 求人情報の職務記述書テキストが用意されたとき、Ollama NLP Engine システムは llama2 または mistral モデルを使用して以下を抽出すること：技術スタックキーワード、開発環境言及、スキルアップ支援施策言及。
2. When テキスト解析を実行するとき、Ollama NLP Engine システムは JSON 形式で以下フィールドを出力すること：detected_technologies (配列)、environment_keywords (配列)、skill_support_indicators (配列)、confidence_score (0.0-1.0 の浮動小数点数)。
3. If テキストが日本語と英語混在のとき、Ollama NLP Engine システムは両言語を統一されたトークン化で処理すること。
4. While テキスト長が 10000 文字を超えるとき、Ollama NLP Engine システムは最初の 10000 文字に切り詰めてから処理すること。
5. The Ollama NLP Engine system shall 各企業に対して3回独立した解析を実行して信頼度加重平均を算出すること。

### 要件 5: テクノロジースタック指標スコアリング

**目的:** フロントエンド開発者として、企業の技術スタック現況を 0-100 の正規化スコアとして取得したい。これにより、UI で統一された視覚化が可能になる。

#### 受入条件
1. When 求人情報と GitHub データから技術キーワードを抽出したとき、Tech Stack Scoring Engine システムは以下の評価ロジックを適用すること：Modern stacks (React/Vue/Svelte/TypeScript/Go/Rust 等) を基準年の相対スコア化、古い技術 (PHP5 以前、Flash等) を減点、未検出技術を中立スコアで扱う。
2. When Ollama の confidence_score が 0.6 未満のとき、Tech Stack Scoring Engine システムは信頼度低いフラグを立てて、デフォルト値（50）を採用すること。
3. When 複数企業の求人情報からスコアを抽出するとき、Tech Stack Scoring Engine システムは言語バージョン (e.g. Python3.x vs Python2.7) を区別してスコアリングすること。
4. The Tech Stack Scoring Engine system shall スコア計算の根拠となった技術キーワードを audit ログに記録すること。
5. The Tech Stack Scoring Engine system shall 算出されたスコアを Supabase の company_scores テーブルに保存すること（フィールド: tech_stack_score, tech_stack_confidence, evaluated_at）。

### 要件 6: 開発環境指標スコアリング

**目的:** プロダクト管理者として、企業の開発環境質を定量化したい。これにより、エンジニア満足度への重要な寄与因子を可視化できる。

#### 受入条件
1. When 求人情報テキストから開発環境言及を抽出したとき、Dev Environment Scoring Engine システムは以下のキーワードを検索すること：リモートワーク対応、最新 IDE ライセンス提供、高性能ハードウェア支給、CI/CD パイプライン、コンテナ環境 (Docker/Kubernetes)。
2. When 「リモートワーク」を検出したとき、Dev Environment Scoring Engine システムは基本スコア +20 を加算すること。
3. When 「Docker/Kubernetes」を検出したとき、Dev Environment Scoring Engine システムは基本スコア +15 を加算すること。
4. When 「高性能ハードウェア」キーワードが複数回検出されたとき、Dev Environment Scoring Engine システムは単純加算ではなく diminishing returns (対数関数的減衰) を適用すること。
5. The Dev Environment Scoring Engine system shall スコア計算の詳細内訳 (keyword matches、加算ルール) を JSON で記録すること。
6. The Dev Environment Scoring Engine system shall スコアを Supabase の company_scores テーブルに保存すること（フィールド: dev_environment_score, dev_environment_details）。

### 要件 7: スキルアップ支援度指標スコアリング

**目的:** 採用担当者として、企業がエンジニアの継続学習にどの程度投資しているかを評価したい。これにより、キャリア成長機会を求める候補者にアピールできる。

#### 受入条件
1. When 求人情報からスキルアップ支援施策を抽出したとき、Skill Support Scoring Engine システムは以下を検索すること：研修制度、資格取得支援、書籍購入補助、学習時間確保、技術カンファレンス参加補助、Connpass イベント参加実績（実績データから）。
2. When 「研修制度」キーワードを検出したとき、Skill Support Scoring Engine システムは +15 を加算すること。
3. When 「学習時間確保」や「Google / AWS 認定資格支援」を検出したたとき、Skill Support Scoring Engine システムは +20 を加算すること。
4. When Connpass 参加人数/社員数比率が 0.5 以上のとき、Skill Support Scoring Engine システムは +10 を加算すること。
5. While テキストが日本語でのみ記述されているとき、Skill Support Scoring Engine システムは英語キーワード検索をスキップして精度を維持すること。
6. The Skill Support Scoring Engine system shall スコア要因を詳細に JSON 形録し Supabase に保存すること（フィールド: skill_support_score, skill_support_factors）。

### 要件 8: 月次スケジュール実行とデータ更新

**目的:** バックエンド管理者として、毎月自動的にすべての企業スコアを更新したい。これにより、手動操作の負担を削減できる。

#### 受入条件
1. When 毎月1日の午前2時に達したとき、Job Scoring Orchestrator システムは全スクレイピング、解析、スコアリング処理を自動実行すること。
2. When 月次処理が開始されたとき、Job Scoring Orchestrator システムは以下の順序で処理を実行すること：(1) 求人情報スクレイピング (2) OpenWork / GitHub / Connpass データ取得 (3) Ollama テキスト解析 (4) スコアリング計算 (5) Supabase へのデータ保存。
3. If スクレイピングステップがエラーで中断したとき、Job Scoring Orchestrator システムは残り全ステップをスキップして管理者に通知メールを送信すること。
4. If データ取得ステップで一部企業の処理に失敗したとき、Job Scoring Orchestrator システムは失敗した企業をログに記録してスコアリングを継続すること。
5. The Job Scoring Orchestrator system shall 全処理の開始時刻、終了時刻、処理企業数、失敗企業数、全エラーメッセージを実行ログに記録すること。
6. The Job Scoring Orchestrator system shall 月次処理完了後に実行サマリーレポートを管理画面に保存すること。

### 要件 9: Supabase 統合とデータスキーマ

**目的:** データベース管理者として、スコアリング結果を既存の Supabase インスタンスに安全に保存したい。これにより、フロントエンドが一貫性のあるデータを参照できる。

#### 受入条件
1. When スコアリング処理が完了したとき、Data Persistence Layer システムは`company_scores`テーブルに以下フィールドで INSERT または UPDATE すること：company_id (外部キー)、tech_stack_score (整数 0-100)、tech_stack_confidence (浮動小数点 0-1)、dev_environment_score (整数 0-100)、dev_environment_details (JSON)、skill_support_score (整数 0-100)、skill_support_factors (JSON)、evaluated_at (タイムスタンプ)、updated_at (タイムスタンプ)。
2. When既存スコアを更新するとき、Data Persistence Layer システムは company_id に基づいて重複チェックを行い、該当レコードを新しい値で上書きすること。
3. If Supabase への接続がタイムアウトしたとき、Data Persistence Layer システムは３回の自動リトライを実施して、それでも失敗したときはエラーログを出力して処理を中断すること。
4. The Data Persistence Layer system shall company_scores テーブルへの全 INSERT/UPDATE 操作のログを記録して、監査証跡を残すこと。
5. The Data Persistence Layer system shall スコアの信頼度が 0.6 未満の企業は confidence フラグを true に設定して、フロントエンドで特別表示できるようにすること。

### 要件 10: エラーハンドリングとログ記録

**目的:** 運用保守担当者として、システム動作異常を迅速に検知して対応したい。これにより、データ品質を維持できる。

#### 受入条件
1. When スクレイピング、解析、スコアリング処理のいずれかでエラーが発生したとき、Error Handler システムは以下を実行すること：(1) エラー内容を ERROR レベルでログ出力 (2) 処理企業 ID、エラータイプ、スタックトレースを記録 (3) 処理可能なエラーの場合はリトライ、不可能な場合は skip して継続。
2. If Ollama モデルが応答しないとき、Model Management システムは設定されたタイムアウト (デフォルト 30 秒) で接続を切断して、フォールバック値を使用すること。
3. When ログを出力するとき、Logging System システムは以下のフォーマットで記録すること：[ISO 8601 タイムスタンプ] [ログレベル] [モジュール名] [メッセージ] [コンテキスト情報 JSON]。
4. The Logging System system shall 月次実行ごとに独立したログファイルを作成して、日付をファイル名に含めること（形式: job-posting-scoring-YYYY-MM-DD.log）。
5. The Error Handler system shall 全エラーをメトリクスとして記録して、運用ダッシュボードで可視化できるようにすること。

### 要件 11: パフォーマンス・スケーラビリティ

**目的:** インフラエンジニアとして、大量の企業データを効率的に処理したい。これにより、サービスの応答性と信頼性を確保できる。

#### 受入条件
1. When 100社以上の企業データを処理するとき、Job Posting Scoring Pipeline システムは複数の企業を並列処理すること（並列度: デフォルト 5）。
2. When 求人情報スクレイピングを実行するとき、Job Posting Scraper システムは 1 企業あたり平均 5 秒以内に完了すること。
3. When Ollama テキスト解析を実行するとき、Ollama NLP Engine システムは 1 企業あたり平均 10 秒以内に 3 回の独立解析を完了すること。
4. When スコアリング全体が月次で実行されるとき、Job Scoring Orchestrator システムは 500 企業を 60 分以内に処理すること。
5. The Job Posting Scoring Pipeline system shall メモリ使用量が 2GB を超える場合は、キャッシュを自動的にクリアして可用メモリを回復すること。
6. The Job Scoring Orchestrator system shall CPU 使用率が 80% 以上に達した場合、並列処理数を自動的に削減すること。

### 要件 12: データセキュリティと個人情報保護

**目的:** セキュリティ責任者として、スクレイピングで得られた個人情報を安全に管理したい。これにより、個人情報保護方針を遵守できる。

#### 受入条件
1. When Wantedly、Indeed、LAPRAS からデータを取得するとき、Data Privacy Handler システムは各サイトの利用規約を遵守して、スクレイピング頻度を制限すること（推奨: 1 日 1 回以下）。
2. When OpenWork から社員レビュー文を取得するとき、Data Privacy Handler システムは個人を特定する情報 (社員氏名、部門名など) を削除して匿名化すること。
3. When GitHub から Organization データを取得するとき、Data Privacy Handler システムは公開リポジトリのみを対象として、プライベートリポジトリはアクセスしないこと。
4. When Supabase に保存するとき、Data Persistence Layer システムは全テキストフィールド (職務記述書、社員レビューなど) を暗号化すること（推奨: AES-256）。
5. The Data Privacy Handler system shall スクレイピングログに IP アドレス、ユーザーエージェント情報を記録しないこと。
6. The Data Privacy Handler system shall 取得データの保持期間を設定して、3 年経過したデータを自動的に削除すること。

### 要件 13: モニタリング・アラート

**目的:** 運用チームとして、システムの正常性を継続的に監視したい。これにより、問題を早期に検知できる。

#### 受入条件
1. When スコアリング処理中に異常を検知したとき、Monitoring & Alerting System システムは以下の条件でアラートを発火すること：(1) 企業スコアリング失敗率が 10% 以上、(2) 平均処理時間が 15 秒を超過、(3) Ollama モデル応答時間が 30 秒を超過、(4) Supabase 接続エラー発生。
2. When アラートが発火したとき、Monitoring & Alerting System システムは管理者にメール通知を送信すること。
3. When 月次実行が完了したとき、Monitoring & Alerting System システムは以下メトリクスをダッシュボードに記録すること：成功企業数、失敗企業数、平均処理時間、信頼度分布、データ品質スコア。
4. The Monitoring & Alerting System system shall 処理中のメトリクスをリアルタイムで記録すること。
5. The Monitoring & Alerting System system shall 7 日分のメトリクス履歴を保存して、トレンド分析を可能にすること。

### 要件 14: コンフィグレーション管理

**目的:** 運用チームとして、スコアリングロジック、パラメータ、データソース設定を一元管理したい。これにより、運用の柔軟性が向上する。

#### 受入条件
1. When システムを起動するとき、Configuration Manager は設定ファイル (.env または環境変数) から以下を読み込むこと：Ollama モデル名、スクレイピング対象 URL、スコアリング権重 (tech_stack_weight, dev_environment_weight, skill_support_weight)、並列処理数、Supabase 接続情報。
2. When スコアリング権重を変更するとき、Configuration Manager は変更前後の値をログに記録して監査証跡を残すこと。
3. When Ollama モデル名が変更されたとき、Configuration Manager は 次回実行時に新しいモデルを自動的にロードすること。
4. If 設定ファイルに不正な値が含まれたとき、Configuration Manager は デフォルト値を使用してログに警告を出力すること。
5. The Configuration Manager system shall クレデンシャル情報 (API キー、Supabase パスワード) を環境変数から読み込んで、設定ファイルに含めないこと。

### 要件 15: テスト実行環境とモック

**目的:** 開発チームとして、外部 API に依存せずに機能テストを実行したい。これにより、開発効率が向上する。

#### 受入条件
1. When 環境変数 `MOCK_MODE=true` が設定されたとき、Job Posting Scraper system はモックデータを返して、実際のスクレイピングをスキップすること。
2. When MOCK_MODE が有効なとき、OpenWork Integration、GitHub Data Collector、Connpass Event Analyzer も同様にモックデータを返すこと。
3. When MOCK_MODE が有効なとき、Ollama NLP Engine はプリセットされた解析結果を返して、Ollama プロセス起動をスキップすること。
4. When テストモードで実行するとき、Data Persistence Layer は実テーブルではなく test_company_scores テーブルに保存すること。
5. The Job Posting Scoring Pipeline system shall モックデータセット (10 社分のサンプル求人情報、OpenWork データ等) を含めて、即座にテストを開始できるようにすること。

## 非機能要件

### 可用性
- The Job Scoring Orchestrator system shall 月次実行時の処理成功率を 95% 以上に保つこと。
- The Job Scoring Orchestrator system shall 処理失敗時に自動リトライを3回実施すること。

### 保守性
- The Job Posting Scoring Pipeline system shall すべてのモジュール間の依存関係を明確に定義して、疎結合設計にすること。
- The Logging System system shall 全トレースを JSON フォーマットで出力して、ログ解析ツール との連携を容易にすること。

### セキュリティ
- The Data Privacy Handler system shall スクレイピング対象サイトの robots.txt を遵守すること。
- The Data Privacy Handler system shall HTTPS による暗号通信を強制すること。

### 信頼性
- The Ollama NLP Engine system shall 3 回の独立解析実施で信頼度加重平均を算出すること。
- The Job Scoring Orchestrator system shall データベース接続エラー時に3回の自動リトライを実施すること。
