# Requirements Document - 企業絞り込み機能

## Intent Analysis

- **User Request**: 企業の絞り込み機能がほしいな
- **Request Type**: New Feature
- **Scope**: Multiple Components（新規フック + 新規UIコンポーネント + Home.tsx修正）
- **Complexity**: Simple to Moderate
- **Depth Level**: Standard

---

## Functional Requirements

### FR-01: キーワード検索
- 企業名・説明文・業種（industry）を対象にテキスト検索できる
- 大文字・小文字を区別しない
- 入力するたびに即時フィルタリング（リアルタイム）

### FR-02: 幸福度スコアフィルタ
- 幸福度スコアの最低値でフィルタリングできる
- クイックボタン形式で選択（例: 全て / 40以上 / 70以上）

### FR-03: リモート率フィルタ
- リモート率の最低値でフィルタリングできる
- クイックボタン形式で選択（例: 全て / 50%以上 / 80%以上）

### FR-04: タグフィルタ
- 企業に付与されているタグから複数選択してフィルタリングできる
- 複数選択時はAND条件（全タグに一致する企業のみ表示）
- 表示するタグは全企業の出現頻度上位から選出

### FR-05: フィルターUI配置
- 企業カード一覧の上部に横長バー形式で配置する
- PersonalWeightPanelの下・企業カード一覧の上に位置する

### FR-06: 0件時の表示
- フィルター条件に合う企業が0件の場合、「該当する企業が見つかりません」メッセージを表示する
- フィルターリセットボタンも合わせて表示する

### FR-07: フィルター状態の初期化
- フィルター状態はページリロード時にリセットされる（localStorage永続化なし）
- フィルターが活性な場合、リセットボタンを表示する

### FR-08: チャートへの反映
- 右側のランキング棒グラフ・レーダーチャートは絞り込み後の企業を対象とする
- 0件の場合はチャートも空になる

---

## Non-Functional Requirements

### NFR-01: パフォーマンス
- 72社規模（将来的にも100社程度を想定）ではリアルタイムフィルタで十分
- `useMemo` で絞り込み結果をメモ化し不要な再計算を防ぐ

### NFR-02: セキュリティ (SECURITY-05関連)
- キーワード検索の入力は React JSX のエスケープ機構に委ねる（innerHTML等の直接操作禁止）
- 入力値を直接 `dangerouslySetInnerHTML` に渡してはならない

### NFR-03: アクセシビリティ
- 検索入力フィールドに `aria-label` を付与する
- タグボタンにはアクティブ状態を `aria-pressed` で表現する

### NFR-04: UX
- フィルターが活性な場合、アクティブなフィルター数をバッジで表示する
- 各フィルター条件が独立して操作できる

---

## Implementation Scope

### 新規作成ファイル
- `src/hooks/useCompanyFilter.ts` — フィルタリングロジック（既に仮作成済み・要最終化）
- `src/components/filter/CompanyFilterBar.tsx` — フィルターUIコンポーネント

### 修正ファイル
- `src/pages/Home.tsx` — useCompanyFilter を統合、CompanyFilterBar を追加、チャートへ絞り込み結果を渡す

---

## Out of Scope
- 業種（industry）フィルタ（標準セットには含めない）
- フィルター状態の localStorage 永続化
- フィルター条件のOR指定

---

## Extension Compliance Summary (Requirements Stage)

### Security Baseline
| Rule | Status | Rationale |
|---|---|---|
| SECURITY-01 | N/A | 新規データストアなし |
| SECURITY-02 | N/A | 新規ネットワーク仲介なし |
| SECURITY-03 | N/A | サーバーサイドコンポーネントなし |
| SECURITY-04 | N/A | HTTPヘッダー設定はこの機能スコープ外 |
| SECURITY-05 | Compliant | NFR-02でReact JSXエスケープを要件化 |
| SECURITY-06 | N/A | IAM変更なし |
| SECURITY-07 | N/A | ネットワーク設定変更なし |
| SECURITY-08 | N/A | 認証エンドポイント変更なし |
| SECURITY-09 | N/A | 本番設定変更なし |
| SECURITY-10 | Compliant | package-lock.json 既存・コミット済み |
| SECURITY-11 | N/A | 認証・決済ロジックなし |
| SECURITY-12 | N/A | 認証変更なし |
| SECURITY-13 | N/A | 外部CDNリソース追加なし |
| SECURITY-14 | N/A | ロギング基盤変更なし |
| SECURITY-15 | Compliant | 0件時の明示的ハンドリングをFR-06で要件化 |

### Property-Based Testing
| Rule | Status | Rationale |
|---|---|---|
| PBT-01 | Deferred | Functional Design ステージで特定する |
| PBT-02〜PBT-10 | Deferred | Code Generation ステージで適用する |
