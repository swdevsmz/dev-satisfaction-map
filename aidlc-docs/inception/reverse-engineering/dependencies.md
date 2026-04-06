# Dependencies

## Internal Dependencies

```
src/pages/Home.tsx
  -> src/hooks/useCompanyData.ts
  -> src/hooks/usePersonalWeights.ts
  -> src/components/filter/PersonalWeightPanel.tsx
  -> src/components/company/CompanyCard.tsx
  -> src/components/charts/RadarChartComponent.tsx
  -> src/components/charts/ComparisonBarChart.tsx
  -> src/utils/scoring.ts

src/pages/CompanyDetail.tsx
  -> src/hooks/useCompanyById.ts
  -> src/utils/scoring.ts
  -> src/utils/reliability.ts
  -> src/components/company/SourceBadge.tsx
  -> src/components/company/ReliabilityIndicator.tsx
  -> src/components/company/ScoreBadge.tsx

src/hooks/useCompanyData.ts
  -> src/lib/supabase.ts
  -> src/types/company.ts

src/hooks/useCompanyById.ts
  -> src/lib/supabase.ts
  -> src/types/company.ts
```

## External Dependencies

| パッケージ | バージョン | 用途 |
|---|---|---|
| react | 18.3.1 | UIフレームワーク |
| react-router-dom | 7.14.0 | ルーティング |
| recharts | 3.8.1 | チャート描画 |
| @supabase/supabase-js | 2.101.1 | DB接続 |
| react-helmet-async | 3.0.0 | SEO |
| tailwindcss | 3.4.19 | スタイリング |
| cheerio | 1.2.0 | HTML解析（pipeline） |
| tsx | 4.21.0 | TS実行（pipeline） |
| vite | 6.0.5 | ビルド |
| typescript | ~5.6.2 | 型チェック |
