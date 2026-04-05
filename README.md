# dev-satisfaction-map

エンジニアが働きやすい企業を、複数指標から可視化するフロントエンドアプリです。

企業ごとの「エンジニア幸福度スコア」を算出し、一覧・ランキング・レーダーチャート・詳細画面で比較できます。

## 主な機能

- 企業一覧表示（カードUI）
- 幸福度スコアのランキング表示（棒グラフ）
- 選択企業のスコアバランス表示（レーダーチャート）
- 企業詳細ページでの指標内訳表示
- SEO 用の title / meta description 設定（react-helmet-async）

## 技術スタック

- React 18
- TypeScript
- Vite
- React Router
- Recharts
- Tailwind CSS
- PostCSS / Autoprefixer

## 画面構成

- `/` : ホーム
  - 企業カード一覧
  - 選択企業のレーダーチャート
  - 幸福度ランキング（棒グラフ）
- `/company/:id` : 企業詳細
  - 企業概要
  - 幸福度スコア
  - 指標ごとの内訳バー
  - レーダーチャート

## スコア算出ロジック

幸福度スコアは、7つの指標を 0–100 に正規化し、重み付き合計で算出しています。

### 指標と重み

- techStackModernity: 0.20
- remoteRate: 0.20
- estimatedOvertimeHours: 0.20（反転: 少ないほど高評価）
- turnoverRate: 0.10（反転: 低いほど高評価）
- retentionRate: 0.10
- devEnvironment: 0.10
- skillUpSupport: 0.10

最終スコアは 0–100 にクランプし、小数点第1位で四捨五入します。

## セットアップ

前提:

- Node.js（LTS 推奨）
- npm

インストール:

```bash
npm install
```

開発サーバ起動:

```bash
npm run dev
```

ビルド:

```bash
npm run build
```

プレビュー:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## ディレクトリ構成

```text
src/
  components/
    charts/
    company/
    layout/
  data/
    mockData.ts
  hooks/
    useCompanyData.ts
  pages/
    Home.tsx
    CompanyDetail.tsx
  types/
    company.ts
  utils/
    scoring.ts
```

## データについて

現在は `src/data/mockData.ts` のモックデータを使用しています。

必要に応じて API 連携に置き換える場合は、`useCompanyData` をデータ取得層として拡張する構成が扱いやすいです。

## ライセンス

必要に応じて追記してください。
