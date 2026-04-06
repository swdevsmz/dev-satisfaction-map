# NFR Requirements - company-filter

## NFR-01: パフォーマンス

| 項目 | 要件 | 根拠 |
|---|---|---|
| フィルタ応答時間 | ユーザー入力から即時（体感遅延なし） | 対象データ72社、ブラウザ上のJSなので十分高速 |
| フィルタ実装方式 | useMemoによるメモ化（O(n)、n≤100想定） | 不必要な再計算を防止 |
| デバウンス | 不要 | 72社規模ではuseMemoで十分 |
| availableTags | companiesが変わるときのみ再計算 | useMemoの依存配列にcompaniesを指定 |

## NFR-02: セキュリティ

| 項目 | 要件 |
|---|---|
| キーワード入力 | React JSX の自動エスケープに委ねる（dangerouslySetInnerHTML禁止） |
| タグ表示 | Companyデータ由来のタグを JSX に展開する（自動エスケープ適用） |
| 依存管理 | package-lock.json をコミット維持（SECURITY-10） |
| エラーハンドリング | 0件時はユーザー向けメッセージのみ表示（内部情報露出なし） |

## NFR-03: アクセシビリティ

| 要素 | 対応 |
|---|---|
| 検索入力フィールド | `type="search"`, `aria-label="企業を検索"` |
| スコアフィルターボタン | `aria-pressed={minScore === value}` |
| リモート率フィルターボタン | `aria-pressed={minRemoteRate === value}` |
| タグバッジボタン | `aria-pressed={selectedTags.includes(tag)}` |
| リセットボタン | `aria-label="フィルターをリセット"` |

## NFR-04: 保守性

| 項目 | 対応 |
|---|---|
| 型安全性 | FilterState / UseCompanyFilterReturn をexport型として定義 |
| 定数集約 | SCORE_THRESHOLDS / REMOTE_RATE_THRESHOLDS を定数として定義 |
| PBTテスト | fast-checkで7つのプロパティをテスト（PBT-01で特定済み） |
| テストランナー | 今回は設定見送り。テストファイルにNode.jsでの実行手順をコメント記載 |

## NFR-05: テスト戦略（PBT）

- **フレームワーク**: fast-check（TypeScript対応、shrinking・seed対応）
- **テスト対象**: `useCompanyFilter` フックのフィルタ純粋関数部分
- **テストランナー**: 未設定（後日 Vitest 導入を推奨）
- **実行方法（暫定）**: `npx tsx src/utils/scoring.test.ts` 等でNode.js直接実行
- **CI統合**: 未設定（後日対応）
- **シード管理**: fast-checkのデフォルトシードログ機能を使用

## Extension Compliance Summary

### Security Baseline
| Rule | Status | Rationale |
|---|---|---|
| SECURITY-01〜04 | N/A | 新規データストア・ネットワーク機器・サーバーコンポーネントなし |
| SECURITY-05 | Compliant | React JSX自動エスケープ、dangerouslySetInnerHTML禁止を要件化 |
| SECURITY-06〜09 | N/A | IAM・ネットワーク・本番設定変更なし |
| SECURITY-10 | Compliant | package-lock.json 維持 |
| SECURITY-11〜14 | N/A | 認証・決済・CDNリソース・ロギング変更なし |
| SECURITY-15 | Compliant | 0件時の明示的ハンドリング（FR-06） |

### Property-Based Testing
| Rule | Status | Rationale |
|---|---|---|
| PBT-09 | Compliant | fast-check選定・文書化完了 |
| PBT-01〜08, PBT-10 | Deferred | Code Generation ステージで実装 |
