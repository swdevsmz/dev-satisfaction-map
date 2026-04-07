# 実装計画

## タスク一覧

- [x] 1. SEOユーティリティ層の構築
- [x] 1.1 (P) SEOユーティリティ関数を実装する
  - `src/utils/seo.ts` に canonical URL・ページタイトル・メタディスクリプション・OGP情報・JSON-LDスキーマ・SNSシェアURL生成の純粋関数群を実装する
  - `generatePageTitle` は60文字以内、`generatePageDescription` は160文字以内になるよう末尾切り詰めを行う
  - `generateOrganizationSchema` は `name` が欠落している場合に `null` を返し、ページ本体の表示を継続させる
  - `BASE_URL = 'https://engineer-happiness-map.com'` を定数として保持する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.4, 3.1, 3.2, 3.5_

- [x] 1.2 (P) `Company` 型に `website` 任意フィールドを追加する
  - `src/types/company.ts` の `Company` インターフェースに `website?: string` を追加する
  - 既存コンポーネントへの影響がないことを確認する（任意フィールドのため破壊的変更なし）
  - _Requirements: 2.2_

- [x] 2. SEOメタ情報の静的ファイル整備
- [x] 2.1 (P) `robots.txt` を作成する
  - `public/robots.txt` を作成し、`User-agent: *`、`Allow: /`、`Disallow: /api/`、`Sitemap: https://engineer-happiness-map.com/sitemap.xml` を記載する
  - _Requirements: 1.5_

- [x] 2.2 (P) デフォルトOGP画像を用意する
  - 1200×630px サイズの `public/og-default.png` を配置する（サービスロゴ・サービス名・キャッチコピーを含むデザイン）
  - Viteビルド時に `dist/og-default.png` へ出力されることを確認する
  - _Requirements: 3.4, 3.5_

- [x] 2.3 (P) `index.html` にGA4スクリプトとデフォルトOGP・Twitter Cardメタタグを追加する
  - `<head>` に GA4 の `async` スクリプトタグと `gtag('config', ...)` 初期化スクリプトを追加する（GA4計測IDは環境変数から注入）
  - デフォルト値として `og:url`（ルートURL）・`og:image`（`/og-default.png` の絶対URL）を追加する
  - デフォルト値として `twitter:card`・`twitter:site`・`twitter:title`・`twitter:description`・`twitter:image` を追加する
  - これらはページ固有 Helmet の値にフォールバックとして機能することを確認する
  - _Requirements: 3.3, 3.4, 8.1, 8.5_

- [x] 3. JSON-LD コンポーネントの実装
- [x] 3.1 `JsonLd` コンポーネントを実装する
  - `src/components/seo/JsonLd.tsx` を作成し、スキーマオブジェクトを `<script type="application/ld+json">` タグとして `react-helmet-async` 経由で注入する
  - `schema` が `null` の場合は `null` を返してレンダリングをスキップする
  - `JSON.stringify` によるシリアライズのみを担当し、副作用を持たない
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. `App.tsx` のルートlazy loadingとプライバシーポリシールート追加
- [x] 4.1 ルートコンポーネントをlazy loadingに変更し、`/privacy-policy` ルートを追加する
  - `Home`・`CompanyDetail` を `React.lazy` + `Suspense` でlazy importに変更して初期バンドルサイズを削減する
  - `PrivacyPolicy` ページをlazy importし、`/privacy-policy` ルートを追加する
  - `Suspense` の `fallback` に全画面スピナーを設定する
  - _Requirements: 4.2, 8.7_

- [x] 5. GA4アナリティクスフックの実装
- [x] 5.1 `useAnalytics` フックを実装する
  - `src/hooks/useAnalytics.ts` を作成し、GA4イベント送信をラップする型安全なインターフェースを提供する
  - `navigator.doNotTrack === '1'` を検出した場合はすべてのトラッキングを無効化する
  - `window.gtag` の存在チェックを各送信前に行い、未定義の場合はサイレントにスキップする
  - `trackPageView`・`trackEvent`（`company_view`・`share`・`copy_url`）を実装する
  - `window.gtag` の型定義拡張（`declare global { interface Window { gtag: ... } }`）を追加する
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 6. クリップボードフックの実装
- [x] 6.1 (P) `useClipboard` フックを実装する
  - `src/hooks/useClipboard.ts` を作成し、`navigator.clipboard.writeText` によるコピーと `isCopied` 状態管理を行う
  - コピー成功後、指定ミリ秒（デフォルト2000ms）後に `isCopied` を自動リセットする
  - エラー時（権限拒否等）は `console.error` でログ出力し、`isCopied` は更新しない
  - _Requirements: 6.4, 6.5_

- [x] 7. 広告コンポーネントの実装
- [x] 7.1 (P) `AdUnit` コンポーネントを実装する
  - `src/components/ads/AdUnit.tsx` を作成し、Google AdSenseの広告ユニット（インフィード・ディスプレイ）をラップする再利用可能コンポーネントを実装する
  - `useEffect` 内で `(window.adsbygoogle = window.adsbygoogle || []).push({})` を呼び出す
  - `window.adsbygoogle` が未定義の場合（広告ブロッカー）でも `minHeight` でレイアウト崩れを防ぐ
  - 「広告」ラベルを上部に表示し、コンテンツと広告の境界を明示する
  - モバイルレスポンシブ広告は `data-full-width-responsive="true"` で対応する
  - 開発環境（`import.meta.env.DEV`）では `data-adtest="on"` を有効化する
  - `window.adsbygoogle` の型定義拡張を追加する
  - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 9.5_

- [x] 8. SNSシェアコンポーネントの実装
- [x] 8.1 (P) `ShareButtons` コンポーネントを実装する
  - `src/components/share/ShareButtons.tsx` を作成し、X（旧Twitter）・Facebookのシェアボタンを実装する
  - `seo.ts` の `generateTwitterShareUrl` / `generateFacebookShareUrl` を使用してシェアURLを生成する
  - クリック時に `useAnalytics` の `trackEvent({ name: 'share', platform: 'twitter' | 'facebook' })` を呼び出す
  - タッチターゲットを最低44×44pxに確保する
  - _Requirements: 6.1, 6.2, 8.4, 9.3_

- [x] 8.2 (P) `CopyUrlButton` コンポーネントを実装する
  - `src/components/share/CopyUrlButton.tsx` を作成し、URLコピーボタンとトースト通知を実装する
  - `useClipboard` フックから `isCopied` 状態を取得し、コピー済みの場合はボタンラベルを「コピー済み ✓」に変更する
  - トースト通知はTailwind `transition-opacity` によるフェードインアニメーションで実装し、外部ライブラリは使用しない
  - _Requirements: 6.4, 6.5_

- [x] 9. ナビゲーション・企業関連コンポーネントの実装
- [x] 9.1 (P) `Breadcrumb` コンポーネントを実装する
  - `src/components/navigation/Breadcrumb.tsx` を作成し、階層ナビゲーション（パンくずリスト）を表示する
  - `<nav aria-label="パンくずリスト">` + `<ol>` 要素でマークアップする（アクセシビリティ対応）
  - 最末端のアイテムは `<span aria-current="page">` とし、リンクなしにする
  - _Requirements: 7.3_

- [x] 9.2 (P) `RelatedCompanies` コンポーネントを実装する
  - `src/components/company/RelatedCompanies.tsx` を作成し、幸福度スコアが近い企業3〜5件を「他の企業も見る」セクションとして表示する
  - 全企業から `currentCompany.id` を除外し、`happinessScore` の差の絶対値で昇順ソートして上位 `maxCount` 件を取得する
  - 表示可能な企業が存在しない場合はセクション自体を非表示にする（`null` を返す）
  - _Requirements: 7.1_

- [x] 10. `Home.tsx` の改修
- [x] 10.1 `Home.tsx` にSEOメタ情報・JSON-LD・OGPを追加する
  - `<Helmet>` に `<link rel="canonical">` ・完全OGPタグ（`og:title`・`og:description`・`og:url`・`og:image`・`og:type`）・Twitter Cardタグを追加する
  - `<JsonLd schema={generateWebSiteSchema()} />` を Helmet 内に配置する
  - `seo.ts` の各関数を使用してタイトル・ディスクリプション・canonical URLを生成する
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.3, 3.1, 3.3, 3.4, 3.5_

- [x] 10.2 `Home.tsx` にインフィード広告とTOP3ハイライトを追加する
  - `<AdUnit adSlot="..." adFormat="fluid" adLayout="in-feed" />` を CompanyCardリストの5〜6件ごとに挿入する
  - `happinessScore` 降順でソートした上位3件に視覚的な強調スタイル（`ring-2 ring-green-400` 等）を適用してハイライト表示する
  - _Requirements: 5.2, 5.3, 5.4, 6.3_

- [x] 11. `CompanyDetail.tsx` の改修
- [x] 11.1 `CompanyDetail.tsx` にSEOメタ情報・JSON-LD・OGPを追加する
  - `<Helmet>` に動的 canonical・動的 OGP（企業名・幸福度スコアを含む）・Twitter Cardタグを追加する
  - `<JsonLd schema={generateOrganizationSchema(company)} />` を追加する
  - ローディング時のスピナーをスケルトンUIに変更し、CLS を 0.1 未満に抑える
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.5_

- [x] 11.2 `CompanyDetail.tsx` にシェア・パンくず・広告・関連企業・アナリティクスを統合する
  - `<Breadcrumb>` をメインコンテンツ最上部に配置する
  - `<ShareButtons>` と `<CopyUrlButton>` を Hero セクション内に配置する
  - `<AdUnit adSlot="..." />` をスコア詳細セクション後に配置する
  - `<RelatedCompanies currentCompany={company} />` をページ末尾に配置する
  - `useAnalytics` を使用し、`company_view` イベントをマウント時に送信する
  - 幸福度スコア各指標からフィルターバーへのアンカーリンクを適切な箇所に設置する
  - _Requirements: 5.3, 6.1, 6.2, 6.4, 7.1, 7.3, 7.5, 8.3_

- [x] 12. 既存コンポーネントの改修
- [x] 12.1 (P) `ComparisonBarChart.tsx` にバークリック遷移を追加する
  - `onBarClick?: (companyId: string) => void` プロップを追加する
  - Recharts の `<Bar>` に `onClick` ハンドラを追加し、`onBarClick(companyId)` を呼び出す
  - `Home.tsx` 側で `useNavigate` を使用して `/company/:id` へ遷移する
  - _Requirements: 7.2_

- [x] 12.2 (P) `Footer.tsx` にプライバシーポリシーリンクと関連コンテンツリンクを追加する
  - プライバシーポリシーへの `<Link to="/privacy-policy">` を追加する
  - トップページへ戻るリンク等の関連コンテンツリンクを追加する
  - _Requirements: 7.4, 8.7_

- [x] 13. プライバシーポリシーページの実装
- [x] 13.1 (P) `PrivacyPolicy.tsx` を実装する
  - `src/pages/PrivacyPolicy.tsx` を作成し、GA4とGoogle AdSenseの利用に基づくプライバシーポリシーを表示する静的ページを実装する
  - `<Helmet>` で適切なタイトル・メタディスクリプション・canonical URLを設定する
  - 記載事項：収集するデータの種類（アクセスログ・Cookie）、利用目的（分析・広告配信）、第三者提供（Google）、オプトアウト方法、お問い合わせ先
  - _Requirements: 8.7_

- [x] 14. sitemap.xml ビルドスクリプトの実装
- [x] 14.1 sitemap生成スクリプトを実装する
  - `scripts/generate-sitemap.ts` を作成し、Supabaseから企業IDを取得して `public/sitemap.xml` を生成するビルド時スクリプトを実装する
  - トップページ（`changefreq: daily, priority: 1.0`）と企業詳細ページ（`changefreq: weekly, priority: 0.8`）を含むXML Sitemap Protocol 0.9形式で出力する
  - Supabase取得失敗時はコンソールにエラーを出力し、既存ファイルを保持する（`process.exit` 不使用）
  - 環境変数 `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` をビルド時に読み込む
  - _Requirements: 1.6, 1.7_

- [x] 14.2 `vite.config.ts` にsitemap生成プラグインを統合する
  - `vite.config.ts` に `closeBundle` フックを持つViteプラグインとして `generateSitemap()` を統合する
  - ビルド完了後に自動でsitemap.xmlが生成されることを確認する
  - _Requirements: 1.6_

- [x] 15. ページパフォーマンス最適化
- [x] 15.1 (P) クリティカルリソースのpreloadとWebP画像対応を設定する
  - `index.html` に `<link rel="preload">` を追加してフォント・主要CSSを優先読み込みする
  - 既存画像をWebP形式または AVIF 形式で提供し、適切な `width`・`height` 属性を設定する
  - 外部リソース（フォント・広告スクリプト等）の読み込み失敗時にコアコンテンツへの影響がないことを確認する
  - _Requirements: 4.3, 4.4, 4.6_

- [x] 15.2 モバイルUIのレイアウト対応を確認・修正する
  - モバイル画面（幅767px以下）でレーダーチャートとランキングバーチャートが縦に積み重なり、横スクロールが発生しないことを確認・修正する
  - `<meta name="viewport">` タグがすべてのページに設定されていることを確認する（既実装）
  - すべてのタップ可能要素に最低44×44pxのタッチターゲットサイズを確保する
  - _Requirements: 9.1, 9.3, 9.4_

- [ ] 16. パフォーマンス・品質検証
- [ ] 16.1 Google PageSpeed Insights スコアを計測・改善する
  - 本番環境相当のビルドで PageSpeed Insights のモバイル Performance スコアが70点以上を達成することを確認する
  - スコアが未達の場合は主要ボトルネックを特定して改善する
  - _Requirements: 4.1_

- [ ] 16.2 Google Search Console モバイルフレンドリーテストを確認する
  - デプロイ後に Google Search Console のモバイルフレンドリーテストで Pass を達成することを確認する
  - _Requirements: 9.2_

- [x]* 16.3 SEOメタ情報の受け入れ基準テストを追加する
  - 各ページのタイトルが一意で60文字以内であることを検証するテストを追加する
  - 各ページのメタディスクリプションが160文字以内であることを検証するテストを追加する
  - canonical URLが正しく設定されていることを検証するテストを追加する
  - _Requirements: 1.1, 1.2, 1.4_

- [x]* 16.4 構造化データ出力のユニットテストを追加する
  - `generateWebSiteSchema` と `generateOrganizationSchema` が正しいJSON-LDを返すことをテストする
  - 必須フィールド欠落時に `null` が返ることをテストする
  - _Requirements: 2.1, 2.2, 2.4_
