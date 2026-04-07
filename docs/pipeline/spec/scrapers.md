# パイプライン仕様書 — スクレイパー詳細実装仕様

各スクレイパー（connpass / openwork / github / ir）の実装ルール、アルゴリズム、データ抽出ロジック。

---

## 1. 共通インターフェース

すべてのスクレイパーは同じ型を返します。

```typescript
export interface ScrapedDocument {
  companyId: string                          // 入力値と同じ
  source:    'connpass' | 'openwork' | 'ir' | 'github'
  url:       string | null                   // 取得元URL、失敗時は null
  content:   string                          // 構造化プレーンテキスト
}
```

### 1.1 content の構造

- **言語**: 日本語
- **フォーマット**: プレーンテキスト（Markdown ライク）
- **構成**: メタデータ → セクション → データ行
- **サイズ**: 5–50 KB（Ollama の入力制限内）
- **特殊文字**: 日本語は UTF-8、HTML エスケープはなし

#### テンプレート（汎用）

```
企業ID: {companyId}
ソース: {SourceName（日本語説明）}
URL: {url}

【セクション1】
data-key: value
...

【セクション2】
- item 1
- item 2
```

---

## 2. connpass スクレイパー

### 2.1 機能概要

Connpass 勉強会プラットフォームから、企業のコミュニティ活動を取得。
Ollama の `skill_up_support` スコア推定の主要情報源。

### 2.2 URL マッピング

```typescript
const CONNPASS_GROUP_MAP: Record<string, string> = {
  'mercari-jp':  'mercari',
  'cyberagent':  'cyberagent',
  'rakuten':     'rakuten',
  // ... 80+企業
}
```

- キー: 内部企業ID（`companyId`）
- 値: Connpass グループスラッグ

### 2.3 取得アルゴリズム

#### Step 1: グループページからイベント取得

```
URL: https://{groupSlug}.connpass.com/event/
Method: GET
Headers: User-Agent, Accept-Language: ja など
```

HTML を Cheerio でパース。`.group_event_list, .vevent` 要素から：

| 項目 | CSS セレクタ | 抽出ロジック |
|---|---|---|
| タイトル | `.event_title` | text() |
| URL | `a.image_link`, `a[href*="/event/"]` | attr('href') |
| 開始日時 | `.dtstart .value-title` | attr('title') → ISO Date パース |
| 定員 | `.event_participants` | text() 内の数字を正規表現で抽出 |

**戻り値**: `ConnpassEvent[]`

```typescript
interface ConnpassEvent {
  title: string
  url: string
  startedAt: Date | null   // ISO 日時パース失敗時は null
  capacity: number | null  // 定員数、不明時は null
}
```

#### Step 2: グループページ取得失敗時のフォールバック

グループページが 404 or 無い場合、Connpass 検索ページにフォールバック：

```
URL: https://connpass.com/search/?keyword={企業名}&order=2
```

JSON-LD (`script[type="application/ld+json"]`) から `@type === "Event"` を抽出。

#### Step 3: スコア推定値の計算

```typescript
function estimateSkillUpSupport(recentCount: number): number {
  if (recentCount === 0)  return 1   // 開催なし
  if (recentCount <= 2)   return 3   // 年1, 2回
  if (recentCount <= 5)   return 5   // 年3–5回
  if (recentCount <= 10)  return 7   // 年6–10回
  return 9                           // 11回以上 → モダンな組織
}
```

**判定基準**: 過去1年（365日）のイベント数を集計。

#### Step 4: 技術タグ抽出

イベントタイトルから正規表現でマッチ：

```typescript
const TECH_PATTERN = /\b(Go|Rust|Python|TypeScript|JavaScript|Kotlin|Swift|Java|Ruby|PHP|C\+\+|React|Vue|Next\.js|Flutter|Kubernetes|k8s|Docker|AWS|GCP|Azure|ML|AI|LLM|RAG|生成AI|機械学習|データ基盤|マイクロサービス|GraphQL|gRPC)\b/gi
```

- マッチしたタグを Set に格納（重複除去）
- 上位10件に限定

### 2.5 content の生成

```
企業ID: {companyId}
ソース: Connpass（勉強会活動）
URL: {取得元URL}
取得期間: 過去1年

【勉強会開催実績】
開催件数（過去1年）: {recentCount}件
平均定員数: {avgCapacity}人

【スコア推定値（LLM抽出用ヒント）】
skill_up_support推定: {score}/10（開催{recentCount}件から算出）
技術タグ: {tags.join(', ')}

【イベント一覧（最新10件）】
- {title}（{date}, 定員: {capacity}人）
...

（イベント情報が取得できない場合）
```

### 2.6 エラーハンドリング

| エラー | 処理 | content |
|---|---|---|
| グループページ・検索ページ両方 404 | 空 content を返す | "（イベント情報を取得できませんでした）" |
| HTML パース失敗 | 例外発生 → runPipeline で catch | スクレイパーエラーとして扱う |
| ネットワークタイムアウト | null 返す → Step 2 へ | フォールバック実行 |

---

## 3. openwork スクレイパー

### 3.1 機能概要

OpenWork（社員口コミサイト）から企業の評価・働き方データを取得。
`remote_rate`, `turnover_rate`, `retention_rate` などの主要情報源。

### 3.2 前提条件

```typescript
export async function scrapeOpenWork(
  companyId: string,
  acceptTos: boolean   // ← クライアントが --accept-tos フラグを指定
): Promise<ScrapedDocument>
```

- **必須**: `--accept-tos` フラグが指定されていること
- **必須**: `OPENWORK_COOKIE` 環境変数に有効なセッション Cookie
- **理由**: OpenWork は利用規約で無断スクレイピングを禁止。ログイン+ToS 確認が必須。

### 3.3 URL マッピング戦略

優先順位付き候補 URL リストを生成：

```typescript
function resolveCandidateUrls(companyId: string): string[] {
  const candidates = []
  
  // 優先1: 環境変数の個社設定（OPENWORK_URL_MERCARI_JP など）
  const directUrl = process.env[`OPENWORK_URL_${toEnvKey(companyId)}`]
  if (directUrl) candidates.push(directUrl)
  
  // 優先2: 環境変数の JSON マップ（OPENWORK_URL_MAP='{"mercari-jp": "https://..."}'）
  const fromJsonMap = parseJsonUrlMap()[companyId]
  if (typeof fromJsonMap === 'string') candidates.push(fromJsonMap)
  else if (Array.isArray(fromJsonMap)) candidates.push(...fromJsonMap)
  
  // 優先3: 埋め込み m_id ベース URL
  const openworkId = OPENWORK_ID_MAP[companyId]
  if (openworkId) {
    candidates.push(`https://www.openwork.jp/company.php?m_id=${openworkId}`)
    candidates.push(`https://www.openwork.jp/company_answer.php?m_id=${openworkId}`)
  }
  
  return [...new Set(candidates)]  // 重複除去
}
```

**company.php** と **company_answer.php** の違い：
- `company.php`: 評価・スコア（新形式） ← 優先
- `company_answer.php`: 口コミQ&A（旧形式）

### 3.4 データ取得アルゴリズム

#### Step 1: 候補 URL の試行

```typescript
async function fetchFirstAvailablePage(
  urls: string[],
  headers: Record<string, string>
) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers, redirect: 'follow' })
      if (res.ok) {
        const html = await res.text()
        return { url, html, tried }
      }
      tried.push({ url, status: res.status, statusText: res.statusText })
    } catch {
      tried.push({ url, status: 0, statusText: 'NETWORK_ERROR' })
    }
  }
  return { url: null, html: null, tried }
}
```

順番に GET リクエストを送信。最初に成功（status 200）したページを使用。

#### Step 2: ブロック検出

ログイン必須or アクセスブロック页面かチェック：

```typescript
function hasBlockedOrErrorContent($: CheerioAPI): boolean {
  const title = $('title').text().trim()
  return /403|forbidden|404|not found|captcha|ロボット/i.test(title)
}
```

真の場合 → エラー content を返す（スコア抽出スキップ）

#### Step 3: 評価スコア抽出

**JSON-LD から総合評価**:

```typescript
$('script[type="application/ld+json"]').each((_, el) => {
  try {
    const json = JSON.parse($(el).text())
    if (json['@type'] === 'EmployerAggregateRating') {
      lines.push(`総合評価スコア（5点満点）: ${json.ratingValue}`)
    }
  } catch { /* ignore */ }
})
```

**カテゴリ別評価（CSS セレクタ）**:

```typescript
// 複数の可能性のあるセレクタを試行
$('.evaluate_category_list li, .evaluation_list li, [class*="category"] li').each((_, el) => {
  const label = $(el).find('.label, [class*="label"]').first().text().trim()
  const score = $(el).find('.point, [class*="point"]').first().text().trim()
  if (label && score) lines.push(`${label}: ${score}`)
})
```

**dt/dd 形式データ（残業時間など）**:

```typescript
$('dt').each((_, dt) => {
  const label = $(dt).text().trim()
  const ddText = $(dt).next('dd').find('span.fs-14, span').first().text().trim()
                 || $(dt).next('dd').text().trim()
  if (label && ddText && ddText.length < 50) {
    lines.push(`${label}: ${ddText}`)
  }
})
```

#### Step 4: 口コミ抽出

```typescript
$('.review_list .review_item, .answerList .answerBox').each((_, el) => {
  if (reviewCount >= 5) return false  // 最大5件
  
  const title = $(el).find('.review_title, .title').first().text().trim() || '口コミ'
  const body = $(el).find('.review_body, .text').first()
                 .text()
                 .trim()
                 .replace(/\s+/g, ' ')  // 連続空白を1つに
                 .slice(0, 200)  // 最大200文字
  
  if (body) {
    lines.push(`- ${title}: ${body}`)
    reviewCount++
  }
})
```

### 3.5 content の生成

```
企業ID: {companyId}
ソース: OpenWork（社員・元社員の口コミ）
URL: {取得元URL}

【評価スコア】
総合評価スコア（5点満点）: 3.9
待遇面の満足度: 3.8
社員の士気: 4.1
...

【採用・離職データ】
採用者数: 120名 / 離職者数: 18名

【口コミ抜粋（最新5件）】
- 待遇について: フルリモート可で働きやすい...
- 技術環境: Go/Kubernetes などモダン技術を導入...
...

（ログイン必須の場合）
```

### 3.6 エラーハンドリング

| 状況 | 処理 | エラーメッセージ |
|---|---|---|
| 候補 URL がない | 空の content | "OpenWork のURL候補がありません。OPENWORK_URL_MAP を設定してください。" |
| すべての URL が 404 | 空の content | "OPENWORK_COOKIE が未設定です。" |
| ブロック/エラーページ | 空の content | "アクセスブロック。OPENWORK_URL_<ID> を見直してください。" |
| ネットワークエラー | null → スクレイパーエラー | "NETWORK_ERROR" |
| `--accept-tos` なし | throw | "OpenWork のスクレイピングには --accept-tos フラグが必要です。" |

---

## 4. github スクレイパー

### 4.1 機能概要

GitHub の Organization（org）から OSS 活動・技術スタックを取得。
`tech_stack_modernity`, `dev_environment` の主要情報源。

### 4.2 URL マッピング

```typescript
const GITHUB_ORG_MAP: Record<string, string> = {
  'mercari-jp': 'mercari',
  'cyberagent': 'cyberagent',
  // ... 60+企業
}
```

- キー: 内部企業ID
- 値: GitHub org 名（例: `mercari` → `https://github.com/mercari`）

### 4.3 API 呼び出し

3つの GitHub API を並列呼び出し：

```typescript
const [org, repos, events] = await Promise.all([
  fetchJson<GitHubOrg>(`https://api.github.com/orgs/${orgName}`),
  fetchJson<GitHubRepo[]>(`https://api.github.com/orgs/${orgName}/repos?per_page=100&sort=pushed`),
  fetchJson<GitHubEvent[]>(`https://api.github.com/orgs/${orgName}/events?per_page=30`),
])
```

#### レスポンス型

```typescript
interface GitHubOrg {
  public_repos: number  // 公開リポジトリ数
  followers: number     // フォロワー数
}

interface GitHubRepo {
  name: string
  language: string | null  // 言語（例: "Go", "TypeScript", null）
  pushed_at: string        // ISO 日時
  stargazers_count: number // stars
  fork: boolean            // フォーク済みフラグ
}

interface GitHubEvent {
  type: string      // "PushEvent", "PullRequestEvent" など
  created_at: string // ISO 日時
}
```

### 4.4 tech_stack_modernity スコア算出

```typescript
const MODERN_LANGS = new Set(['typescript', 'rust', 'go', 'kotlin', 'swift'])
const MID_LANGS = new Set(['python', 'javascript', 'ruby', 'scala', 'elixir'])
const LEGACY_LANGS = new Set(['php', 'perl', 'vba', 'cobol', 'fortran'])

function estimateTechStackModernity(repos: GitHubRepo[]): { score: number; topLangs: string[] } {
  // 1. リポジトリ言語を集計（フォーク除外）
  const langCount = new Map<string, number>()
  for (const repo of repos) {
    if (repo.fork || !repo.language) continue
    const lang = repo.language.toLowerCase()
    langCount.set(lang, (langCount.get(lang) ?? 0) + 1)
  }
  
  // 2. 言語の出現頻度でソート（降順）
  const sorted = [...langCount.entries()].sort((a, b) => b[1] - a[1])
  const topLangs = sorted.slice(0, 8).map(([lang]) => lang)
  
  // 3. スコア計算（ベース 5）
  let score = 5
  const hasModern = topLangs.some(l => MODERN_LANGS.has(l))
  const hasMid = topLangs.some(l => MID_LANGS.has(l))
  const allLegacy = topLangs.length > 0 && topLangs.every(l => LEGACY_LANGS.has(l))
  
  if (hasModern) score += 2    // モダン言語あり → +2
  if (hasMid && !hasModern) score += 1  // Mid 言語のみ → +1
  if (allLegacy) score -= 2    // 全てレガシー → -2
  else if (hasLegacy && !hasModern) score -= 1  // レガシーのみ → -1
  
  return {
    score: Math.max(1, Math.min(10, score)),
    topLangs: sorted.slice(0, 10).map(([lang]) => lang)
  }
}
```

**採点ルール**:
- ベーススコア: 5
- モダン言語（Go/Rust/TS）あり: +2
- Mid 言語（Python/JS/Ruby）あり: +1
- レガシー言語のみ（PHP/COBOL）: -2
- 最終: 1–10 に clamp

### 4.5 dev_environment スコア算出

```typescript
function estimateDevEnvironment(org: GitHubOrg, recentEventCount: number): number {
  let score = 3  // ベーススコア
  
  if (org.public_repos >= 50) score += 2
  else if (org.public_repos >= 20) score += 1
  
  if (recentEventCount >= 20) score += 3
  else if (recentEventCount >= 10) score += 2
  else if (recentEventCount >= 3) score += 1
  
  return Math.max(1, Math.min(10, score))
}
```

**採点ルール**:
- ベーススコア: 3
- 公開 repo 50+ : +2、20–49: +1
- 過去30日イベント 20+: +3、10–19: +2、3–9: +1
- 最終: 1–10 に clamp

### 4.6 content の生成

```
企業ID: {companyId}
ソース: GitHub（OSS活動）
GitHub org: {orgName}
URL: https://github.com/{orgName}

【org概要】
公開リポジトリ数: {org.public_repos}
フォロワー数: {org.followers}
過去30日のイベント数: {recentEventCount}

【スコア推定値（LLM抽出用ヒント）】
tech_stack_modernity推定: {techScore}/10
dev_environment推定: {devScore}/10
技術タグ: {topLangs.join(', ')}

【リポジトリ一覧（最新push順、上位10件）】
- {repo.name} [{language}] stars:{stargazers_count} (pushed: {pushed_at.slice(0, 10)})
...
```

### 4.7 エラーハンドリング

| エラー | 処理 | content |
|---|---|---|
| org が存在しない（404） | null 返す | "GitHub API からorg情報を取得できませんでした（org未存在またはrate limit超過）。" |
| rate limit 超過 | null 返す | 同上 |
| ネットワークエラー | null 返す | 同上 |

**アクセス**: GitHub API 認証なしで60 req/h、`GITHUB_TOKEN` で5000 req/h に拡張可

---

## 5. ir スクレイパー

### 5.1 機能概要

IR（Investor Relations）ページから企業の財務・人事データ取得（実装未完）。
現状：ページ取得成否の確認のみ。

### 5.2 URL マッピング

```typescript
const IR_URL_MAP: Record<string, string> = {
  'mercari-jp': 'https://about.mercari.com/ir/',
  'cyberagent': 'https://www.cyberagent.co.jp/ir/',
  // ... 50+企業
}
```

### 5.3 実装（現状）

```typescript
export async function scrapeIR(companyId: string): Promise<ScrapedDocument> {
  const url = IR_URL_MAP[companyId] ?? null
  
  if (!url) {
    return {
      companyId,
      source: 'ir',
      url: null,
      content: [
        `企業ID: ${companyId}`,
        `ソース: IR（投資家向け情報）`,
        ``,
        `【データ取得不可】`,
        `IR URLのマッピングが未登録です。IR_URL_MAP に追加してください。`,
      ].join('\n'),
    }
  }
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': '...' } })
    
    if (!res.ok) {
      return {
        companyId,
        source: 'ir',
        url,
        content: `【データ取得不可 - HTTP ${res.status}】`
      }
    }
    
    // HTML は取得したが、テキスト抽出は未実装
    return {
      companyId,
      source: 'ir',
      url,
      content: [
        `企業ID: ${companyId}`,
        `ソース: IR（投資家向け情報）`,
        `URL: ${url}`,
        ``,
        `【IR情報】`,
        `ページ取得成功 (HTTP 200)`,
        `※ 詳細な財務・人事データの抽出は未実装です。`,
      ].join('\n'),
    }
  } catch {
    return {
      companyId,
      source: 'ir',
      url,
      content: `【データ取得不可 - ネットワークエラー】`
    }
  }
}
```

### 5.4 将来の実装予定

- PDF ダウンロード（決算説明会資料など）
- テーブルデータ抽出（売上、エンジニア採用数など）
- 自動スクレイプ可能ページのみを content に含める

---

## 6. スクレイパー共通仕様

### 6.1 HTTP ヘッダ

すべてのスクレイパーで設定：

```typescript
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Referer': '{各サイトの Referer}',
}
```

**理由**: リクエストをブラウザになりすまし（ロボット判定回避）

### 6.2 エラー時のデフォルト content

HTML パース失敗など予期しないエラー時：

```
企業ID: {companyId}
ソース: {SourceName}
URL: {url または "取得不可"}

【データ取得不可 - {ErrorType}】
{詳細メッセージ}
```

Ollama はこのテンプレートを読み、null を返すよう指示されています。

### 6.3 タイムアウト

```typescript
// fetch のタイムアウト実装は別途（AbortController 使用）
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30_000)  // 30秒

try {
  const res = await fetch(url, { signal: controller.signal })
  // ...
} finally {
  clearTimeout(timeoutId)
}
```

現状: Node.js fetch に明示的なタイムアウト実装なし（環境依存）

