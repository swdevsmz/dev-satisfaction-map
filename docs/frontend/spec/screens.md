# 画面仕様書

React 画面側を既存実装から逆引きした仕様書。

対象コード:

- `src/App.tsx`
- `src/pages/Home.tsx`
- `src/pages/CompanyDetail.tsx`
- `src/pages/PrivacyPolicy.tsx`
- `src/hooks/useCompanyData.ts`
- `src/hooks/useCompanyById.ts`
- `src/hooks/useCompanyFilter.ts`
- `src/hooks/usePersonalWeights.ts`

---

## 1. 画面一覧

| 画面 | パス | コンポーネント | 役割 |
|---|---|---|---|
| ホーム | `/` | `Home` | 企業一覧、パーソナライズ、絞り込み、ランキング表示 |
| 企業詳細 | `/company/:id` | `CompanyDetail` | 企業単位のスコア詳細、信頼度、シェア、関連企業表示 |
| プライバシーポリシー | `/privacy-policy` | `PrivacyPolicy` | Analytics / AdSense 利用方針の説明 |

---

## 2. Home

### 2.1 目的

- 企業一覧を幸福度スコア順または個人マッチ度順で閲覧できる
- 企業カード選択に応じてレーダーチャートを比較できる
- キーワード、スコア、リモート率、タグで絞り込める

### 2.2 使用フック

| フック | 用途 |
|---|---|
| `useCompanyData()` | 企業一覧取得、選択中企業の管理 |
| `usePersonalWeights()` | 指標ごとの重み設定、localStorage 永続化 |
| `useCompanyFilter(companies)` | キーワード、閾値、タグによる絞り込み |

### 2.3 主要表示ブロック

| ブロック | 内容 |
|---|---|
| Hero | タイトル、サブタイトル |
| PersonalWeightPanel | 7指標の重要度スライダー。0〜3 の4段階 |
| CompanyFilterBar | 検索入力、件数表示、スコア閾値、リモート率閾値、タグ絞り込み、リセット |
| 企業一覧 | `CompanyCard` をグリッド表示。TOP3 は緑枠で強調 |
| レーダーチャート | 選択中企業の7指標バランスを表示 |
| ランキング棒グラフ | 幸福度または個人マッチ度ランキング |
| 広告 | 企業カード5件ごとにインフィード広告、右カラムには未配置 |

### 2.4 一覧表示ルール

| 項目 | 仕様 |
|---|---|
| デフォルト選択企業 | `happinessScore` が最も高い企業 |
| 一覧の並び順 | 通常は幸福度順。重み設定ありの場合は個人マッチ度順 |
| TOP3強調 | 全企業の幸福度上位3社に枠線表示 |
| 広告挿入 | 表示中リストの5件ごとに1枠挿入 |
| 件数表示 | `filteredCount / totalCount` |

### 2.5 フィルター仕様

| 条件 | 仕様 |
|---|---|
| キーワード | 企業名、説明、業種に対する部分一致。大文字小文字は区別しない |
| スコア下限 | `0 / 40 / 70` |
| リモート率下限 | `0 / 50 / 80` |
| タグ | 上位10件の頻出タグ。複数選択時は AND 条件 |
| リセット | キーワード、閾値、タグを全て初期化 |

### 2.6 パーソナライズ仕様

| 項目 | 仕様 |
|---|---|
| 対象指標 | techStackModernity / remoteRate / estimatedOvertimeHours / turnoverRate / retentionRate / devEnvironment / skillUpSupport |
| 重みの段階 | `0: 気にしない`, `1: 少し重視`, `2: 重視`, `3: 最重視` |
| 永続化 | `localStorage` キー `devmap:userWeights` |
| パーソナル表示判定 | いずれかの重みが0以外なら有効 |

### 2.7 ユーザー操作

| 操作 | 結果 |
|---|---|
| 企業カード本体をクリック | `selectedId` を更新し、右カラムのレーダーチャート対象を切り替える |
| `詳細を見る` をクリック | `/company/:id` に遷移 |
| ランキングバーをクリック | 対応企業の詳細画面へ遷移 |
| スライダー変更 | 個人マッチ度順に再ソート |
| 検索 / 絞り込み | 企業一覧とランキング対象が再計算される |

### 2.8 状態別表示

| 状態 | 表示 |
|---|---|
| Loading | 中央スピナー |
| Error | 赤系メッセージボックスにエラー文字列を表示 |
| Filter結果0件 | 「該当する企業が見つかりません」 + リセット導線 |

### 2.9 SEO

- `Helmet` で title / description / canonical / OGP / Twitter Card を設定
- `JsonLd` で `WebSite` スキーマを出力

---

## 3. CompanyDetail

### 3.1 目的

- 企業単位で幸福度スコアの内訳を確認できる
- 指標ごとの出典状況とデータ信頼度を確認できる
- シェアや関連企業への導線を提供する

### 3.2 使用フック

| フック | 用途 |
|---|---|
| `useCompanyById(id)` | 単一企業、スコア、取得済みソースの読み込み |
| `useCompanyData()` | 関連企業候補の取得 |
| `useAnalytics()` | 詳細画面閲覧、シェア操作のイベント送信 |

### 3.3 データ取得仕様

| 取得元 | 内容 |
|---|---|
| `companies` | 企業基本情報、description、tags など |
| `company_scores` | 7つのスコア指標 |
| `company_scrapes` | `source`, `url`, `scraped_at`。データソース表示に利用 |

`company_scores` が存在しない場合は `null` として扱い、`rowToCompany` 側のデフォルト値に委譲する。

### 3.4 主要表示ブロック

| ブロック | 内容 |
|---|---|
| Breadcrumb | `ホーム > 企業名` |
| Hero | 企業名、業種、勤務地、従業員数、説明文、幸福度バッジ |
| タグ一覧 | 企業タグをチップ表示 |
| ShareButtons / CopyUrlButton | X、Facebook、URLコピー |
| ReliabilityIndicator | 信頼度ラベル、バー、全ソース取得状況 |
| レーダーチャート | 7指標のバランス表示 |
| 各指標の詳細 | 7項目をプログレスバー付きで表示。指標ごとに出典バッジを表示 |
| 広告 | スコア詳細の下に1枠表示 |
| RelatedCompanies | 幸福度スコア差が近い企業を最大4件表示 |
| フィルター導線 | `/#filters` へのリンク文言を表示 |

### 3.5 指標表示仕様

| 指標 | 表示単位 | 補足 |
|---|---|---|
| 技術スタックの新しさ | `/ 10` | 通常指標 |
| リモート率 | `%` | 通常指標 |
| 月間残業時間 | `時間` | 少ないほど良い表示 |
| 離職率 | `%` | 少ないほど良い表示 |
| 定着率 | `%` | 通常指標 |
| 開発環境スコア | `/ 10` | 通常指標 |
| スキルアップ支援 | `/ 10` | 通常指標 |

バー色は正規化後の値で切り替える。

- 70以上: 緑
- 40以上70未満: 黄
- 40未満: 赤

### 3.6 ユーザー操作

| 操作 | 結果 |
|---|---|
| パンくずの `ホーム` | `/` に戻る |
| Xシェア | 新規タブで共有URLを開く。analytics `share` を送信 |
| Facebookシェア | 新規タブで共有URLを開く。analytics `share` を送信 |
| URLをコピー | クリップボードへコピーし、2秒間トースト表示 |
| 関連企業リンク | 対象企業の詳細へ遷移 |

### 3.7 状態別表示

| 状態 | 表示 |
|---|---|
| Loading | スケルトンUI |
| 企業未検出 | `Navigate` で `/` にリダイレクト |
| Error | 一覧に戻るリンク + 赤系エラーボックス |

### 3.8 SEO

- `Helmet` で企業名を含む title / description / canonical / OGP / Twitter Card を設定
- `JsonLd` で `Organization` スキーマを出力

---

## 4. PrivacyPolicy

### 4.1 目的

- 解析ツール、広告、Cookie、オプトアウト方法を説明する

### 4.2 主要表示ブロック

| ブロック | 内容 |
|---|---|
| 戻るリンク | `/` への導線 |
| 本文 | 8セクション構成のポリシー本文 |
| 外部リンク | Google Privacy Policy、Ads Policy、Analytics オプトアウトアドオン |
| 制定日 | 2026年4月7日 |

### 4.3 状態・データ

- 動的データ取得なし
- 画面内の内容は静的

### 4.4 SEO

- `Helmet` で title / description / canonical を設定

---

## 5. 共通UIコンポーネント

| コンポーネント | 用途 |
|---|---|
| `Header` | sticky ナビゲーション。ロゴから `/` へ遷移 |
| `Footer` | 画面下部ナビゲーション。`/` と `/privacy-policy` へのリンク |
| `ScoreBadge` | 幸福度または個人マッチ度の数値表示 |
| `SourceBadge` | 指標に対するデータソース有無の表示 |
| `ReliabilityIndicator` | ソース数と鮮度をもとに信頼度を表示 |
| `RadarChartComponent` | 7指標の相対比較表示 |
| `ComparisonBarChart` | ランキング表示と詳細遷移の入口 |
| `AdUnit` | AdSense 広告枠。失敗しても例外は握りつぶす |

---

## 6. レスポンシブ仕様

| 画面 | 挙動 |
|---|---|
| Home | モバイルでは1カラム。`lg` 以上で一覧2カラム + 右サイドパネル |
| Home 右カラム | `lg` 以上で sticky 表示 |
| CompanyDetail | モバイルでは縦積み。`md` 以上でレーダーと詳細を2カラム化 |
| Footer | モバイルでは縦積み、`md` 以上で横並び |

---

## 7. 実装上の補足

1. `Home` のフィルター導線として詳細画面から `/#filters` へリンクしているが、現状の一覧画面には `id="filters"` は定義されていない
2. `App` は `lazy()` + `Suspense` を採用しており、各ページは初回遷移時に分割読込される
3. `Header` と `Footer` はルート配下ではなく `App` 直下にあるため、全画面共通で表示される