# 調査・技術選定の根拠: seo-ad-monetization

---

## サマリー

- **フィーチャー**: `seo-ad-monetization`
- **ディスカバリースコープ**: Extension（既存ブラウンフィールドへの拡張）
- **主要な知見**:
  - CSR SPAにおけるOGP動的生成はSNSクローラーに届かないため、静的共通OGP画像方式を採用する
  - `react-helmet-async` v3 は `<script type="application/ld+json">` の注入をサポートするため、JSON-LD用の外部ライブラリ追加は不要
  - GA4の`useAnalytics`フックは型安全なDiscriminated Unionで実装し、DNT対応は`navigator.doNotTrack === '1'`チェックで実現する

---

## 調査ログ

### OGP動的生成方式の選定

- **コンテキスト**: CSR SPA（React + Vite）ではSNSクローラーがJavaScript実行前にHTMLをクロールするため、Helmで設定した動的OGPタグが読み取られない可能性がある
- **参照ドキュメント**: ギャップ分析レポート（5. 設計フェーズへの引き継ぎ事項）
- **調査結果**:
  - **Option A（採用）: 静的共通OGP画像1枚** — `public/og-default.png`（1200×630px）を全ページで共用。SNSクローラーには `index.html` のデフォルトOGPタグが読み取られる。最も実装コストが低い。
  - **Option B: Vite SSG（vite-plugin-ssg）** — ビルド時にHTMLを静的生成し、ページごとのOGPを埋め込める。移行コストが高く、既存のCSR前提のコードへの影響が大きい。
  - **Option C: Supabase Edge FunctionsによるOG画像動的生成** — 企業ごとのOGP画像をオンデマンド生成。最も高品質だが実装コストが高い。
- **選択**: Option A（静的共通OGP画像）
- **根拠**: Phase 1ではSNSシェア時のリンクプレビューの有無が最重要であり、企業固有の動的OGPは「あればより良い」レベル。まず最小コストで全ページへのOGP付与を達成し、トラフィックデータを見てからPhase 2でSSG/Edge Functions方式を検討する。

---

### JSON-LD注入方式の選定

- **コンテキスト**: `react-helmet-async` を用いたJSON-LDの `<script>` タグ注入方法の確認
- **参照ドキュメント**: react-helmet-async npm公式ドキュメント、WebSearch結果
- **調査結果**:
  - `<Helmet>` の `script` propに `{ type: 'application/ld+json', innerHTML: JSON.stringify(schema) }` を渡すことでサポートされている
  - `google/react-schemaorg` ライブラリを使えばSchema.orgの型チェックが可能だが、追加依存が発生する
  - `schema-dts` npm パッケージでSchema.orgのTypeScript型定義を利用できるが、本プロジェクトのスキーマは単純（WebSite・Organization）なためインライン定義で十分
- **選択**: `JsonLd.tsx` コンポーネントで `react-helmet-async` の `script` propを使用。外部スキーマライブラリは追加しない
- **根拠**: 依存関係を最小化しつつ、必要なスキーマの型安全性を `seo.ts` のインターフェース定義で確保できる

---

### GA4統合方式の選定

- **コンテキスト**: React + TypeScriptでのGA4実装方法とDNT対応
- **参照ドキュメント**: WebSearch（GA4 gtag.js React TypeScript 2025）
- **調査結果**:
  - `react-ga4` ライブラリ（npm）が一般的に使用されているが、gtag.jsを直接利用した`useAnalytics`カスタムフックでも型安全に実装できる
  - `navigator.doNotTrack === '1'` チェックによるDNT対応が推奨パターン
  - React Router v7との統合では `useLocation` の `useEffect` による経路変更検知でpage_viewイベントを送信する
- **選択**: 外部ライブラリ不使用、gtag.jsを直接呼び出す `useAnalytics` カスタムフックを実装
- **根拠**: `react-ga4` はGA4サポートのために内部でgtag.jsを使用しており、ラップすることでバンドルサイズが増加するが得られる利益が少ない。直接実装で完全な型制御が可能。

---

### AdSenseコンポーネント実装方式の選定

- **コンテキスト**: React SPAでのAdUnit再利用可能コンポーネントの設計
- **参照ドキュメント**: WebSearch（Google AdSense React TypeScript 2025）
- **調査結果**:
  - `(window.adsbygoogle = window.adsbygoogle || []).push({})` を `useEffect` 内で呼び出すパターンが標準
  - 広告ブロッカー存在時は `window.adsbygoogle.push` が実行されないため、`minHeight` CSS設定でレイアウト保護が必要
  - `data-adtest="on"` はlocalhostでのテスト広告配信に使用するが、Googleは本番環境での使用を禁止している
  - AdSenseはlocalhost/開発環境では広告を配信しないため、本番デプロイ後のテストが必須
- **選択**: 再利用可能な `AdUnit.tsx` コンポーネントとして実装。`import.meta.env.DEV` で開発時のみ `adTest` を有効化

---

### sitemap.xml生成方式の選定

- **コンテキスト**: Supabaseの企業IDリストを基にした動的sitemap生成
- **参照ドキュメント**: `vite-plugin-sitemap` GitHub、Vite公式プラグインAPI
- **調査結果**:
  - `vite-plugin-sitemap` はルートオブジェクトから静的sitemap.xmlを生成できるが、Supabaseからの動的データ取得には対応していない
  - Viteプラグインの `closeBundle` フックを利用して、ビルド完了後に任意の非同期処理（Supabase取得→ファイル書き込み）を実行できる
  - カスタムViteプラグインとして実装することで、`vite.config.ts` への統合と既存ビルドパイプラインへの影響を最小化できる
- **選択**: `scripts/generate-sitemap.ts` をカスタムViteプラグインの `closeBundle` フックで呼び出す方式
- **根拠**: 外部プラグインへの依存を追加するより、シンプルなカスタムスクリプトの方が保守性が高い

---

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク / 制限 |
|---|---|---|---|
| A: 静的共通OGP画像（採用） | `public/og-default.png` をすべてのページで使用 | 実装コスト最小・即時対応可能 | 企業固有のOGP画像がなくSNSシェア時のリッチさが低い |
| B: Vite SSG | ビルド時にHTML静的生成 | 企業ごとのOGP対応可能・SEO最高品質 | 既存CSRコードへの影響大・移行コスト高 |
| C: Edge Functions OG画像動的生成 | Supabase Edge FunctionsでOG画像を動的生成 | 最高品質のSNSプレビュー | 実装コスト高・インフラ追加 |

---

## リスクと軽減策

- **GA4スクリプトの非同期ロード遅延**: `window.gtag` の存在チェックを各呼び出し前に実施し、未定義時は送信をスキップする
- **AdSenseの本番環境テスト必須**: localhost環境では広告が配信されないため、ステージング/本番環境での動作確認をタスクに含める
- **sitemap.xml生成失敗時のCI検出**: ビルドログを監視するCI設定を推奨する。`generate-sitemap.ts` はエラーでプロセスを終了させず、ビルド自体は成功する設計とする
- **`Company.website` フィールドの欠落**: 現フェーズではDBマイグレーションを行わないため、`generateOrganizationSchema` は `url` フィールドなしのスキーマを返すケースが多数発生する。Organization JSON-LDの `url` はオプショナルのため仕様上問題なし

---

## 参考資料

- [How to Implement Google AdSense into ReactJS - 2025 - DEV Community](https://dev.to/deuos/how-to-implement-google-adsense-into-reactjs-2025-5g3h)
- [react-helmet-async npm](https://www.npmjs.com/package/react-helmet-async)
- [GitHub - google/react-schemaorg](https://github.com/google/react-schemaorg)
- [React Google Analytics 4 Tutorial: Type-Safe GA4 Implementation - DEV Community](https://dev.to/connectaryal/react-google-analytics-4-tutorial-type-safe-ga4-implementation-with-ecommerce-tracking-1g1d)
- [GitHub - Tormak9970/vite-plugin-sitemap](https://github.com/Tormak9970/vite-plugin-sitemap)
- [XML Sitemap Protocol 0.9](https://www.sitemaps.org/protocol.html)
