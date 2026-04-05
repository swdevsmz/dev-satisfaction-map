# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # 開発サーバー起動 (http://localhost:5173)
npm run build      # TypeScript型チェック + Viteビルド
npm run lint       # ESLint実行
npm run preview    # ビルド成果物のプレビュー
```

## Architecture

**エンジニア幸福度マップ** — 求人データからエンジニアの働きやすさを可視化するWebサービス（Phase 1: モックデータ実装済み）。

### Data Flow

```
src/data/mockData.ts          # 企業データ（将来Supabaseに移行予定）
  └─> src/hooks/useCompanyData.ts  # データファサード（Supabase移行に備えた抽象化層）
        └─> pages/Home.tsx         # 企業一覧 + チャートパネル
src/utils/scoring.ts          # スコアリングロジック（calculateHappinessScore, toRadarData等）
src/types/company.ts          # Company / CompanyScores / RadarDataPoint 型定義
```

### Routes

- `/` — 企業一覧（CompanyCard グリッド + RadarChart + ランキング棒グラフ）
- `/company/:id` — 企業詳細（スコア内訳・各指標の進捗バー）

### Scoring System

7指標（合計重み 1.00）を 0–100 に正規化して重み付き合計し `happinessScore` を算出：

| 指標 | 重み | 反転 |
|------|------|------|
| techStackModernity (1–10) | 0.20 | — |
| remoteRate (0–100%) | 0.20 | — |
| estimatedOvertimeHours | 0.20 | ✓ (80h基準) |
| turnoverRate (0–100%) | 0.10 | ✓ |
| retentionRate (0–100%) | 0.10 | — |
| devEnvironment (1–10) | 0.10 | — |
| skillUpSupport (1–10) | 0.10 | — |

スコア色分け: ≥70 → green, ≥40 → yellow, <40 → red

### Key Design Decisions

- **`useCompanyData` はデータファサード**: 現在はモックデータを返すが、Supabase移行時はこのフック内だけを変更する設計。`CompanyDetail` ページは直接 `mockCompanies` をインポートしており、Supabase移行時に合わせて修正が必要。
- **`normalizeForDisplay`** は `CompanyDetail.tsx` 内にも重複実装あり（`scoring.ts` の `normalizeScores` と同一ロジック）。Supabase移行時に統合推奨。
- SEOは `react-helmet-async` で各ページに `<Helmet>` を配置。
