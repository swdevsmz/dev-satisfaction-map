# API Documentation

## External APIs

### Supabase REST API（自動生成）
- **エンドポイント**: Supabase Project URL（環境変数 VITE_SUPABASE_URL）
- **認証**: anon key（環境変数 VITE_SUPABASE_ANON_KEY）

#### companies テーブル
- **操作**: SELECT * ORDER BY name
- **利用箇所**: `useCompanyData.ts`, `useCompanyById.ts`
- **カラム**: id, name, description, industry, employee_count, location, scores(JSON), happiness_score, tags(array), data_updated_at

#### raw_documents テーブル
- **操作**: SELECT（企業IDで絞り込み）
- **利用箇所**: `useCompanyById.ts`（詳細ページのデータソース表示）

## Internal Hook APIs

### useCompanyData()
```typescript
{
  companies: Company[]
  ranked: Company[]          // happinessScore降順
  selectedId: string | null
  setSelectedId: (id: string) => void
  selectedCompany: Company | null
  isLoading: boolean
  error: string | null
}
```

### usePersonalWeights()
```typescript
{
  weights: UserWeights
  updateWeight: (key: keyof UserWeights, value: number) => void
  resetWeights: () => void
  isPersonalized: boolean
  sortByPersonal: (companies: Company[]) => Company[]
}
```

### useCompanyById(id: string)
```typescript
{
  company: CompanyWithSources | null
  isLoading: boolean
  error: string | null
}
```

## Data Models

### Company
```typescript
{
  id: string                // URLスラッグ（例: "mercari-jp"）
  name: string
  description: string
  industry: string
  employeeCount: number
  location: string
  scores: CompanyScores
  happinessScore: number    // 0-100
  tags: string[]
  dataUpdatedAt: string
}
```

### CompanyScores
```typescript
{
  techStackModernity: number    // 1-10
  remoteRate: number            // 0-100%
  estimatedOvertimeHours: number
  turnoverRate: number          // 0-100%
  retentionRate: number         // 0-100%
  devEnvironment: number        // 1-10
  skillUpSupport: number        // 1-10
}
```

### UserWeights
```typescript
{
  techStackModernity: number    // 0-3
  remoteRate: number
  estimatedOvertimeHours: number
  turnoverRate: number
  retentionRate: number
  devEnvironment: number
  skillUpSupport: number
}
```
