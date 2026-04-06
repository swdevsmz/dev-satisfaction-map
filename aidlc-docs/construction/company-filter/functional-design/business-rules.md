# Business Rules - company-filter

## BR-01: キーワード検索
- 検索対象フィールド: `name`, `description`, `industry`
- マッチング: 部分一致（contains）、大文字小文字を区別しない
- `tags` フィールドは検索対象外（タグフィルターで別途対応）
- キーワードが空文字の場合、このフィルターは無効（全件通過）

## BR-02: スコアフィルタ閾値
| ボタンラベル | 条件 |
|---|---|
| 全て | minScore = 0（無効） |
| 40以上 | happinessScore >= 40（yellowゾーン以上） |
| 70以上 | happinessScore >= 70（greenゾーン） |

スコア色分けとの対応:
- `happinessScore >= 70` → green（最高評価）
- `happinessScore >= 40` → yellow（中評価）
- `happinessScore < 40` → red（低評価）

## BR-03: リモート率フィルタ閾値
| ボタンラベル | 条件 |
|---|---|
| 全て | minRemoteRate = 0（無効） |
| 50%以上 | scores.remoteRate >= 50 |
| 80%以上 | scores.remoteRate >= 80（フルリモート近い） |

## BR-04: タグフィルタ
- 複数タグ選択時は AND 条件（全タグに一致する企業のみ）
- タグの大文字小文字は完全一致（Companyデータの表記に依存）
- 選択なしの場合、このフィルターは無効（全件通過）

## BR-05: 表示タグ選択
- 全企業のタグ出現頻度を集計し、上位10件を表示
- 企業データが変わるたびに再計算（useMemo）
- タイブレーク（同頻度）は配列の出現順を維持

## BR-06: フィルター組み合わせ
- 全条件はAND結合（全ての有効なフィルターを同時に満たす企業のみ）
- 有効なフィルター = 0/空でない値が設定されているもの

## BR-07: 状態管理
- フィルター状態はコンポーネントの局所状態（useState）で管理
- localStorage への保存なし（リロードでリセット）
- リセット操作で全フィルターを初期値（空/0）に戻す

## BR-08: 0件時の動作
- フィルター結果が0件の場合:
  - 「該当する企業が見つかりません」メッセージを表示
  - リセットボタンを合わせて表示
  - ComparisonBarChart は空のデータで描画（または非表示）
  - RadarChartComponent は selectedId を null にリセット

## BR-09: セキュリティ (SECURITY-05)
- キーワード入力は React JSX の自動エスケープに委ねる
- `dangerouslySetInnerHTML` を使用してはならない
- 入力値を DOM に直接挿入する処理を禁止
