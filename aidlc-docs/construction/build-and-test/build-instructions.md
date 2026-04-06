# Build Instructions - company-filter

## Prerequisites

- **Node.js**: 18以上
- **npm**: 9以上
- **環境変数**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`（既存設定）
- **OS**: Windows / macOS / Linux

## Build Steps

### 1. 依存パッケージのインストール

fast-check が追加されたため、`npm install` を実行してください。

```bash
npm install
```

確認: `node_modules/fast-check/` が存在すること

### 2. TypeScript 型チェック

```bash
npx tsc --noEmit
```

**期待する結果**: エラー 0 件

注意事項:
- `useCompanyData.ts` から `ranked` が不要になったため、型エラーが出る場合は [src/hooks/useCompanyData.ts](../../src/hooks/useCompanyData.ts) を確認してください
  - `ranked` は返却されたままでも問題ありません（使用しないだけ）

### 3. ESLint チェック

```bash
npm run lint
```

**期待する結果**: エラー 0 件（警告は許容）

### 4. プロダクションビルド

```bash
npm run build
```

**期待する結果**:
- `dist/` ディレクトリが生成される
- バンドルサイズに fast-check が含まれないことを確認（devDependency のため）

### 5. 開発サーバーで動作確認

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開き、以下を確認:
- フィルターバーがカード一覧の上部に表示される
- キーワード入力でリアルタイムに絞り込まれる
- スコア/リモート率ボタンが機能する
- タグバッジが表示・選択できる
- 0件時にメッセージが表示される
- リセットボタンで全件表示に戻る
- ランキングバーグラフがフィルター後の企業を反映する

## Troubleshooting

### TypeScript エラー: `ranked` が見つからない

`Home.tsx` から `ranked` の使用を削除済みのため、`useCompanyData.ts` の返却型から削除しても問題ありません。ただし破壊的変更を避けたい場合は放置で構いません。

### fast-check が見つからない

```bash
npm install
```

を再実行してください。
