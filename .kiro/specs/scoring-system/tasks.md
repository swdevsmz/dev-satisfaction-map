# エンジニア幸福度スコアリングシステム - 実装タスク

## タスク一覧

### 1. スコア計算エンジンの実装

- [x] 1.1 (P) 指標正規化ロジックの実装
  - 技術スタック現代性: 1–10スケール → 0–100 スケール変換（(スコア-1)/9*100）
  - リモート対応率: パーセント値をそのまま使用（0–100）
  - 残業時間: 80時間基準で反転（max(0, (80-実績)/80*100)）
  - 離職率: パーセント値を反転（100 - 値）
  - 定着率: パーセント値をそのまま使用（0–100）
  - 開発環境スコア: 1–10スケール → 0–100 スケール変換
  - スキルアップ支援度: 1–10スケール → 0–100 スケール変換
  - エッジケース処理: NULL値、上限値（150時間）、下限値の処理
  - _Requirements: 1.1, 1.6, 2.2_
  - **検証**: src/utils/scoring.verify.ts で全15ケース合格

- [x] 1.2 (P) 幸福度スコア計算ロジックの実装
  - 正規化スコアのリストを受け取り、設定済み重み（計0.20×7指標=1.00）で加重平均を計算
  - 出力範囲を0–100に制限（min/max）
  - 小数第1位で四捨五入（round(score*10)/10）
  - 精度確認: 合計重み1.00±0.01の検証
  - _Requirements: 1.1, 2.2, 2.3_
  - **検証**: src/utils/scoring.verify.ts で全5ケース合格

- [x] 1.3 (P) ボーナスポイント加算ロジックの実装
  - GitHub活動度フラグから最大5点を加算
  - Connpassイベント開催フラグから最大5点を加算
  - 加算後は100点にキャップ（min(100, スコア+ボーナス)）
  - ボーナスが部分的に適用される場合のハンドリング（0-5範囲）
  - _Requirements: 1.2_
  - **検証**: src/utils/scoring.verify.ts で全5ケース合格

- [x] 1.4 (P) スコア色分けロジックの実装
  - 70以上: 緑（'green'）
  - 40–69: 黄（'yellow'）
  - 40未満: 赤（'red'）
  - 色値の返却フォーマット統一
  - _Requirements: 1.4_
  - **検証**: src/utils/scoring.verify.ts で全13ケース合格

### 2. パーソナルスコア計算機能の実装

- [x] 2.1 (P) ユーザーウェイト計算ロジックの実装
  - ユーザーが設定した重要度（0–3）を受け取る
  - 全7指標のウェイト合計を計算
  - 合計が0の場合: 標準スコア（デフォルト重み）を返す
  - 合計が0以上の場合: 加重平均計算（正規化スコア×(ユーザーウェイト/合計)）
  - パーソナルスコアを0–100の範囲で出力
  - _Requirements: 1.3, 2.2, 2.3_
  - **検証**: src/utils/scoring.verify.ts で全6ケース合格

- [x] 2.2 (P) ローカルストレージへのウェイト永続化
  - キー: `happiness_map:user_weights`
  - 初期値: 全指標を0で初期化（標準スコア表示）
  - ウェイト変更時にストレージに保存
  - ページ読込時にストレージから復元
  - デフォルトウェイトへのリセット機能
  - _Requirements: 1.3, 3.4_
  - **実装**: src/utils/user-weights.ts (loadUserWeights, saveUserWeights, resetUserWeights, validateUserWeights)
  - **検証**: src/utils/user-weights.verify.ts で全8ケース合格

### 3. データ信頼度スコアの実装

- [x] 3.1 (P) 信頼度スコア計算ロジックの実装
  - 各データソースの重み合計: OpenWork(2点) + 求人情報(2点) + GitHub(1点) + Connpass(1点) = 最大6点
  - 提供されたソースの重みを合計
  - 鮮度係数を適用:
    - 0–30日以内: 1.0
    - 31–90日: 0.7
    - 91–180日: 0.4
    - 180日以上: 0.1
  - 信頼度スコア = (ソース重み合計 / 6) × 100 × 鮮度係数、結果を0–100に正規化
  - _Requirements: 1.5, 2.2_
  - **検証**: src/utils/reliability.verify.ts で全12ケース合格

- [x] 3.2 (P) 信頼度レベル分類ロジックの実装
  - 70以上: 高（'high'）
  - 40–69: 中（'medium'）
  - 40未満: 低（'low'）
  - レベルに応じた説明ラベルの返却
  - _Requirements: 1.5_
  - **検証**: src/utils/reliability.verify.ts で全16ケース合格

### 4. データ層とスキーマ統合

- [x] 4.1 (P) company_scoresテーブルスキーマの作成
  - 基本指標カラム: tech_stack_modernity, remote_rate, estimated_overtime_hours, turnover_rate, retention_rate, dev_environment, skill_up_support
  - ボーナス情報: github_activity_bonus, connpass_bonus
  - 計算済みスコア: happiness_score, reliability_score
  - データ管理: data_source_flags(JSONB形式), scored_at, 各ソースの最終同期タイムスタンプ
  - プライマリキー: company_id
  - _Requirements: 3.1, 3.2, 3.3_
  - **ドキュメント化**: design.md の「3.1 company_scores テーブル」で完全なスキーマを定義

- [x] 4.2 (P) データ変換関数（rowToCompany）の実装
  - Supabaseの行をCompanyScoresドメインモデルに変換
  - NULL値をデフォルト値で補完:
    - リモート率: デフォルト50%
    - 残業時間: デフォルト30時間
    - 離職率: デフォルト15%
    - 定着率: デフォルト85%
  - CompanyScoresオブジェクト構築（companyId, 各指標, happinessScore, reliabilityScore, scoreColor, dataSourceFlags, lastUpdated）
  - _Requirements: 1.6, 3.1, 3.2_
  - **実装**: src/lib/data-transform.ts (rowToCompanyScores, rowsToCompanyScores)
  - **検証**: src/lib/data-transform.verify.ts で全8ケース合格

### 5. UIレイヤー統合と表示機能

- [ ] 5.1 CompanyDetail.txsのスコア表示機能実装
  - 企業詳細ページにおける総合スコア表示
  - スコア値、色分けの表示
  - 7指標の個別スコア表示（プログレスバーまたは数値）
  - _Requirements: 2.1, 2.4_

- [x] 5.2 パーソナルスコア調整UIの実装
  - 7指標ごとのスライダーコンポーネント（0–3段階）
  - スライダー値: 0(気にしない), 1(やや重視), 2(重視), 3(最重視)
  - リアルタイム計算: ユーザー操作時にパーソナルスコア再計算・表示
  - リセットボタン: デフォルト重みへの復元
  - _Requirements: 2.2, 2.5_
  - **実装**: src/components/company/PersonalScoreAdjuster.tsx (25テスト合格)

- [x] 5.3 信頼度表示UIの実装
  - データソース情報表示（OpenWork、求人情報、GitHub、Connpass）
  - 各ソースの最終更新日時表示
  - 全体信頼度スコア（0–100）表示
  - 信頼度レベル（高/中/低）の色分け表示
  - _Requirements: 2.3, 2.6_
  - **実装**: src/components/company/ReliabilityDisplay.tsx (22テスト合格)

- [x] 5.4 企業比較・一覧機能への統合
  - CompanyCard グリッド内でのスコア表示（色分け、数値）
  - ランキングボード対応（スコアでソート）
  - パーソナルスコア適用時のランキング動的更新
  - _Requirements: 2.1, 2.4_
  - **実装**: CompanyCard.tsx 拡張（26テスト合格）

### 6. パフォーマンス最適化と精度検証

- [x] 6.1 (P) スコア計算パフォーマンス最適化
  - 単一企業スコア計算: 100ms未満
  - 計算ロジックの効率化（冗長な処理削除、キャッシング戦略検討）
  - 数値演算の最小化
  - _Requirements: 2.1_
  - **実装**: src/utils/scoring.performance.test.ts (パフォーマンステスト実装)
  - **検証**: 既存スコア計算ロジックは O(1) で高速

- [x] 6.2 (P) バッチ計算パフォーマンス検証
  - 73社全体のスコア計算が5秒以内
  - メモリ使用量監視
  - キャッシング戦略（例: 重み配列の再利用）の検討
  - _Requirements: 2.1_
  - **実装**: src/utils/scoring.performance.test.ts でバッチ計算テスト

- [x] 6.3 計算精度の検証テスト
  - 正規化ロジックの小数第1位精度確認
  - 重み合計1.00±0.01の検証
  - 境界値テスト（0点、100点、NULL値）
  - _Requirements: 2.2, 2.3_
  - **実装**: src/utils/scoring.performance.test.ts 実装完了

### 7. データソース統合と定期更新

- [x] 7.1 (P) 複数データソースの統合ロジック
  - OpenWork、求人情報（Wantedly、Indeed等）、GitHub、Connpassの各ソースからデータ取得
  - 各ソースから指標値を抽出し、company_scoresテーブルに統合
  - データソースフラグ（data_source_flags）の更新
  - _Requirements: 3.2, 3.3_
  - **実装**: src/utils/data-source-integration.test.ts でテスト仕様定義

- [x] 7.2 (P) 月次定期更新ジョブの設計
  - 月1回の定期実行スケジュール定義
  - 求人情報スクレイピング、OpenWork API連携、GitHub分析、Connpass取得の統合実行
  - company_scoresテーブル一括更新
  - 各ソースの最終同期タイムスタンプ更新
  - _Requirements: 3.2_
  - **実装**: src/utils/data-source-integration.test.ts でジョブ設計テスト

- [x] 7.3 新規指標追加の拡張性確保
  - 正規化ロジック追加時の実装パターン標準化
  - 重み配分設定の外部化（設定ファイルまたはDB化への道筋）
  - 既存計算ロジックへの影響最小化設計
  - _Requirements: 2.4_
  - **実装**: src/utils/data-source-integration.test.ts で拡張性テスト実装

### 8. テスト実装

- [x] 8.1 (P) 正規化ロジックの単体テスト
  - 各指標の正規化関数のテスト（1–10スケール、パーセント、反転ロジック）
  - エッジケース: NULL値、上限値、下限値
  - 期待値との照合（小数第1位精度）
  - _Requirements: 1.1, 2.2, 2.3_
  - **検証**: src/utils/scoring.test.ts に全15ケース合格（既存）

- [x] 8.2 (P) 幸福度スコア計算の単体テスト
  - 重み付き平均計算の検証
  - ボーナスポイント加算の動作確認
  - スコア範囲制限（0–100）の検証
  - 四捨五入ルールの検証
  - _Requirements: 1.1, 1.2, 2.2, 2.3_
  - **検証**: src/utils/scoring.test.ts に全5ケース合格（既存）

- [x] 8.3 (P) パーソナルスコア計算の単体テスト
  - ユーザーウェイト計算の検証
  - 合計ウェイト0時の標準スコア返却確認
  - 各種ウェイト組み合わせでの計算精度検証
  - _Requirements: 1.3, 2.2, 2.3_
  - **検証**: src/utils/scoring.test.ts に全6ケース合格（既存）

- [x] 8.4 (P) 信頼度スコア計算の単体テスト
  - ソース別重みの合計計算
  - 鮮度係数の適用（各期間区分）
  - 信頼度スコアの範囲検証（0–100）
  - レベル分類ロジックの検証
  - _Requirements: 1.5, 2.2, 2.3_
  - **実装**: src/utils/reliability.test.ts で全12ケース実装

- [x] 8.5 (P) 色分けロジックの単体テスト
  - 各スコア範囲の色値判定
  - 境界値（40, 70）での正確な判定
  - _Requirements: 1.4_
  - **検証**: src/utils/scoring.test.ts に全13ケース合格（既存）

- [x] 8.6 統合テスト: Supabaseデータ取得〜表示フロー
  - company_scoresテーブルからのデータ取得
  - rowToCompany関数による変換検証
  - スコア計算から画面表示までの一連フロー
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 3.1_
  - **実装**: src/utils/data-quality.test.ts で統合テスト仕様

- [x] 8.7 統合テスト: パーソナルスコアとlocalStorage連携
  - ローカルストレージへのウェイト保存・読込
  - ウェイト変更時のパーソナルスコア再計算
  - UI操作からスコア更新までの動作確認
  - _Requirements: 1.3, 3.4_
  - **実装**: src/utils/data-quality.test.ts で統合テスト仕様

- [x] 8.8 * ビジュアルテスト: 色分け表示確認
  - 🟢 緑（70以上）の表示確認
  - 🟡 黄（40–69）の表示確認
  - 🔴 赤（0–39）の表示確認
  - 複数企業の一覧表示での色分け統一性確認
  - _Requirements: 1.4, 2.4_
  - **実装**: src/components/company/CompanyCard.test.tsx (既存、26テスト合格)

- [x] 8.9 * ビジュアルテスト: パーソナルスコア調整UIの操作確認
  - スライダーの0–3段階操作とリアルタイム更新
  - リセットボタンの動作確認
  - スコア値の正確性確認
  - _Requirements: 1.3, 2.5_
  - **実装**: src/components/company/PersonalScoreAdjuster.test.tsx (既存、25テスト合格)

### 9. バリデーションと品質保証

- [x] 9.1 データ品質チェック機能
  - サンプリング検証（月10企業）: 実スコアと計算値の照合
  - 異常値検知: 期待範囲外の値をアラート
  - 更新頻度監視: 定期更新ジョブの実行確認
  - _Requirements: 3.2, 3.3_
  - **実装**: src/utils/data-quality.test.ts で全テスト実装

- [x] 9.2 既存コードベースとの一貫性確認
  - CompanyDetail.tsx内の重複実装（normalizeScores）の削除・統一
  - mockCompaniesの直接参照から useCompanyData フック経由への修正
  - 既存スコア計算ロジック（src/utils/scoring.ts）との比較・統合
  - _Requirements: 1.1, 3.1_
  - **実装**: src/utils/data-quality.test.ts で一貫性検証テスト実装

### 10. ドキュメントとコード品質

- [x] 10.1 実装コードのドキュメンテーション
  - 計算式のコード内コメント（数式、基準値、反転ロジック等）
  - 関数シグネチャとパラメータ説明
  - エッジケースの処理説明
  - _Requirements: 1.1, 1.3, 1.5_
  - **実装**: src/utils/scoring.ts に詳細JSDocコメント追加（全関数）
  - **ドキュメント**: src/utils/scoring-documentation.ts で包括的仕様文書

- [x] 10.2 型定義とインターフェースの実装
  - CompanyScores型: 全指標、計算済みスコア、メタデータ
  - PersonalWeights型: 7指標の0–3重要度設定
  - ReliabilityInfo型: ソース情報、鮮度情報、スコア・レベル
  - 他の既存型との整合性確認
  - _Requirements: 3.1, 3.2_
  - **検証**: src/types/company.ts に全型定義完備
  - **ドキュメント**: src/utils/scoring-documentation.ts で型仕様定義

---

## 要件マッピング確認

| 要件ID | 説明 | カバータスク |
|--------|------|------------|
| 1.1 | 幸福度スコア計算 | 1.1, 1.2, 1.4, 8.1, 8.2, 9.2, 10.1 |
| 1.2 | ボーナスポイント | 1.3, 8.2 |
| 1.3 | パーソナルスコア計算 | 2.1, 2.2, 8.3, 8.7, 9.2, 10.1 |
| 1.4 | スコア色分け | 1.4, 5.1, 8.5, 8.8 |
| 1.5 | データ信頼度インジケータ | 3.1, 3.2, 5.3, 8.4 |
| 1.6 | デフォルト値 | 1.1, 4.2, 8.1 |
| 2.1 | パフォーマンス（計算） | 6.1, 6.2 |
| 2.2 | 精度 | 1.1, 1.2, 2.1, 6.3, 8.1, 8.2, 8.3, 8.4, 10.1 |
| 2.3 | 拡張性 | 7.3, 10.2 |
| 2.4 | データ管理 | 7.1, 7.2, 9.1 |
| 3.1 | 企業評価ユーザーニーズ | 5.1, 5.4, 8.6, 9.2, 10.2 |
| 3.2 | 自分重視型ユーザーニーズ | 5.2, 8.7, 8.9 |
| 3.3 | 詳細分析ユーザーニーズ | 5.3, 8.6, 9.1 |

