# Business Logic Model - company-filter

## Core Algorithm: filterCompanies

```
Input:  companies: Company[], filterState: FilterState
Output: Company[] (subset of input)

Algorithm:
  For each company in companies:
    1. KEYWORD CHECK (if keyword not empty):
       lowerKeyword = keyword.toLowerCase()
       hit = company.name.toLowerCase().includes(lowerKeyword)
            OR company.description.toLowerCase().includes(lowerKeyword)
            OR company.industry.toLowerCase().includes(lowerKeyword)
       if NOT hit → exclude company

    2. SCORE CHECK:
       if company.happinessScore < minScore → exclude company

    3. REMOTE RATE CHECK:
       if company.scores.remoteRate < minRemoteRate → exclude company

    4. TAG CHECK (if selectedTags not empty):
       if NOT all selectedTags are in company.tags → exclude company

    5. PASS: include company
```

## Data Flow: Home.tsx Integration

```
useCompanyData()
  └─> companies: Company[]  (Supabase取得、name昇順)
        │
        ▼
useCompanyFilter(companies)
  └─> filteredList: Company[]  (絞り込み後)
        │
        ├─> displayList
        │     isPersonalized ? sortByPersonal(filteredList)
        │                    : filteredList
        │     → CompanyCard グリッド
        │
        └─> rankedList
              isPersonalized ? sortByPersonal(filteredList sorted by score)
                             : filteredList sorted by score descending
              → ComparisonBarChart
              → RadarChartComponent (selectedCompany from filteredList)
```

## Available Tags Algorithm

```
Input:  companies: Company[]
Output: string[] (最大10件)

Algorithm:
  tagCounts = Map<string, number>
  For each company:
    For each tag in company.tags:
      tagCounts[tag] += 1

  Sort by count descending
  Return top 10 tag names
```

## Filter + PersonalWeights Interaction

```
Priority: Filter first → Sort second

filteredList = filterCompanies(companies, filterState)
displayList  = isPersonalized
             ? sortByPersonal(filteredList)      // パーソナルスコア順
             : filteredList                       // 元の順序維持

rankedList   = isPersonalized
             ? sortByPersonal(filteredListSorted) // パーソナルスコア順
             : filteredListSorted                 // happinessScore降順

filteredListSorted = [...filteredList].sort((a, b) => b.happinessScore - a.happinessScore)
```

## Testable Properties (PBT-01)

| # | プロパティカテゴリ | 説明 | テスト式 |
|---|---|---|---|
| P1 | Invariant | 結果は入力の部分集合 | `result.length <= companies.length` |
| P2 | Invariant | 空フィルターは全件返す | `filter(companies, empty) === companies` |
| P3 | Invariant | フィルター強化で件数は単調減少 | `filter(A) ⊆ filter(B) if A stricter than B` |
| P4 | Idempotence | 同じフィルター2回適用で同結果 | `filter(filter(c, f), f) ≡ filter(c, f)` |
| P5 | Invariant | 結果の全企業はフィルター条件を満たす | `result.every(c => matches(c, filterState))` |
| P6 | Invariant | availableTags は最大10件 | `tags.length <= 10` |
| P7 | Invariant | availableTags の各タグは少なくとも1社が保有 | `tags.every(t => companies.some(c => c.tags.includes(t)))` |
