# Code Generation Plan - company-filter

## Unit Context
- **Unit**: company-filter
- **Project Type**: Brownfield（既存コードベースへの追加）
- **Workspace Root**: c:/Users/swdev/Desktop/dev-satisfaction-map
- **Design Sources**:
  - functional-design/business-logic-model.md
  - functional-design/business-rules.md
  - functional-design/domain-entities.md
  - functional-design/frontend-components.md
  - nfr-requirements/nfr-requirements.md
  - nfr-requirements/tech-stack-decisions.md

## File Change Summary

| ファイル | 操作 | 内容 |
|---|---|---|
| `package.json` | MODIFY | fast-check を devDependencies に追加 |
| `src/hooks/useCompanyFilter.ts` | MODIFY（再実装） | 仮作成ファイルを最終設計に沿って書き直し |
| `src/components/filter/CompanyFilterBar.tsx` | CREATE | フィルターUIコンポーネント |
| `src/pages/Home.tsx` | MODIFY | フィルターフック統合・データパイプライン変更 |
| `src/hooks/useCompanyFilter.test.ts` | CREATE | fast-check PBTテスト（P1〜P7） |
| `aidlc-docs/construction/company-filter/code/code-summary.md` | CREATE | 実装サマリー文書 |

---

## Step 1: fast-check 依存関係追加
- [x] `package.json` の devDependencies に `"fast-check": "latest"` を追加
- [x] Brownfield確認: ファイル存在確認→インプレース修正（コピー作成禁止）

## Step 2: useCompanyFilter.ts 実装
- [x] `src/hooks/useCompanyFilter.ts` を最終設計に基づいて書き直し
- [ ] FilterState インターフェース定義
- [ ] SCORE_THRESHOLDS / REMOTE_RATE_THRESHOLDS 定数定義
- [ ] useCompanyFilter フック実装:
  - keyword / minScore / minRemoteRate / selectedTags の useState
  - availableTags（上位10件）の useMemo
  - filtered の useMemo（BR-01〜06 のアルゴリズム）
  - activeCount / isFiltered の算出
  - toggleTag / reset 関数
  - UseCompanyFilterReturn 型の export
- [ ] セキュリティ: dangerouslySetInnerHTML 不使用確認（SECURITY-05）
- [ ] data-testid は不要（フックのみ、UI要素なし）

## Step 3: CompanyFilterBar.tsx 実装
- [x] `src/components/filter/CompanyFilterBar.tsx` を新規作成
- [ ] CompanyFilterBarProps インターフェース定義
- [ ] レイアウト実装（3行構成）:
  - 上段: 検索入力（type="search", aria-label）+ 件数バッジ + リセットボタン
  - 中段: スコアボタン群 + リモート率ボタン群（aria-pressed）
  - 下段: タグバッジ（上位10件、aria-pressed）
- [ ] isFiltered が false の場合リセットボタン非表示
- [ ] availableTags が空の場合タグ行非表示
- [ ] data-testid 付与:
  - `data-testid="filter-keyword-input"`
  - `data-testid="filter-score-button-{value}"`
  - `data-testid="filter-remote-button-{value}"`
  - `data-testid="filter-tag-button-{tag}"`
  - `data-testid="filter-reset-button"`

## Step 4: Home.tsx 修正
- [x] `src/pages/Home.tsx` をインプレース修正（コピー作成禁止）
- [ ] useCompanyFilter インポート追加
- [ ] CompanyFilterBar インポート追加
- [ ] useCompanyFilter(companies) 呼び出し追加
- [ ] displayList / rankedList の算出ロジック変更:
  - Before: `isPersonalized ? sortByPersonal(companies) : companies`
  - After: `isPersonalized ? sortByPersonal(filtered) : filtered`
  - rankedList も `filtered` ベースに変更
- [ ] PersonalWeightPanel 直下に CompanyFilterBar を追加
- [ ] 0件時（filtered.length === 0 && isFiltered）の EmptyMessage 表示
- [ ] 企業一覧の件数表示（X件/Y件）

## Step 5: useCompanyFilter.test.ts 作成（PBTテスト）
- [x] `src/hooks/useCompanyFilter.test.ts` を新規作成
- [ ] fast-check import
- [ ] テスト用モックデータ（Company[]）生成ヘルパー
- [ ] PBT-02〜PBT-07: 7つのプロパティテスト実装:
  - P1: 結果が入力の部分集合（Invariant）
  - P2: 空フィルターで全件返却（Invariant）
  - P3: フィルター強化で件数単調減少（Invariant）
  - P4: 冪等性（Idempotence）
  - P5: 全結果がフィルター条件を満たす（Invariant）
  - P6: availableTags が最大10件（Invariant）
  - P7: availableTags の各タグが最低1社保有（Invariant）
- [ ] 各テストに実行方法コメントを記載（PBT-08: seed ログ説明）
- [ ] example-based テストも1件ずつ追加（PBT-10）

## Step 6: コードサマリー文書作成
- [x] `aidlc-docs/construction/company-filter/code/code-summary.md` を新規作成
- [ ] 変更ファイル一覧と概要
- [ ] 主要な設計判断の記録
- [ ] 既知の制限事項（テストランナー未設定等）

---

## Dependencies
- useCompanyData フック（変更なし、companies: Company[] を提供）
- usePersonalWeights フック（変更なし、sortByPersonal を提供）
- Company / CompanyScores 型（変更なし）

## Security Compliance Checkpoints
- Step 2, 3: dangerouslySetInnerHTML 不使用確認（SECURITY-05）
- Step 1: package-lock.json 更新後にコミット対象（SECURITY-10）

## PBT Compliance Checkpoints
- Step 5: PBT-01〜PBT-08 / PBT-10 実装
- Step 1: fast-check パッケージ追加（PBT-09）
