# Frontend Components - company-filter

## Component Hierarchy

```
Home.tsx
  └─ PersonalWeightPanel (既存・変更なし)
  └─ CompanyFilterBar    (新規)
       └─ [Search Input]
       └─ [Score Buttons]   全て / 40以上 / 70以上
       └─ [Remote Buttons]  全て / 50%以上 / 80%以上
       └─ [Tag Badges]      top10 タグ
  └─ CompanyCard Grid   (既存・変更なし)
  └─ EmptyFilterMessage (0件時、Home.tsx内インライン)
```

## CompanyFilterBar

### Props
```typescript
interface CompanyFilterBarProps {
  keyword: string
  onKeywordChange: (k: string) => void

  minScore: number
  onScoreChange: (s: number) => void

  minRemoteRate: number
  onRemoteRateChange: (r: number) => void

  selectedTags: string[]
  onTagToggle: (tag: string) => void
  availableTags: string[]

  activeCount: number
  isFiltered: boolean
  onReset: () => void

  filteredCount: number
  totalCount: number
}
```

### Visual Layout

```
+----------------------------------------------------------+
| 🔍 [企業名・説明・業種で検索         ] [X件/Y件] [リセット]|
+----------------------------------------------------------+
| スコア: [全て] [40以上] [70以上]                           |
| リモート: [全て] [50%以上] [80%以上]                       |
+----------------------------------------------------------+
| [Go] [React] [TypeScript] [リモートOK] [SaaS] ...        |
+----------------------------------------------------------+
```

- 上段: キーワード入力 + 件数表示 + リセットボタン（isFiltered時のみ表示）
- 中段: スコア・リモートクイックボタン（2行、横並び）
- 下段: タグバッジ（availableTags が空の場合は非表示）

### State
なし（全状態は useCompanyFilter フックで管理）

### Accessibility
- 検索入力: `aria-label="企業を検索"` `type="search"`
- タグボタン: `aria-pressed={selectedTags.includes(tag)}`
- スコアボタン: `aria-pressed={minScore === value}`
- リモートボタン: `aria-pressed={minRemoteRate === value}`

## EmptyFilterMessage（Home.tsx インライン）

### 表示条件
`filteredList.length === 0 && isFiltered`

### 表示内容
```
「該当する企業が見つかりません」
[フィルターをリセット] ボタン
```

## Home.tsx 変更点

### 追加するフック呼び出し
```typescript
const {
  keyword, setKeyword,
  minScore, setMinScore,
  minRemoteRate, setMinRemoteRate,
  selectedTags, toggleTag,
  availableTags,
  filtered,
  activeCount, isFiltered,
  reset,
} = useCompanyFilter(companies)
```

### 変更するデータパイプライン
```typescript
// Before
const displayList = isPersonalized ? sortByPersonal(companies) : companies
const rankedList  = isPersonalized ? sortByPersonal(ranked)    : ranked

// After
const filteredRanked = [...filtered].sort((a, b) => b.happinessScore - a.happinessScore)
const displayList    = isPersonalized ? sortByPersonal(filtered)       : filtered
const rankedList     = isPersonalized ? sortByPersonal(filteredRanked) : filteredRanked
```

### 追加するUI要素
```tsx
<CompanyFilterBar
  keyword={keyword} onKeywordChange={setKeyword}
  minScore={minScore} onScoreChange={setMinScore}
  minRemoteRate={minRemoteRate} onRemoteRateChange={setMinRemoteRate}
  selectedTags={selectedTags} onTagToggle={toggleTag}
  availableTags={availableTags}
  activeCount={activeCount} isFiltered={isFiltered} onReset={reset}
  filteredCount={filtered.length} totalCount={companies.length}
/>
```

## User Interaction Flows

### Flow 1: キーワード検索
1. ユーザーが検索フィールドに入力
2. `onKeywordChange` 呼び出し → `keyword` 状態更新
3. `useMemo` が再実行 → `filtered` 更新
4. カードグリッド・チャートがリアルタイム更新

### Flow 2: タグフィルター
1. ユーザーがタグバッジをクリック
2. `onTagToggle(tag)` 呼び出し
3. `selectedTags` に追加 or 削除（トグル）
4. `filtered` 更新 → UI更新

### Flow 3: 0件時
1. `filtered.length === 0` かつ `isFiltered === true`
2. カードグリッドの代わりに EmptyFilterMessage を表示
3. 「フィルターをリセット」押下 → `reset()` 呼び出し → 全件表示に戻る
