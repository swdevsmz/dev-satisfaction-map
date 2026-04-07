# パイプライン仕様書 — Ollama 数値抽出・バリデーション仕様

スクレイピング結果テキストから Ollama を使って構造化スコアを抽出するプロセス。

---

## 1. 全体フロー

```
combinedContent
（connpass + openwork + github + ir のテキスト連結）
       ↓
Step 1: Ollama API へ送信
  - POST http://localhost:11434/api/generate
  - model: "gemma2" (OLLAMA_MODEL 環境変数で上書き可)
  - format: "json"
  - temperature: 0.1
       ↓
Step 2: JSON パース
  - コードブロック（```json..```）を除去
  - JSON パースを試行
       ↓
Step 3: バリデーション
  - 各フィールドの型・範囲チェック
  - 異常値を null に置換
       ↓
ExtractedScores
（出力）
```

---

## 2. Ollama API リクエスト仕様

### 2.1 リクエスト

```http
POST http://localhost:11434/api/generate
Content-Type: application/json

{
  "model": "gemma2",
  "prompt": "[テンプレートプロンプト - 下記参照]",
  "stream": false,
  "format": "json",
  "options": {
    "temperature": 0.1
  }
}
```

| パラメータ | 値 | 理由 |
|---|---|---|
| `stream` | `false` | 全出力を待機（true だと chunk ごとに返される） |
| `format` | `"json"` | JSON パース強制（不正な JSON を回避） |
| `temperature` | `0.1` | 低温度で決定論的・安定した出力（デフォルト 0.7） |

### 2.2 環境変数

| 変数 | デフォルト | 用途 |
|---|---|---|
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama API 接続先 |
| `OLLAMA_MODEL` | `gemma2` | 使用モデル |

---

## 3. プロンプトテンプレート

### 3.1 プロンプト本体

```
以下の企業情報テキストから指標を抽出し、JSONのみ返してください。
値が不明な場合は null にしてください。コードブロックや説明文は不要です。

テキスト:
[combinedContent]

JSON形式:
{
  "tech_stack_modernity": null,
  "remote_rate": null,
  "estimated_overtime_hours": null,
  "turnover_rate": null,
  "retention_rate": null,
  "dev_environment": null,
  "skill_up_support": null,
  "description": null,
  "tags": null
}

各フィールドの意味:
- tech_stack_modernity: 技術スタックの新しさ（1-10の整数）
- remote_rate: リモートワーク率（0-100の整数）
- estimated_overtime_hours: 月間残業時間（0以上の整数）
- turnover_rate: 離職率（0-100の整数）
- retention_rate: 定着率（0-100の整数）
- dev_environment: 開発環境の良さ（1-10の整数）
- skill_up_support: スキルアップ支援の充実度（1-10の整数）
- description: 企業の特徴を1-2文で説明した日本語テキスト
- tags: 関連する技術・文化キーワードの配列（例: ["Go","Kubernetes","フルリモート"]）
```

### 3.2 プロンプト設計の理由

| 要素 | 理由 |
|---|---|
| "JSONのみ返してください" | LLM の余談や説明を防ぐ |
| "コードブロックや説明文は不要" | ```json...``` で囲まない指示 |
| `format: "json"` + `temperature: 0.1` | JSON 形式・確定的な出力を強制 |
| 値が不明な場合は null | 推測値ではなく確実な値のみ抽出 |
| "1-2文で" (description) | 長すぎる記述を防ぐ |

---

## 4. JSON パース処理

### 4.1 コードブロック除去

Ollama は時々以下のように出力する：

```
```json
{ "tech_stack_modernity": 8, ... }
```
```

パース前に除去：

```typescript
const jsonText = raw
  .replace(/```json\s*/gi, '')   // ```json と直後の空白を除去
  .replace(/```\s*/g, '')         // ``` と空白を除去
  .trim()                         // 先頭末尾の空白を除去
```

### 4.2 JSON パース

```typescript
let parsed: Partial<ExtractedScores>
try {
  parsed = JSON.parse(jsonText)
} catch {
  throw new Error(`Ollama の出力をJSONとしてパースできませんでした:\n${raw}`)
}
```

失敗時は **パイプライン全体を中止**（throw）。

---

## 5. バリデーション仕様

### 5.1 数値フィールドの検証

すべての整数フィールド (`tech_stack_modernity` など) に対して共通処理：

```typescript
function toIntOrNull(
  val: number | null | undefined,
  min: number,
  max: number
): number | null {
  // null / undefined はそのまま返す
  if (val == null) return null
  
  // 型チェック
  if (typeof val !== 'number' || isNaN(val)) return null
  
  // 丸める
  const n = Math.round(val)
  
  // 範囲チェック
  if (n < min || n > max) return null
  
  return n
}
```

**呼び出し例**:

```typescript
tech_stack_modernity: toIntOrNull(parsed.tech_stack_modernity, 1, 10)
remote_rate:         toIntOrNull(parsed.remote_rate, 0, 100)
estimated_overtime_hours: toIntOrNull(parsed.estimated_overtime_hours, 0, 999)
```

### 5.2 フィールド別バリデーション

| フィールド | 型 | 範囲 | バリデーション |
|---|---|---|---|
| `tech_stack_modernity` | number | 1–10 | `toIntOrNull(..., 1, 10)` |
| `remote_rate` | number | 0–100 | `toIntOrNull(..., 0, 100)` |
| `estimated_overtime_hours` | number | 0–999 | `toIntOrNull(..., 0, 999)` |
| `turnover_rate` | number | 0–100 | `toIntOrNull(..., 0, 100)` |
| `retention_rate` | number | 0–100 | `toIntOrNull(..., 0, 100)` |
| `dev_environment` | number | 1–10 | `toIntOrNull(..., 1, 10)` |
| `skill_up_support` | number | 1–10 | `toIntOrNull(..., 1, 10)` |
| `description` | string \| null | — | `typeof val === 'string' ? val : null` |
| `tags` | string[] \| null | — | `Array.isArray(val) ? val.filter(t => typeof t === 'string') : null` |

### 5.3 異常値の例

| 入力 | 結果 |
|---|---|
| `tech_stack_modernity: 11` | `null`（範囲外） |
| `tech_stack_modernity: 8.7` | `9`（丸める） |
| `tech_stack_modernity: "8"` | `null`（型エラー） |
| `remote_rate: NaN` | `null` |
| `remote_rate: null` | `null`（そのまま） |
| `tags: [1, "Go", 2]` | `["Go"]`（string のみ） |
| `description: 123` | `null`（型エラー） |

---

## 6. 実装コード

```typescript
export async function extractScores(content: string): Promise<ExtractedScores> {
  const prompt = `以下の企業情報テキストから指標を抽出し、JSONのみ返してください。
値が不明な場合は null にしてください。コードブロックや説明文は不要です。

テキスト:
${content}

JSON形式:
{
  "tech_stack_modernity": null,
  "remote_rate": null,
  ...
}

各フィールドの意味:
...`

  // Step 1: Ollama API 呼び出し
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.1 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const raw: string = data.response ?? ''

  // Step 2: コードブロック除去
  const jsonText = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // Step 3: JSON パース
  let parsed: Partial<ExtractedScores>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error(`Ollama の出力をJSONとしてパースできませんでした:\n${raw}`)
  }

  // Step 4: バリデーション
  return {
    tech_stack_modernity:     toIntOrNull(parsed.tech_stack_modernity, 1, 10),
    remote_rate:              toIntOrNull(parsed.remote_rate, 0, 100),
    estimated_overtime_hours: toIntOrNull(parsed.estimated_overtime_hours, 0, 999),
    turnover_rate:            toIntOrNull(parsed.turnover_rate, 0, 100),
    retention_rate:           toIntOrNull(parsed.retention_rate, 0, 100),
    dev_environment:          toIntOrNull(parsed.dev_environment, 1, 10),
    skill_up_support:         toIntOrNull(parsed.skill_up_support, 1, 10),
    description:              typeof parsed.description === 'string' ? parsed.description : null,
    tags:                     Array.isArray(parsed.tags)
      ? (parsed.tags as unknown[]).filter((t): t is string => typeof t === 'string')
      : null,
  }
}

function toIntOrNull(val: number | null | undefined, min: number, max: number): number | null {
  if (val == null || typeof val !== 'number' || isNaN(val)) return null
  const n = Math.round(val)
  if (n < min || n > max) return null
  return n
}
```

---

## 7. エラーハンドリング

### 7.1 API レベルのエラー

| エラー | HTTP Status | 処理 | 結果 |
|---|---|---|---|
| Ollama 接続不可 | (네트워크 에러) | throw | パイプライン全体中止 |
| Ollama API エラー | 5xx | throw | パイプライン全体中止 |
| モデル未インストール | 404 (?) | throw | パイプライン全体中止 |

### 7.2 パース レベルのエラー

| エラー | 処理 | 結果 |
|---|---|---|
| JSON パース失敗 | throw | パイプライン全体中止 |
| コードブロックの除去後も JSON でない | throw | パイプライン全体中止 |

### 7.3 バリデーション レベルのエラー

| エラー | 処理 | 結果 |
|---|---|---|
| 数値が範囲外 | null に変換 | 該当フィールドのみ null、その他は正常値 |
| 型エラー（string が number） | null に変換 | 同上 |
| tags に non-string を含む | filter で除外 | string のみ返す |

---

## 8. テストケース

### 8.1 正常系

```json
{
  "tech_stack_modernity": 8,
  "remote_rate": 75,
  "estimated_overtime_hours": 20,
  "turnover_rate": 15,
  "retention_rate": 85,
  "dev_environment": 7,
  "skill_up_support": 8,
  "description": "モダン技術でリモート対応。エンジニア育成に積極的。",
  "tags": ["Go", "TypeScript", "Kubernetes", "フルリモート"]
}
```

**期待値**: すべてのフィールドが正常値で返される

### 8.2 部分的 null

```json
{
  "tech_stack_modernity": 8,
  "remote_rate": null,
  "estimated_overtime_hours": null,
  "turnover_rate": 20,
  "retention_rate": 80,
  "dev_environment": 7,
  "skill_up_support": null,
  "description": null,
  "tags": ["Go"]
}
```

**期待値**: null のフィールドはそのまま null、others は正常

### 8.3 異常値

```json
{
  "tech_stack_modernity": 11,
  "remote_rate": -10,
  "estimated_overtime_hours": 8.7,
  "turnover_rate": "high",
  "retention_rate": 100,
  "dev_environment": null,
  "skill_up_support": 3,
  "description": 123,
  "tags": ["Go", 2, "Rust"]
}
```

**期待値**:
- `tech_stack_modernity: null`（11 は 1–10 外）
- `remote_rate: null`（-10 は 0–100 外）
- `estimated_overtime_hours: 9`（8.7 → round）
- `turnover_rate: null`（型エラー）
- `retention_rate: 100`（正常）
- `dev_environment: null`（null のまま）
- `skill_up_support: 3`（正常）
- `description: null`（型エラー）
- `tags: ["Go", "Rust"]`（数値2を除外）

### 8.4 コードブロック付き出力

入力（Ollama 出力）:
```
```json
{
  "tech_stack_modernity": 8,
  ...
}
```
```

**期待値**: コードブロック除去後、正常にパース

---

## 9. Ollama モデルの選択

### 9.1 推奨モデル

| モデル | メモリ | 推奨 | 理由 |
|---|---|---|---|
| `gemma2` | 6 GB | ⭐⭐⭐ | 小型・高速、日本語 OK |
| `llama2` | 7 GB | ⭐⭐ | 英語向け、日本語の扱いが微妙 |
| `mistral` | 7 GB | ⭐ | 英語向け |

### 9.2 モデルインストール

```bash
ollama pull gemma2
ollama serve  # デフォルト port 11434
```

---

## 10. パフォーマンス・制限

| 項目 | 値 | 備考 |
|---|---|---|
| 入力テキスト最大サイズ | ~50 KB | combinedContent の制限 |
| Ollama 処理時間 | 5–30秒 | モデル・テキストサイズに依存 |
| 温度設定 | 0.1 | 決定論的出力（低いほど安定） |
| 出力フィールド | 9 | 固定 |

