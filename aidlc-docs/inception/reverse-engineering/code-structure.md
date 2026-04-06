# Code Structure

## Build System
- **Type**: npm + Vite
- **TypeScript**: tsc -b + vite build
- **Linting**: ESLint

## Existing Files Inventory

### Pages
- `src/pages/Home.tsx` - トップページ（企業一覧・チャートパネル）
- `src/pages/CompanyDetail.tsx` - 企業詳細ページ

### Hooks
- `src/hooks/useCompanyData.ts` - 企業一覧データファサード（Supabase取得）
- `src/hooks/usePersonalWeights.ts` - パーソナライズウェイト管理
- `src/hooks/useCompanyById.ts` - 企業詳細データ取得
- `src/hooks/useCompanyFilter.ts` - **本タスクで追加予定**（企業絞り込みロジック）

### Components - Filter
- `src/components/filter/PersonalWeightPanel.tsx` - パーソナライズスライダーUI

### Components - Company
- `src/components/company/CompanyCard.tsx` - 企業カード
- `src/components/company/ScoreBadge.tsx` - スコアバッジ
- `src/components/company/SourceBadge.tsx` - データソースバッジ
- `src/components/company/ReliabilityIndicator.tsx` - 信頼度インジケーター

### Components - Charts
- `src/components/charts/RadarChartComponent.tsx` - レーダーチャート
- `src/components/charts/ComparisonBarChart.tsx` - 比較棒グラフ

### Components - Layout
- `src/components/layout/Header.tsx` - ヘッダー
- `src/components/layout/Footer.tsx` - フッター

### Data & Types
- `src/types/company.ts` - Company / CompanyScores / UserWeights 型定義
- `src/data/mockData.ts` - モックデータ（開発用フォールバック）
- `src/utils/scoring.ts` - スコアリングロジック
- `src/utils/reliability.ts` - 信頼度計算
- `src/constants/sourceMetricMap.ts` - データソース指標マッピング
- `src/lib/supabase.ts` - Supabaseクライアント・rowToCompanyマッパー

### Root
- `src/App.tsx` - Routerルート定義
- `src/main.tsx` - アプリエントリーポイント

## Design Patterns

### Data Facade Pattern
- **Location**: `src/hooks/useCompanyData.ts`
- **Purpose**: Supabase→モックの切り替えをフック内に閉じ込め、UIコンポーネントをデータソースから分離

### Scoring Pipeline Pattern
- **Location**: `src/utils/scoring.ts`
- **Purpose**: 生データ→正規化→重み付け合計という変換パイプラインを純粋関数で実装

## Key Technical Debt
- `CompanyDetail.tsx` に `normalizeForDisplay` が重複実装（`scoring.ts`の`normalizeScores`と同一ロジック）
