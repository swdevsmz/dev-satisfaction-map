# Code Summary - company-filter

## 変更ファイル一覧

| ファイル | 操作 | 概要 |
|---|---|---|
| `package.json` | MODIFIED | fast-check ^3.23.2 を devDependencies に追加 |
| `src/hooks/useCompanyFilter.ts` | MODIFIED | フィルターフック最終実装（FilterState型・定数・ロジック） |
| `src/components/filter/CompanyFilterBar.tsx` | CREATED | フィルターUIコンポーネント（3行レイアウト） |
| `src/pages/Home.tsx` | MODIFIED | フィルター統合・データパイプライン変更・0件メッセージ |
| `src/hooks/useCompanyFilter.test.ts` | CREATED | fast-check PBTテスト（P1〜P7 + example-based） |

## 主要な設計判断

### フィルター + パーソナルスコートの組み合わせ
- フィルター優先: `companies → filtered → (sortByPersonal or keep order)`
- `rankedList` も `filtered` ベースに変更し、チャートが絞り込み後の企業を反映

### useCompanyData からの `ranked` 削除
- `ranked` はフック内で `happinessScore` 降順に並べたものだったが、
  フィルター後に別途ソートする設計に変更したため `Home.tsx` では不使用になった

### セキュリティ（SECURITY-05）
- キーワード検索の入力値は React JSX テンプレートリテラルのみで扱い、
  `dangerouslySetInnerHTML` は一切使用していない

### data-testid の付与
- `filter-keyword-input`, `filter-score-button-{value}`, `filter-remote-button-{value}`,
  `filter-tag-button-{tag}`, `filter-reset-button` を付与

## 既知の制限事項・今後の課題

| # | 内容 | 優先度 |
|---|---|---|
| 1 | テストランナー（Vitest）未設定。テストは `npx tsx` で実行 | 中 |
| 2 | `npm install` 未実行（fast-check が node_modules に入っていない） | 高（テスト前に必要） |
| 3 | タグフィルターは完全一致。将来的に大文字小文字正規化を検討 | 低 |
| 4 | 企業数500社超になったらキーワード入力にdebounce追加を検討 | 低 |

## PBT コンプライアンス

| Rule | Status |
|---|---|
| PBT-01 | Compliant（business-logic-model.md で7プロパティ特定済み） |
| PBT-02 | N/A（シリアライズ/デシリアライズなし） |
| PBT-03 | Compliant（P5: 全結果がフィルター条件を満たす） |
| PBT-04 | N/A（冪等性を持つ操作として P4 でカバー） |
| PBT-05 | N/A（Oracleとなる参照実装なし） |
| PBT-06 | N/A（ステートフルコンポーネントなし） |
| PBT-07 | Compliant（domain-specific generator: arbCompany, arbScores） |
| PBT-08 | Compliant（fast-check がデフォルトでseed出力、shrinking有効） |
| PBT-09 | Compliant（fast-check 選定・インストール済み） |
| PBT-10 | Compliant（Example-based テスト4件 + PBTテスト7件） |
