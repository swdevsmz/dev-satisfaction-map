# Component Inventory

## Application Packages

| パッケージ | タイプ | 説明 |
|---|---|---|
| src/ | Frontend SPA | React + Vite フロントエンド |
| pipeline/ | Data Pipeline | スクレイピング・スコアリングパイプライン |
| supabase/ | DB Migration | Supabase スキーマ定義 |

## Frontend コンポーネント内訳

### Pages (2)
- `Home.tsx` - 企業一覧・チャートパネル
- `CompanyDetail.tsx` - 企業詳細

### Hooks (4)
- `useCompanyData.ts` - 企業一覧データ
- `usePersonalWeights.ts` - パーソナライズウェイト
- `useCompanyById.ts` - 企業詳細データ
- `useCompanyFilter.ts` - **追加予定**

### UI Components (9)
- Filter: PersonalWeightPanel
- Company: CompanyCard, ScoreBadge, SourceBadge, ReliabilityIndicator
- Charts: RadarChartComponent, ComparisonBarChart
- Layout: Header, Footer

### Utils/Lib (4)
- scoring.ts, reliability.ts, sourceMetricMap.ts, supabase.ts

## Total Count
- **Total Source Files**: 22（追加予定含む）
- **Pages**: 2
- **Hooks**: 4
- **Components**: 9
- **Utils/Lib**: 4
- **Types/Data**: 3
