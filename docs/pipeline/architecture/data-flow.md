# パイプライン データフロー

スクレイピング → Ollama スコア抽出 → Supabase 登録の全体像。

---

## 全体フロー

```
外部サービス                  pipeline/run.ts              Supabase
─────────────────────────────────────────────────────────────────
connpass ──┐
openwork ──┤  (並列)  →  ScrapedDocument[]  →  raw_documents テーブル
github   ──┤                    ↓
ir       ──┘            combinedContent
                               ↓
                          Ollama API
                               ↓
                        ExtractedScores
                               ↓
                        companies テーブル（upsert）
```

---

## Step 1 — スクレイピング結果: `ScrapedDocument`

4つのスクレイパーがそれぞれ **同じ型** を返します。

```typescript
interface ScrapedDocument {
  companyId: string                          // 例: "mercari-jp"
  source:    'connpass' | 'openwork' | 'ir' | 'github'
  url:       string | null                   // 取得元URL（取得不可時はnull）
  content:   string                          // 構造化プレーンテキスト
}
```

`content` は LLM が読みやすいよう設計された**構造化プレーンテキスト**です。
ソースごとの内容は以下の通り。

### connpass（勉強会活動）

```
企業ID: mercari-jp
ソース: Connpass（勉強会活動）
URL: https://mercari.connpass.com/event/
取得期間: 過去1年

【勉強会開催実績】
開催件数（過去1年）: 12件
平均定員数: 80人

【スコア推定値（LLM抽出用ヒント）】
skill_up_support推定: 9/10（開催12件から算出）
技術タグ: go, kubernetes, react

【イベント一覧（最新10件）】
- Mercari Tech Talk #42（2025-03-15, 定員: 100人）
- Go勉強会 vol.12（2025-02-20, 定員: 50人）
...
```

| フィールド | 取得方法 |
|---|---|
| 勉強会件数・定員 | connpass グループページ or 検索ページを Cheerio でパース |
| skill_up_support 推定値 | 過去1年の開催件数からルールベースで算出（0件→1, 2件以下→3, …10件超→9） |
| 技術タグ | イベントタイトルを正規表現でマッチ（Go/Rust/TypeScript/Kubernetes など30種類） |

### openwork（社員口コミ）

```
企業ID: mercari-jp
ソース: OpenWork（社員・元社員の口コミ）
URL: https://www.openwork.jp/company.php?m_id=a0C1000000s1nIR

【評価スコア】
総合評価スコア（5点満点）: 3.9
待遇面の満足度: 3.8
社員の士気: 4.1
風通しの良さ: 3.7
...

【口コミ抜粋（最新5件）】
- 待遇について: フルリモート可で働きやすい。エンジニアへの投資も積極的...
...
```

| フィールド | 取得方法 |
|---|---|
| 評価スコア | JSON-LD `EmployerAggregateRating` + CSS セレクタで数値抽出 |
| 口コミ | `.review_list .review_item` を最大5件取得 |
| 認証 | `OPENWORK_COOKIE` 環境変数 + `--accept-tos` フラグが必要 |

### github（OSS活動）

```
企業ID: mercari-jp
ソース: GitHub（OSS活動）
GitHub org: mercari
URL: https://github.com/mercari

【org概要】
公開リポジトリ数: 87
フォロワー数: 3420
過去30日のイベント数: 24

【スコア推定値（LLM抽出用ヒント）】
tech_stack_modernity推定: 8/10
dev_environment推定: 8/10
技術タグ: go, typescript, kotlin, python, swift

【リポジトリ一覧（最新push順、上位10件）】
- mercari-api [Go] stars:342 (pushed: 2025-04-01)
...
```

| フィールド | 取得方法 |
|---|---|
| org概要 | GitHub API `/orgs/:org` |
| リポジトリ一覧 | GitHub API `/orgs/:org/repos?per_page=100&sort=pushed` |
| tech_stack_modernity 推定値 | 使用言語を Modern(Go/Rust/TS など +2) / Mid(Python/JS など +1) / Legacy(PHP/COBOL など -1〜-2) で採点 |
| dev_environment 推定値 | 公開リポジトリ数 × 過去30日イベント数から算出 |

### ir（IR情報）

```
企業ID: mercari-jp
ソース: IR（投資家向け情報）
URL: https://about.mercari.com/ir/

【IR情報】
ページ取得成功 (HTTP 200)
※ 詳細な財務・人事データの抽出は未実装です。
```

> IR スクレイパーは現在ページ取得の成否確認のみ実装済み。テキスト抽出は未実装。

---

## Step 2 — raw_documents テーブルへ保存

スクレイピング成功後、`ScrapedDocument` をそのまま `raw_documents` テーブルに INSERT します。

```sql
CREATE TABLE public.raw_documents (
  id          BIGSERIAL PRIMARY KEY,
  company_id  TEXT NOT NULL REFERENCES public.companies(id),
  source      TEXT NOT NULL CHECK (source IN ('connpass','openwork','ir','github')),
  url         TEXT,
  content     TEXT NOT NULL,        -- ScrapedDocument.content がそのまま入る
  scraped_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| カラム | 対応フィールド |
|---|---|
| `company_id` | `ScrapedDocument.companyId` |
| `source` | `ScrapedDocument.source` |
| `url` | `ScrapedDocument.url` |
| `content` | `ScrapedDocument.content`（プレーンテキスト、数KB〜数十KB） |

---

## Step 3 — Ollama への入力

全ソースの `content` を連結して1つの文字列にします。

```
=== connpass ===
企業ID: mercari-jp
...（connpassのcontent）

=== github ===
企業ID: mercari-jp
...（githubのcontent）
```

これを以下のプロンプトとともに Ollama API（`/api/generate`）に送信します。

```
以下の企業情報テキストから指標を抽出し、JSONのみ返してください。
値が不明な場合は null にしてください。

テキスト:
[上記の連結テキスト]

JSON形式:
{
  "tech_stack_modernity": null,
  "remote_rate": null,
  ...
}
```

- モデル: `OLLAMA_MODEL` 環境変数（デフォルト `gemma2`）
- `stream: false`, `format: "json"`, `temperature: 0.1`

---

## Step 4 — Ollama からの出力: `ExtractedScores`

```typescript
interface ExtractedScores {
  tech_stack_modernity:     number | null  // 1–10
  remote_rate:              number | null  // 0–100（%）
  estimated_overtime_hours: number | null  // 月間時間
  turnover_rate:            number | null  // 0–100（%）
  retention_rate:           number | null  // 0–100（%）
  dev_environment:          number | null  // 1–10
  skill_up_support:         number | null  // 1–10
  description:              string | null  // 企業説明（1–2文）
  tags:                     string[] | null // ["Go","Kubernetes","フルリモート"] など
}
```

Ollama の生出力に対してバリデーションを実施します。

| 処理 | 内容 |
|---|---|
| コードブロック除去 | ` ```json ` や ` ``` ` を strip |
| JSON パース | 失敗時は例外をスロー |
| 数値範囲チェック | 範囲外・NaN は `null` に変換（例: `tech_stack_modernity` が 0 や 11 → `null`） |
| 型チェック | `description` は string のみ、`tags` は string[] のみ受け入れ |

---

## Step 5 — companies テーブルへ upsert

`ExtractedScores` の **null でないフィールドのみ** を UPDATE します（既存値を上書きしない設計）。

```sql
CREATE TABLE public.companies (
  id                       TEXT PRIMARY KEY,        -- 例: "mercari-jp"
  name                     TEXT NOT NULL,
  description              TEXT NOT NULL DEFAULT '',
  industry                 TEXT NOT NULL DEFAULT '',
  employee_count           INTEGER NOT NULL DEFAULT 0,
  location                 TEXT NOT NULL DEFAULT '',
  tags                     TEXT[] NOT NULL DEFAULT '{}',

  -- ↓ パイプラインが更新するスコアフィールド
  tech_stack_modernity     SMALLINT NOT NULL CHECK (tech_stack_modernity BETWEEN 1 AND 10),
  remote_rate              SMALLINT NOT NULL CHECK (remote_rate BETWEEN 0 AND 100),
  estimated_overtime_hours SMALLINT NOT NULL CHECK (estimated_overtime_hours >= 0),
  turnover_rate            SMALLINT NOT NULL CHECK (turnover_rate BETWEEN 0 AND 100),
  retention_rate           SMALLINT NOT NULL CHECK (retention_rate BETWEEN 0 AND 100),
  dev_environment          SMALLINT NOT NULL CHECK (dev_environment BETWEEN 1 AND 10),
  skill_up_support         SMALLINT NOT NULL CHECK (skill_up_support BETWEEN 1 AND 10),

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()   -- トリガーで自動更新
);
```

`ExtractedScores` → `companies` のマッピング:

| ExtractedScores | companies カラム |
|---|---|
| `tech_stack_modernity` | `tech_stack_modernity` |
| `remote_rate` | `remote_rate` |
| `estimated_overtime_hours` | `estimated_overtime_hours` |
| `turnover_rate` | `turnover_rate` |
| `retention_rate` | `retention_rate` |
| `dev_environment` | `dev_environment` |
| `skill_up_support` | `skill_up_support` |
| `description` | `description` |
| `tags` | `tags` |

---

## dry-run と通常実行の違い

| 処理 | 通常実行 | `--dry-run` |
|---|---|---|
| スクレイピング | 実行 | 実行 |
| `raw_documents` INSERT | 実行 | **スキップ** |
| Ollama スコア抽出 | 実行 | 実行 |
| `companies` UPDATE | 実行 | **スキップ** |
| エラー時の挙動 | `throw` → CLI が exit 1 | エラーログのみ |

---

## 注意事項

- `companies` テーブルのレコードはあらかじめ seed で作成済みが前提（INSERT ではなく UPDATE）
- Ollama がすべて `null` を返した場合は UPDATE をスキップ
- OpenWork は `--accept-tos` フラグ + `OPENWORK_COOKIE` 環境変数が必須
- GitHub API は認証なしで rate limit 60 req/h（`GITHUB_TOKEN` 設定で 5000 req/h に拡張可）
