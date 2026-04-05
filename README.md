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
- Supabase (PostgreSQL)
- Vercel（ホスティング）

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

## Supabase セットアップ

### 環境変数

`.env.local.sample` をコピーして `.env.local` を作成し、Supabase Dashboardの値を設定する。

```bash
cp .env.local.sample .env.local
```

Supabase Dashboard → Project Settings → Data API から取得：

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### リモートDBとのリンク

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
```

Project Ref は Supabase Dashboard → Project Settings → General で確認。

### マイグレーション適用（テーブル作成・RLS設定）

```bash
npm run db:push
```

`supabase/migrations/` 配下のSQLが順番に実行される。

### シードデータの投入（初回のみ）

```bash
npx supabase db query --linked -f supabase/seed.sql
```

モック企業データ5社が投入される。

### 新しいマイグレーションの作成

```bash
npx supabase migration new <migration_name>
# supabase/migrations/<timestamp>_<migration_name>.sql が生成される
```

## Vercel デプロイ

### 初回デプロイ手順

1. [vercel.com](https://vercel.com) でGitHubリポジトリをインポート
2. Framework Preset: **Vite**（自動検出）
3. Build Command: `npm run build` / Output Directory: `dist`（デフォルトのまま）
4. Environment Variables に以下を追加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

### 以降のデプロイ

`main` ブランチへのプッシュで自動デプロイされる。

### SPAルーティング対応

`vercel.json` で全リクエストを `index.html` にリライトしており、
`/company/:id` への直接アクセスでも404にならない。

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## ディレクトリ構成

```text
src/
  components/
    charts/
    company/
    layout/
  data/
    mockData.ts          # モックデータ（参照用・変更不要）
  hooks/
    useCompanyData.ts    # 企業一覧フェッチ（isLoading/error対応）
    useCompanyById.ts    # 企業詳細フェッチ
  lib/
    supabase.ts          # Supabaseクライアント + rowToCompany変換
  pages/
    Home.tsx
    CompanyDetail.tsx
  types/
    company.ts
  utils/
    scoring.ts
supabase/
  migrations/            # DBマイグレーション（Gitで管理）
  seed.sql               # 初期データ（モック5社）
```

## ライセンス

必要に応じて追記してください。
