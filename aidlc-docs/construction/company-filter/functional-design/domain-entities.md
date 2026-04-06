# Domain Entities - company-filter

## FilterState

```typescript
interface FilterState {
  keyword: string        // キーワード検索文字列（空 = 無効）
  minScore: number       // スコア下限: 0 | 40 | 70
  minRemoteRate: number  // リモート率下限: 0 | 50 | 80
  selectedTags: string[] // 選択中タグ（空配列 = 無効）
}

const INITIAL_FILTER_STATE: FilterState = {
  keyword: '',
  minScore: 0,
  minRemoteRate: 0,
  selectedTags: [],
}
```

## FilterThreshold (定数)

```typescript
const SCORE_THRESHOLDS = [
  { label: '全て',  value: 0  },
  { label: '40以上', value: 40 },
  { label: '70以上', value: 70 },
] as const

const REMOTE_RATE_THRESHOLDS = [
  { label: '全て',    value: 0  },
  { label: '50%以上', value: 50 },
  { label: '80%以上', value: 80 },
] as const
```

## useCompanyFilter Hook Return Type

```typescript
interface UseCompanyFilterReturn {
  // State
  keyword: string
  minScore: number
  minRemoteRate: number
  selectedTags: string[]

  // Setters
  setKeyword: (k: string) => void
  setMinScore: (s: number) => void
  setMinRemoteRate: (r: number) => void
  toggleTag: (tag: string) => void

  // Derived
  filtered: Company[]        // フィルター後の企業リスト
  availableTags: string[]    // 表示するタグ（上位10件）
  activeCount: number        // アクティブなフィルター数（バッジ表示用）
  isFiltered: boolean        // フィルターが1つ以上有効か

  // Actions
  reset: () => void
}
```

## Relationships

```
Home.tsx
  uses useCompanyData() → companies: Company[]
  uses useCompanyFilter(companies) → UseCompanyFilterReturn
  uses usePersonalWeights() → weights, sortByPersonal, isPersonalized

  Data pipeline:
    companies
      → filtered          (useCompanyFilter)
        → displayList     (sortByPersonal if isPersonalized)
        → rankedList      (sort by score, then sortByPersonal if isPersonalized)
```
