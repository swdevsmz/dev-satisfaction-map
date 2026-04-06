# Tech Stack Decisions - company-filter

## 決定一覧

### TSD-01: PBTフレームワーク — fast-check

| 項目 | 内容 |
|---|---|
| 採用技術 | fast-check |
| バージョン | latest（devDependencies） |
| 採用理由 | TypeScript/JavaScript向け標準PBTライブラリ。shrinking・seed・カスタムジェネレーター対応。Vite/Vitestとの親和性が高い |
| 代替案 | なし（JSエコシステムではfast-checkが事実上の標準） |
| インストール | `npm install -D fast-check` |
| バンドル影響 | なし（devDependenciesのためビルド成果物に含まれない） |

### TSD-02: テストランナー — 未設定（後日Vitest推奨）

| 項目 | 内容 |
|---|---|
| 現状 | プロジェクトにテストランナー未設定 |
| 今回の対応 | テストファイルのみ作成。実行方法をコメントに記載 |
| 推奨 | Vitest（Viteプロジェクトとの親和性が最高） |
| 将来の設定 | `npm install -D vitest @vitest/ui`、`vitest.config.ts` 追加 |
| 暫定実行方法 | `npx tsx <テストファイルパス>` |

### TSD-03: フィルタ実装 — useMemo（debounceなし）

| 項目 | 内容 |
|---|---|
| 採用 | React useMemo |
| 不採用 | debounce / useCallback |
| 採用理由 | 対象データ72社以下。useMemoで依存配列が変わったときのみ再計算されるため十分 |
| 見直し条件 | 企業数が500社を超えた場合にdebounce追加を検討 |

### TSD-04: XSS対策 — React JSX自動エスケープ

| 項目 | 内容 |
|---|---|
| 採用 | React JSXのテンプレートリテラル展開（自動エスケープ） |
| 不採用 | 手動サニタイズライブラリ（DOMPurify等） |
| 採用理由 | ReactのJSX式`{value}`は自動的にHTMLエスケープされる。追加ライブラリ不要 |
| 禁止事項 | `dangerouslySetInnerHTML`の使用禁止 |

## 依存パッケージ変更

```diff
  "devDependencies": {
    "@types/node": "^25.5.2",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.27",
+   "fast-check": "latest",
    "postcss": "^8.5.8",
    "supabase": "^2.84.10",
    "tailwindcss": "^3.4.19",
    "tsx": "^4.21.0",
    "typescript": "~5.6.2",
    "vite": "^6.0.5"
  }
```
