# パイプライン仕様書 — 要件・全体設計

スクレイピング→Ollama数値抽出→Supabase登録の要件定義と全体設計。

---

## 1. 要件定義

### 1.1 機能要件

| ID | 要件 | 詳細 |
|---|---|---|
| FR-1 | 複数ソースのスクレイピング | connpass / openwork / github / ir から並列に企業データを取得 |
| FR-2 | company_scrapes 保存 | スクレイピング生テキストを Supabase に記録（監査証跡） |
| FR-3 | Ollama による数値抽出 | テキストから7指標 + description + tags を自動抽出 |
| FR-4 | company_scores / companies 更新 | 抽出した数値を `company_scores` に upsert し、description/tags を `companies` に反映 |
| FR-5 | dry-run モード | DB 書き込みなしでスクレイプ・抽出を検証 |
| FR-6 | エラー継続処理 | 1スクレイパー失敗時も他は処理（失敗を記録） |

### 1.2 非機能要件

| ID | 要件 | 目標 |
|---|---|---|
| NFR-1 | 並行実行 | 複数スクレイパーを `Promise.all` で同時実行 |
| NFR-2 | 実行時間 | 全4ソース取得 + Ollama 処理を5分以内（単一社） |
| NFR-3 | 取得テキスト サイズ | 1社あたり 5–50 KB（Ollama 入力として扱える範囲） |
| NFR-4 | バリデーション | Ollama 出力の数値を範囲チェック（1–10 or 0–100 など） |
| NFR-5 | エラーログ | スクレイパー・API エラーを具体的に記録 |

---

## 2. 全体アーキテクチャ

### 2.1 データフロー

```
Step 1: スクレイピング（並列）
┌─────────────────────────────────────┐
│ Promise.all([                       │
│   scrapeConnpass(companyId),        │
│   scrapeOpenWork(companyId, tos),   │
│   scrapeGithub(companyId),          │
│   scrapeIR(companyId)               │
│ ])                                  │
└─────────────────────────────────────┘
         ↓
    ScrapedDocument[]
    (4件、うち0–4件が成功)
         ↓
Step 2: company_scrapes テーブル保存
┌─────────────────────────────────────┐
│ if (!dryRun) {                      │
│   for each doc:                     │
│     insertRawDocument(doc)          │
│ }                                   │
└─────────────────────────────────────┘
         ↓
Step 3: テキスト結合
┌─────────────────────────────────────┐
│ combinedContent =                   │
│   docs                              │
│   .map(d => `=== ${d.source} ===\n${d.content}`)
│   .join('\n\n')                     │
└─────────────────────────────────────┘
         ↓
Step 4: Ollama による数値抽出
┌─────────────────────────────────────┐
│ POST http://localhost:11434/api/generate
│ {                                   │
│   model: "gemma2",                  │
│   prompt: `[template_prompt]`,      │
│   stream: false,                    │
│   format: "json",                   │
│   options: { temperature: 0.1 }     │
│ }                                   │
└─────────────────────────────────────┘
         ↓
    ExtractedScores
    (JSON, 一部フィールドは null 可）
         ↓
Step 5: バリデーション
┌─────────────────────────────────────┐
│ 各数値フィールド:                    │
│  - 範囲チェック（1–10 or 0–100 等）  │
│  - 型チェック（string / string[] ）   │
│  - null の外側値は null に置換      │
└─────────────────────────────────────┘
         ↓
Step 6: company_scores UPSERT / companies UPDATE
┌─────────────────────────────────────┐
│ if (!dryRun) {                      │
│   only non-null score fields:       │
│     UPSERT company_scores           │
│     SET tech_stack_modernity = 8,   │
│         remote_rate = 75, ...       │
│                                     │
│   only non-null company fields:     │
│     UPDATE companies                │
│     SET description = "...",        │
│         tags = [...]                │
│     WHERE id = companyId            │
│ }                                   │
└─────────────────────────────────────┘
```

### 2.2 主要な型定義

```typescript
// Input to scrapers
type SourceType = 'connpass' | 'openwork' | 'ir' | 'github'

// Scraper output
interface ScrapedDocument {
  companyId: string                          // "mercari-jp"
  source: SourceType
  url: string | null                         // fetch元URL
  content: string                            // 構造化プレーンテキスト（5–50KB）
}

// Ollama input
type OllamaInput = string  // combinedContent

// Ollama output
interface ExtractedScores {
  tech_stack_modernity:     number | null    // 1–10
  remote_rate:              number | null    // 0–100
  estimated_overtime_hours: number | null    // ≥0
  turnover_rate:            number | null    // 0–100
  retention_rate:           number | null    // 0–100
  dev_environment:          number | null    // 1–10
  skill_up_support:         number | null    // 1–10
  description:              string | null    // "…企業説明…"
  tags:                     string[] | null  // ["Go", "フルリモート"]
}

// Supabase output
// ↓ null でないフィールドのみ UPDATE
UPDATE companies
SET
  tech_stack_modernity = ?,
  remote_rate = ?,
  ...
WHERE id = ?
```

---

## 3. CLI インターフェース

### 3.1 実行方法

```bash
# 基本形
npx tsx pipeline/run.ts --company mercari-jp --source connpass,github

# ドライラン
npx tsx pipeline/run.ts --company mercari-jp --source connpass --dry-run

# OpenWork を含める（要認可）
npx tsx pipeline/run.ts --company mercari-jp --source connpass,openwork --accept-tos

# 詳細ログ
npx tsx pipeline/run.ts --company mercari-jp --source connpass --verbose
```

### 3.2 引数仕様

| 引数 | 形式 | 必須 | 意味 |
|---|---|---|---|
| `--company` | `<id>` | ✓ | 企業ID（例: `mercari-jp`） |
| `--source` | `<csv>` | ✗ | ソース（デフォルト: `connpass`、複数は `,` で区切り） |
| `--dry-run` | フラグ | ✗ | DB 書き込みをスキップ |
| `--accept-tos` | フラグ | ✗ | OpenWork スクレイピングを許可（ToS 同意） |
| `--verbose` | フラグ | ✗ | スクレイプ内容・Ollama 入力を詳細出力 |

### 3.3 環境変数

| 変数 | 用途 | 例 |
|---|---|---|
| `OLLAMA_HOST` | Ollama API の接続先 | `http://localhost:11434` |
| `OLLAMA_MODEL` | 使用モデル | `gemma2` / `llama2` |
| `OPENWORK_COOKIE` | OpenWork の認証 Cookie | `session=abc123; ...` |
| `OPENWORK_URL_MAP` | OpenWork URL JSON マッピング | `{"mercari-jp": "https://..."}` |
| `GITHUB_TOKEN` | GitHub API rate limit 拡張用 | `ghp_xxx` |
| `SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase API キー | `eyJxxx...` |

---

## 4. エラーハンドリング

### 4.1 スクレイパーレベルのエラー

| エラー種 | 処理 | 結果 |
|---|---|---|
| ネットワークエラー（タイムアウト） | catch で error message を返す | `{ source, error: "..." }` として記録 |
| HTTP エラー（404, 403） | HTTP status を content に含める | `ScrapedDocument` として返す（Ollama で対応） |
| パース失敗（HTML/JSON） | デフォルト content を返す | `ScrapedDocument` （"データ取得不可" メッセージ） |
| 認証エラー（OpenWork） | 専用メッセージ返す | --accept-tos や OPENWORK_COOKIE の確認を促す |

### 4.2 Ollama レベルのエラー

| エラー種 | 処理 | 結果 |
|---|---|---|
| API 接続不可 | `throw new Error(...)` | パイプライン全体を中止 |
| 出力が JSON でない | コードブロック除去・パース再試行 | 失敗時は throw |
| 数値が範囲外 | バリデーション側で null に変換 | `ExtractedScores` の該当フィールド = null |

### 4.3 Supabase レベルのエラー

| エラー種 | 処理 | 結果 |
|---|---|---|
| INSERT 失敗（FK violation） | company_id が存在しないなど | パイプライン全体を中止（throw） |
| UPDATE 失敗（constraint 違反） | 数値が CHECK 制約外など | パイプライン全体を中止（throw） |

### 4.4 エラー時の動作

**通常実行時**：
1. スクレイパー失敗が複数件 → パイプライン中止（exit 1）
2. Ollama 失敗 → パイプライン中止（exit 1）
3. Supabase 失敗 → パイプライン中止（exit 1）

**dry-run 時**：
1. スクレイパー失敗 → **ログのみ、継続**
2. Ollama 失敗 → throw（DB 書き込みなしなので中止）

---

## 5. テスト戦略

### 5.1 ユニットテスト

| テスト対象 | 内容 |
|---|---|
| 並行実行 | 複数スクレイパーが `Promise.all` で実行される（時間で検証） |
| company_scrapes 保存 | INSERT が各ドキュメント毎に呼ばれる |
| テキスト結合 | `=== source ===\n...` 形式で正しく結合 |
| Ollama 呼び出し | combinedContent が正しく渡されている |
| バリデーション | 範囲外の値が null に置換される |
| companies UPDATE | null でないフィールドのみ UPDATE される |
| dry-run | INSERT / UPDATE が呼ばれない |
| エラーハンドリング | 一部失敗時も他は継続（非 dry-run は失敗数で判定） |

### 5.2 統合テスト（E2E）

実装予定（環境準備あり）：
- ローカル Ollama + Supabase Dev でエンドツーエンドテスト
- 実スクレイパーは mock 可能にする

---

## 6. 成功基準

| 項目 | 基準 |
|---|---|
| スクレイピング成功率 | 4ソース中3件以上成功 |
| Ollama 抽出成功率 | 7指標中5件以上非null |
| 並行実行 | 全4ソースを 60秒以内（現在 ~50–60秒） |
| データ品質 | 企業詳細ページ表示時に scores が正しく表示される |
| エラーメッセージ | 具体的な原因（URL候補がない、など）を表示 |

---

## 7. 実行フロー（概要図）

```
┌─ CLI 引数パース
│   ├─ --company (必須)
│   ├─ --source (デフォルト: connpass)
│   ├─ --dry-run, --accept-tos, --verbose
│   └─ → PipelineOptions
│
├─ runPipeline(options)
│   │
│   ├─ Step 1: 並列スクレイピング
│   │   ├─ Promise.all([scrape*]) → ScrapedDocument[]
│   │   └─ エラー/スキップを記録
│   │
│   ├─ Step 2: DB 保存（dry-run でスキップ）
│   │   └─ insertRawDocument(each doc)
│   │
│   ├─ Step 3: テキスト結合
│   │   └─ combinedContent = `=== source ===\n...`
│   │
│   ├─ Step 4: Ollama 抽出
│   │   ├─ POST /api/generate
│   │   └─ JSON パース + バリデーション
│   │
│   └─ Step 5: DB 更新（dry-run でスキップ）
│       └─ upsertCompanyScores(companyId, scores)
│
└─ エラーハンドリング
    ├─ 通常実行: 失敗時 throw
    └─ dry-run: ログのみ
```
