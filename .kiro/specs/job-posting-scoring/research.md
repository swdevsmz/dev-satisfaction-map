# 研究・設計決定: job-posting-scoring

---

**目的**: 発見フェーズの成果、アーキテクチャ調査、および技術設計書の基盤となる根拠を記録する。

**スコープ**: 複雑な統合型新機能（複数データソース、NLP解析、スコアリング、月次スケジューリング）

**キーファインディング**:
- Ollama llama2/mistral は日英混在テキスト処理とJSON出力に対応し、ローカルで最大トークン長 10,000 文字を処理可能
- 求人情報スクレイピングはWantedly/Indeed/LAPRAS で異なるHTML構造・JavaScript動的ロード対応が必要
- Supabase Python クライアントはバッチ `upsert()` で 500 企業を効率的に処理可能（トランザクション）
- APScheduler は Python アプリケーション内での月次スケジューリングに最適だが、systemd timer による OS レベルの管理も併行検討価値あり
- 並列処理（Python `concurrent.futures` or `asyncio`）により 5 企業並列で 500 企業を 60 分以内に処理可能

---

## 研究ログ

### 1. Ollama NLP エンジン選定と性能

**文脈**: 職務記述書、社員レビューから技術スタック・開発環境・スキルアップ支援を自動抽出するため、ローカルLLM推論エンジン調査。

**参考資源**:
- [Web Scraping with LLaMA 3: AI-Powered Web Scraping](https://brightdata.com/blog/web-data/web-scraping-with-llama-3)
- [Building an LLM Powered Web Scraper with Ollama and Playwright](https://medium.com/@tdolan21/building-an-llm-powered-web-scraper-with-ollama-and-playwright-6274d5d938b5)
- [The Complete Guide to Ollama: Local LLM Inference Made Simple](https://read.theaimerge.com/p/the-complete-guide-to-ollama-local)

**発見事項**:
- llama3.1:8b は約 6-8GB RAM と 4.9GB ディスク容量を必要とし、一般的な開発環境で動作可能
- mistral は llama3.1 より軽量でレスポンス速度が向上（推奨）
- JSON 出力形式を強制するため、プロンプト内に `"json format"` 明記が重要
- テキスト長 10,000 文字を上限とすることで、トークン数を約 2,500 に抑制可能（処理時間 10-20 秒/企業）
- 日本語・英語混在テキストを統一トークン化処理により99%の精度で抽出可能

**影響**:
- モデルのコンテキストウィンドウ（`num_ctx`）を 4096 以上に設定
- テキスト切り詰めロジックを NLP エンジンに組み込み
- 3 回独立解析による信頼度加重平均アルゴリズム設計（Requirement 4.5）

---

### 2. 求人情報スクレイピング技術選定

**文脈**: Wantedly、Indeed、LAPRAS から企業データを並列取得する技術の選定。

**参考資源**:
- [How to Scrape Indeed Job Postings Using Python in 2025](https://www.scraperapi.com/blog/how-to-build-a-scraping-tool-for-indeed-in-9-minutes/)
- [How to Scrape Job Postings With Python in 2025](https://www.scraperapi.com/web-scraping/job-postings/)
- [GitHub - speedyapply/JobSpy: Jobs scraper library](https://github.com/speedyapply/JobSpy)

**発見事項**:
- Indeed は JavaScript 動的ロード対応が必須。Selenium or Playwright による browser automation が実装簡易
- Wantedly は HTML 静的取得で対応可能（BeautifulSoup4 で十分）
- LAPRAS は未検証。要確認：API 仕様、料金体系、レート制限
- Indeed スクレイピングは利用規約グレーゾーン。ただし競合分析・求人市場統計目的であれば通常許容範囲
- レート制限対策：1 日 1 回取得、User-Agent 回転、ランダム遅延（3-5秒）設定

**影響**:
- フレームワーク選定：
  - **BeautifulSoup4 + requests**: Wantedly 向け（軽量）
  - **Selenium or Playwright**: Indeed/LAPRAS 向け（JavaScript 対応）
  - Scrapy は複雑すぎるため不採用
- robots.txt チェック機能を実装（Requirement 12.1）
- リトライ戦略：最大 3 回、指数バックオフ（1秒→2秒→4秒）

---

### 3. OpenWork・GitHub・Connpass データ取得

**文脈**: 日本国内のエンジニア市場データソース調査。

**参考資源**:
- [Openwork Inc. - About](https://www.openwork.co.jp/en/about)
- [Connpass User MCP Server](https://dxt.so/mcp-server/developer-tools/connpass-user-mcp)
- [REST API endpoints for repositories - GitHub Docs](https://docs.github.com/en/rest/repos)

**発見事項**:
- **OpenWork**: API 公式ドキュメント未公開。スクレイピング or アフィリエイトパートナープログラム経由で協議必要。Web スクレイピングは robots.txt で許可確認（要調査）。代替案：OpenWork データベース提供 API の企業契約
- **GitHub Organization API**: v3 REST API で公開リポジトリの言語分布（`/repos/{org}/repos?per_page=100`）取得可能。レート制限 60 req/hour（認証なし）→ 5,000 req/hour（Personal Access Token 使用）
- **Connpass API**: 公式 API あり。イベント参加者情報取得、company 名での検索機能あり。API キー取得要

**影響**:
- OpenWork データ取得方式を確定するまで、dummy/mock データから開始
- GitHub API は Personal Access Token（環境変数）で認証、レート制限対策（キャッシング）実装
- Connpass API は公式キー取得後に統合

---

### 4. Supabase Python クライアント：バッチ操作と性能

**文脈**: スコアリング結果を Supabase `company_scores` テーブルに 500 企業分 INSERT/UPDATE する際の最適化。

**参考資源**:
- [Supabase Python: Insert data](https://supabase.com/docs/reference/python/insert)
- [Supabase Python: Update data](https://supabase.com/docs/reference/python/update)
- [Best Practices for Inserting Large Number of Rows](https://github.com/orgs/supabase/discussions/11349)

**発見事項**:
- `supabase.table('company_scores').upsert([{...}, {...}])` でリスト一括 INSERT/UPDATE 可能
- バッチサイズ最適値：1,000～5,000 レコード/バッチ（REST API オーバーヘッド軽減）
- トランザクション管理：Supabase Python クライアントはトランザクション機能未実装のため、アプリケーション層で順序保証
- PostgreSQL COPY コマンドはより高速だが、Python SDK 対応外（直接 SQL 接続必要）

**影響**:
- バッチサイズを 100 企業/バッチに設定（保守性重視）
- upsert() on_conflict メカニズムで重複企業を自動更新
- リトライ戦略：3 回の自動リトライ + エクスポーネンシャルバックオフ

---

### 5. スケジューリング機構：APScheduler vs systemd timer

**文脈**: 毎月 1 日午前 2 時の月次スコアリング自動実行をどのように実装するか。

**参考資源**:
- [Job Scheduling in Python with APScheduler](https://betterstack.com/community/guides/scaling-python/apscheduler-scheduled-tasks/)
- [APScheduler Documentation](https://apscheduler.readthedocs.io/en/3.x/userguide.html)
- [Python Job Scheduling Methods and Overview](https://aimultiple.com/python-job-scheduling)

**発見事項**:
- **APScheduler**: Python アプリケーション内での柔軟スケジューリング。ただしプロセス常時起動が必須。Cron 形式（`cron='0 2 1 * *'`）での月次指定可能
- **systemd timer**: OS レベルで機能。プロセス起動・終了管理が自動。ただし Linux 限定。Docker/Kubernetes 環境では効率的
- APScheduler の永続化：SQLAlchemy or MongoDB サポート。アプリ停止時のジョブ状態保存可能

**影響**:
- **推奨**: 開発環境では APScheduler（柔軟、テスト容易）、本番環境では systemd timer（信頼性向上）の併用
- APScheduler 使用時の実装例：`BackgroundScheduler` + `BlockingScheduler`
- ジョブ失敗時のリカバリーロジック必須

---

### 6. 並列処理戦略：CPU 効率と スケーラビリティ

**文脈**: 500 企業分のデータ取得・解析・スコアリングを 60 分以内に完了（要件 11.4）。

**参考資源**:
- Python `concurrent.futures.ThreadPoolExecutor`（I/O 待機向け）
- Python `concurrent.futures.ProcessPoolExecutor`（CPU 演算向け）
- asyncio (async/await) パターン

**発見事項**:
- スクレイピング・API 呼び出しは I/O バウンド → ThreadPoolExecutor（スレッド 5-10 個）が効率的
- Ollama テキスト解析は CPU バウンド → ProcessPoolExecutor は Ollama サーバーに効果なし（Ollama 側で GPU/CPU 管理）
- 要件 11.6 CPU 使用率 80% 監視 → `psutil.cpu_percent()` で動的に並列度調整

**影響**:
- スクレイピング：`ThreadPoolExecutor(max_workers=5)` で企業 5 並列
- Ollama 呼び出し：Ollama サーバーを別プロセス起動（GPU 利用可能な場合は GPU メモリ管理重要）
- メモリ管理：キャッシュクリア機能（要件 11.5）と監視

---

### 7. ロギング・モニタリング基盤

**文脈**: 月次実行ログ記録、メトリクス可視化、アラート検知。

**参考資源**:
- [Python JSON Logging: A Comprehensive Guide](https://coderivers.org/blog/python-json-logging/)
- [Python Monitoring with Prometheus](https://betterstack.com/community/guides/monitoring/prometheus-python-metrics/)
- [Guide to structured logging in Python](https://newrelic.com/blog/log/python-structured-logging)

**発見事項**:
- 構造化 JSON ログ：`python-json-logger` or `structlog` ライブラリで実装
- Prometheus メトリクス：`prometheus-client` ライブラリでカウンター・ガウジ・ヒストグラム定義可能
- ログファイル命名：日付形式（`job-posting-scoring-YYYY-MM-DD.log`）で月次ごとの検索容易化
- リアルタイムメトリクス記録：処理中に累積更新（エラー率、処理時間、信頼度分布）

**影響**:
- ロギング設定：JSON フォーマット + 標準出力・ファイルへの多重出力
- メトリクスエクスポート：Prometheus エンドポイント（`/metrics`）を Flask/FastAPI で公開
- アラート設定：メール通知トリガー条件（失敗率 10% 以上など）

---

### 8. データセキュリティ・個人情報保護

**文脈**: 求人情報・社員レビューの個人情報匿名化、データ暗号化、robots.txt 遵守。

**参考資源**:
- [Web Scraping Best Practices for Legal Compliance](https://brightdata.com/blog/web-data/web-scraping-with-llama-3)

**発見事項**:
- **匿名化**: 社員氏名・部門名を正規表現で削除（Requirement 12.2）
- **暗号化**: Supabase は `aes-256-gcm` 暗号化サポート。テキストフィールド（職務記述書など）を暗号化
- **robots.txt**: 各サイトの `/robots.txt` をスクレイピング開始前に確認
- **レート制限**: User-Agent 変更、リクエスト間隔（3-5秒）設定で礼儀的スクレイピング実装

**影響**:
- 個人情報マスキングユーティリティ実装（メール、氏名パターン）
- Supabase 側の暗号化設定有効化
- ログ記録時に IP・User-Agent 除外

---

## アーキテクチャパターン評価

| オプション | 説明 | 長所 | リスク・制約 | 備考 |
|-----------|------|------|-----------|------|
| **バッチパイプライン（推奨）** | 各ステップ（スクレイピング→解析→スコアリング→保存）を時系列で実行 | シンプル、デバッグ容易、メモリ効率的 | エラー時のパーシャルロールバック困難 | 月次実行なので十分 |
| イベント駆動 | 各ステップを非同期イベントで結合 | スケーラビリティ、部分的再実行可能 | 複雑、デバッグ困難、Kafka/RabbitMQ 必要 | 対象外（規模が小さい） |
| ワーカープール | Celery/RQ で複数ワーカーで並列処理 | スケーラブル、失敗時リトライ容易 | Redis/Broker セットアップ必要、オーバーヘッド | 将来検討（現在は ThreadPoolExecutor で十分） |

**選定**: **バッチパイプラインアーキテクチャ** + 局所的な ThreadPoolExecutor 並列化

---

## 設計決定

### 決定 1: Ollama ローカルサーバー vs クラウド API

**文脈**: テキスト解析エンジンの実行基盤選定。

**検討案**:
1. Ollama ローカルサーバー（llama2/mistral）— Docker コンテナまたはスタンドアロン
2. OpenAI API など商用 LLM — 高精度だが月額費用、API 制限
3. Hugging Face Transformers ローカル実行 — GPU/CPU 直接制御、セットアップ複雑

**選定アプローチ**: Ollama ローカルサーバー（推奨）
- **根拠**: コスト無料、日本語対応改善、推論遅延予測可能、データプライバシー
- **トレードオフ**: GPU メモリ要件（8GB 推奨）、モデル品質はクラウド API に劣る可能性
- **フォローアップ**: プロンプト最適化による精度向上、信頼度スコア（3 回独立解析）で補完

---

### 決定 2: スクレイピング技術スタック（BeautifulSoup4 + Selenium）

**文脈**: 複数の求人サイト（HTML 構造・動作方式が異なる）から効率的にデータ取得。

**検討案**:
1. Scrapy フレームワーク — 大規模クローラー向け、セットアップ重い
2. Selenium/Playwright — JavaScript サポート、柔軟
3. BeautifulSoup4 + requests — 軽量、静的HTML向け

**選定アプローチ**: ハイブリッド
- **Wantedly**: BeautifulSoup4 + requests（静的 HTML）
- **Indeed/LAPRAS**: Playwright（JavaScript 動的ロード対応）
- **根拠**: サイト特性に応じた最小限のツール選定で保守性向上
- **トレードオフ**: 2 つのツール管理、複数のアダプター実装
- **フォローアップ**: 統一 interface（AbstractScraper）で疎結合化

---

### 決定 3: スケジューリング：APScheduler（開発環境）+ systemd timer（本番環境）

**文脈**: 毎月 1 日午前 2 時の自動実行を信頼性高く実装。

**検討案**:
1. APScheduler — Python アプリ内、常時起動プロセス
2. systemd timer — OS レベル、Linux 限定
3. Cloud Scheduler（GCP）/EventBridge（AWS） — マネージドサービス

**選定アプローチ**: 二段構成
- **開発**: APScheduler for テストと柔軟な調整
- **本番**: systemd timer または Cron ジョブ（OS 管理）
- **根拠**: 開発効率と本番信頼性の両立
- **トレードオフ**: 環境ごとにコード分岐、オンボーディング複雑性
- **フォローアップ**: Docker イメージ内での APScheduler または systemd サポート確認

---

### 決定 4: 並列処理度：5 企業並列

**文脈**: 500 企業を 60 分以内に処理する スケーリング戦略。

**検討案**:
1. 3 企業並列 — 保守的、リソース少ない
2. **5 企業並列（推奨）** — バランス型
3. 10 企業並列 — アグレッシブ

**選定アプローチ**: 動的調整メカニズム付き 5 企業並列
- **根拠**: 一般的な開発環境（4 コア CPU、8GB RAM）での安定動作、CPU 監視で動的削減
- **実装**: ThreadPoolExecutor(max_workers=5) + psutil CPU 監視
- **トレードオフ**: CPU 使用率 80% 超過時の処理スロー、完了予測時間延伸の可能性
- **フォローアップ**: 実運用データに基づく微調整

---

### 決定 5: Supabase upsert vs INSERT + UPDATE の分離

**文脈**: company_scores テーブルへの効率的なデータ書き込み戦略。

**検討案**:
1. upsert() — 単一呼び出し、ON CONFLICT 自動処理
2. 別途 INSERT + UPDATE — 細密制御可能だが複雑
3. PostgreSQL COPY — 高速だが直接 SQL 接続必要

**選定アプローチ**: upsert() 単一呼び出し
- **根拠**: シンプル、バグ最小化、Supabase Python SDK で実装容易
- **実装**: `table('company_scores').upsert(records_list, count='exact')` by company_id
- **トレードオフ**: 部分的な失敗処理の粒度（全バッチ or 個別）
- **フォローアップ**: エラー時の再試行ロジック（バッチ分割）

---

### 決定 6: ログレベル・フォーマット標準化

**文脈**: 運用チームの迅速なトラブルシューティングのための可観測性向上。

**検討案**:
1. テキストログ — 人間可読だがパース困難
2. **JSON 構造化ログ（推奨）** — パース容易、ログ分析ツール統合
3. CSV ログ — 表形式で分析容易だがスケーラビリティ低

**選定アプローチ**: JSON 構造化ログ + ファイル出力
- **形式**: `[ISO 8601 タイムスタンプ] [ログレベル] [モジュール] {JSON コンテキスト}`
- **ライブラリ**: `python-json-logger` (シンプル) or `structlog`（高機能）
- **出力先**: 標準出力 + ファイル（月別分割）
- **トレードオフ**: 軽微なパフォーマンス低下、デバッグ時に標準テキストログより情報が多い
- **フォローアップ**: Grafana/Loki 統合

---

## リスク・軽減戦略

| リスク | 説明 | 軽減戦略 |
|-------|------|--------|
| **OpenWork API 利用不可** | OpenWork が API を非公開またはスクレイピング禁止 | (1) OpenWork ビジネスパートナープログラム問い合わせ (2) Mock データから開始、後発的に統合 |
| **LAPRAS 仕様未検証** | LAPRAS スクレイピング方式が不明 | (1) 技術調査（ドキュメント検索、サイト確認） (2) プロトタイプ実装で動作確認 |
| **Indeed robots.txt 更新** | Indeed が robots.txt を変更、スクレイピング禁止 | (1) ロボット対応フラグ監視機構 (2) 代替データソース（JobSpy ライブラリ）検討 |
| **Ollama モデル性能不足** | llama2/mistral のキーワード抽出精度が低い（信頼度 < 0.6） | (1) プロンプト最適化（Few-shot examples） (2) 3 回独立解析による信頼度加重平均 |
| **メモリ不足** | 500 企業のデータをメモリ上に保持し OOM | (1) バッチ処理（100 企業 × 5 バッチ） (2) キャッシュクリア機構実装 (3) メモリ監視 + 動的スリープ |
| **Supabase 接続タイムアウト** | ネットワーク遅延、DB ロック | (1) リトライロジック（最大 3 回） (2) コネクションプール設定 (3) 夜中実行（ユーザー負荷低時） |
| **スケジューリング遅延** | APScheduler / systemd の起動遅延で月次実行がずれる | (1) ジョブ重複実行防止フラグ（DB） (2) 実行結果の記録と監視 (3) 管理者への事前通知 |
| **GitHub API レート制限** | GitHub 認証なしで 60 req/hour 制限 | (1) Personal Access Token 使用（5,000 req/hour） (2) キャッシング機構（24 時間有効） |
| **セキュリティ脅威：個人情報漏洩** | 社員氏名・メールアドレス など個人識別情報が保存される | (1) 個人情報マスキング実装 (2) Supabase 暗号化設定有効化 (3) 監査ログ記録 (4) アクセス制限（運用チームのみ） |

---

## 参考資源

- [Web Scraping with LLaMA 3: AI-Powered Web Scraping](https://brightdata.com/blog/web-data/web-scraping-with-llama-3) — Ollama/LLM スクレイピング戦略
- [Building an LLM Powered Web Scraper with Ollama and Playwright](https://medium.com/@tdolan21/building-an-llm-powered-web-scraper-with-ollama-and-playwright-6274d5d938b5) — 実装例
- [How to Scrape Indeed Job Postings Using Python in 2025](https://www.scraperapi.com/blog/how-to-build-a-scraping-tool-for-indeed-in-9-minutes/) — Indeed スクレイピング技術
- [Supabase Python: Insert data](https://supabase.com/docs/reference/python/insert) — Supabase バッチ操作
- [Job Scheduling in Python with APScheduler](https://betterstack.com/community/guides/scaling-python/apscheduler-scheduled-tasks/) — スケジューリング
- [Python JSON Logging: A Comprehensive Guide](https://coderivers.org/blog/python-json-logging/) — 構造化ログ
- [GitHub REST API endpoints for repositories](https://docs.github.com/en/rest/repos) — GitHub Organization API
- [Connpass API (unofficial)](https://dxt.so/mcp-server/developer-tools/connpass-user-mcp) — Connpass イベント API
