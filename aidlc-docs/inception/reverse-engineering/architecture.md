# System Architecture

## System Overview

React + Vite SPA。データはSupabase（PostgreSQL）に格納され、フロントエンドは`@supabase/supabase-js`で直接取得する。データ収集はNode.jsパイプラインで別途実行。

## Architecture Diagram

```
+------------------+     +------------------+     +-------------------+
|  Browser (SPA)   |     |   Supabase DB    |     |  Pipeline (Node)  |
|  React + Vite    |<--->|  PostgreSQL      |<----|  Scrapers         |
|  Tailwind CSS    |     |  companies table |     |  Scoring          |
+------------------+     +------------------+     +-------------------+
        |                        |
        |                 +------+------+
        |                 | Raw Docs    |
        |                 | raw_documents|
        |                 +-------------+
        |
+------------------+
|  Google AdSense  |
|  (収益化)         |
+------------------+
```

Text Alternative:
- Browser SPA (React/Vite) <-> Supabase (PostgreSQL: companies, raw_documents)
- Pipeline (Node.js scrapers) -> Supabase
- AdSense integrated in index.html

## Component Descriptions

### src/pages/Home.tsx
- **Purpose**: トップページ。企業一覧・レーダーチャート・ランキング棒グラフ
- **Dependencies**: useCompanyData, usePersonalWeights, PersonalWeightPanel, CompanyCard, charts

### src/pages/CompanyDetail.tsx
- **Purpose**: 企業詳細ページ。7指標スコア内訳・データソース表示
- **Dependencies**: useCompanyById, scoring utils, SourceBadge, ReliabilityIndicator

### src/hooks/useCompanyData.ts
- **Purpose**: 企業一覧データのファサード。Supabaseから取得
- **Type**: Data Access Hook

### src/hooks/usePersonalWeights.ts
- **Purpose**: パーソナライズウェイト管理（localStorageに永続化）

### src/hooks/useCompanyById.ts
- **Purpose**: 企業詳細データをIDで取得

### src/utils/scoring.ts
- **Purpose**: スコアリングロジック（normalizeScores, calculateHappinessScore, toRadarData等）

### src/lib/supabase.ts
- **Purpose**: Supabaseクライアント初期化・rowToCompanyマッピング

## Data Flow

```
Supabase companies table
  -> useCompanyData (fetch + sort)
    -> Home.tsx (display list)
      -> CompanyCard (individual card)
      -> RadarChartComponent (score radar)
      -> ComparisonBarChart (ranking bar)
    -> PersonalWeightPanel (weight sliders)
      -> usePersonalWeights (localStorage)
        -> sortByPersonal (rerank companies)
```

## Integration Points

- **Supabase**: PostgreSQL DB（企業データ・生データ格納）
- **Google AdSense**: index.htmlに直接埋め込み
- **Recharts**: レーダーチャート・棒グラフ
- **react-helmet-async**: SEO用メタタグ管理
