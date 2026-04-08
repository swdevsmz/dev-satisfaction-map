# エンジニア幸福度スコアリングシステム - 技術設計

## 1. システムアーキテクチャ

### 1.1 全体構成

```
UI層 (React/TypeScript)
  ├─ CompanyDetail.tsx (企業詳細ページ)
  └─ スコア表示・パーソナルスコア調整

ロジック層
  ├─ src/utils/scoring.ts (スコア計算)
  └─ src/utils/personal-scoring.ts (パーソナルスコア計算)

データ層
  ├─ src/lib/supabase.ts (データ取得・変換)
  └─ company_scores テーブル (Supabase)
```

## 2. モジュール設計

### 2.1 スコア計算モジュール (scoring.ts)

**責務**: 企業の生データから幸福度スコアへの変換

**主要関数**:

#### normalizeScores(rawScores)
- **入力**: CompanyScoresオブジェクト
- **処理**: 各指標を0-100に正規化
- **出力**: 正規化スコアのオブジェクト

**正規化ロジック**:
```typescript
// 1-10スケール → 0-100
normalize1To10 = (score: number) => ((score - 1) / 9) * 100

// 反転スコア
normalizeReverse = (actual: number, baseline: number) => 
  Math.max(0, ((baseline - actual) / baseline) * 100)

// パーセント
normalizePercent = (pct: number) => pct
```

#### calculateHappinessScore(normalizedScores, weights?)
- **入力**: 正規化スコア、オプショナル重み
- **処理**: 重み付き平均計算
- **出力**: 幸福度スコア(0-100)

**計算式**:
```typescript
score = Σ(normalizedScores[indicator] * weights[indicator])
final = Math.round(Math.min(100, Math.max(0, score)) * 10) / 10
```

#### applyBonusPoints(baseScore, bonuses)
- **入力**: 基本スコア、ボーナス情報
- **処理**: GitHub/Connpassポイントを加算
- **出力**: 最終スコア(≤100)

#### getScoreColor(score)
- **入力**: スコア
- **出力**: 'green' | 'yellow' | 'red'

### 2.2 パーソナルスコア計算モジュール (personal-scoring.ts)

**責備**: ユーザーカスタマイズスコアの計算

**主要関数**:

#### calculatePersonalScore(normalizedScores, userWeights)
- **入力**: 正規化スコア、ユーザーの重要度設定(0-3)
- **処理**: 
  1. ウェイト合計を計算
  2. 合計0の場合は標準スコアを返す
  3. そうでなければ加重平均を計算
- **出力**: パーソナルスコア(0-100)

```typescript
totalWeight = Σ(userWeights)
if (totalWeight === 0) return calculateHappinessScore(...)
personalScore = Σ(normalizedScores[i] * (userWeights[i] / totalWeight))
```

### 2.3 データ信頼度モジュール (reliability.ts)

**責務**: データ信頼度スコアの計算

**主要関数**:

#### calculateReliabilityScore(dataSources, lastUpdated)
- **入力**: データソース配列、最終更新日時
- **処理**:
  1. 各ソースの重みを合計
  2. 鮮度係数を適用
  3. スコア化(0-100)
- **出力**: 信頼度スコア

**ソース別重み**:
```
OpenWork: 2点
求人情報: 2点
GitHub: 1点
Connpass: 1点
最大値: 4点
```

**鮮度係数** (データ取得日からの経過日数):
```
0–30日: 1.0
31–90日: 0.7
91–180日: 0.4
180日以上: 0.1
```

#### getReliabilityLevel(score)
- **出力**: { level: 'high' | 'medium' | 'low', label: string }

### 2.4 データ変換モジュール (lib/supabase.ts)

**責務**: DB行をドメインモデルに変換

**主要関数**:

#### rowToCompany(row)
- **入力**: company_scores テーブルの行
- **処理**:
  1. NULL値をデフォルト値で補完
  2. スコア計算関数を呼び出し
  3. CompanyScoresオブジェクトを構築
- **出力**: CompanyScoresオブジェクト

```typescript
interface CompanyScores {
  companyId: string
  techStackModernity: number      // 1-10
  remoteRate: number              // 0-100
  estimatedOvertimeHours: number  // 0-80+
  turnoverRate: number            // 0-100
  retentionRate: number           // 0-100
  devEnvironment: number          // 1-10
  skillUpSupport: number          // 1-10
  happinessScore: number          // 0-100
  reliabilityScore: number        // 0-100
  scoreColor: 'green' | 'yellow' | 'red'
  dataSourceFlags: {
    openwork: boolean
    jobPosting: boolean
    github: boolean
    connpass: boolean
  }
  lastUpdated: Date
}
```

## 3. データスキーマ

### 3.1 company_scores テーブル

```sql
CREATE TABLE company_scores (
  company_id TEXT PRIMARY KEY,
  
  -- 基本指標
  tech_stack_modernity NUMERIC(3,1),         -- 1.0–10.0
  remote_rate NUMERIC(3,0),                  -- 0–100
  estimated_overtime_hours NUMERIC(4,0),    -- 0–150+
  turnover_rate NUMERIC(3,0),                -- 0–100
  retention_rate NUMERIC(3,0),               -- 0–100
  dev_environment NUMERIC(3,1),              -- 1.0–10.0
  skill_up_support NUMERIC(3,1),             -- 1.0–10.0
  
  -- ボーナス情報
  github_activity_bonus NUMERIC(2,0),        -- 0-5
  connpass_bonus NUMERIC(2,0),               -- 0-5
  
  -- 計算済みスコア
  happiness_score NUMERIC(3,1),              -- 0.0-100.0
  reliability_score NUMERIC(3,0),            -- 0-100
  
  -- データ管理
  data_source_flags JSONB,                   -- {openwork: bool, job_posting: bool, ...}
  scored_at TIMESTAMP,                       -- 計算日時
  last_openwork_sync TIMESTAMP,              -- OpenWork最終同期
  last_job_posting_sync TIMESTAMP,           -- 求人情報最終同期
  last_github_sync TIMESTAMP,                -- GitHub最終同期
  last_connpass_sync TIMESTAMP               -- Connpass最終同期
);
```

### 3.2 company_scrapes テーブル（既存）

```sql
-- 既存の company_scrapes テーブルを活用
-- source = 'job_posting' のレコードから技術スタック・開発環境を抽出
```

## 4. ユーザーウェイト永続化

### 4.1 ローカルストレージ活用

**キー**: `happiness_map:user_weights`

**値**:
```json
{
  "techStackModernity": 2,
  "remoteRate": 3,
  "estimatedOvertimeHours": 2,
  "turnoverRate": 1,
  "retentionRate": 1,
  "devEnvironment": 1,
  "skillUpSupport": 2
}
```

### 4.2 デフォルトウェイト

全て0で初期化（標準スコア表示）

## 5. 計算フロー

### 5.1 ページロード時

```
CompanyDetail マウント
  ↓
Supabase から company_scores を取得
  ↓
rowToCompany() で変換
  ↓
usePersonalWeights() から ローカルストレージのウェイトを取得
  ↓
calculatePersonalScore() でカスタムスコアを計算
  ↓
画面に表示
```

### 5.2 ウェイト調整時

```
ユーザーがスライダーを操作
  ↓
localStorage に新ウェイトを保存
  ↓
calculatePersonalScore() を再計算
  ↓
画面を更新
```

## 6. 実装上の課題と対応

### 6.1 既知の問題

#### CompanyDetail での重複実装
- **現状**: `src/utils/scoring.ts` の `normalizeScores()` と `CompanyDetail.tsx` 内の計算が重複
- **対応**: Supabase連携時に統合（DB側で計算済みスコアを返す）

#### mockCompanies の直接参照
- **現状**: `CompanyDetail.tsx` が直接 mockCompanies をインポート
- **対応**: Supabase連携時に `useCompanyData()` を使用するよう修正

### 6.2 計算精度

- **丸め処理**: 小数第1位で統一
- **境界値チェック**: 0-100の範囲内に制限
- **合計重み検証**: 開発時アサーション

## 7. テスト戦略

### 7.1 単体テスト (scoring.ts)

**テストケース**:
- normalizeScores(): 各指標の正規化ロジック
- calculateHappinessScore(): 重み付き合計
- applyBonusPoints(): ボーナス加算とキャップ
- getScoreColor(): 色分けロジック

**エッジケース**:
- NULL値（デフォルト値への変換）
- 上限値・下限値
- 反転指標（80時間基準など）

### 7.2 統合テスト

- Supabase からのデータ取得〜表示までのフロー
- パーソナルスコア計算とlocalStorage連携

### 7.3 ビジュアルテスト

- 色分けの表示確認
- パーソナルスコア調整時のUI更新

## 8. デプロイと運用

### 8.1 定期更新ジョブ

Supabase Edge Functions または外部ジョブで月1回実行:
1. 求人情報スクレイピング（Wantedly, Indeed等）
2. OpenWork データ取得（API/スクレイピング）
3. GitHub リポジトリ分析
4. Connpass イベント取得
5. company_scores テーブル更新

### 8.2 データ品質保証

- サンプリング検証（月10企業）
- 異常値検知アラート
- 更新頻度監視

## 9. 将来の拡張点

### 9.1 フロントエンド
- 複数企業の比較チャート（レーダーチャート）
- フィルタ・ソート機能
- パーソナルスコアのシェア機能

### 9.2 バックエンド
- 新規指標の追加（給与、ダイバーシティ等）
- 重み配分の動的化（ユーザーセグメント別）
- 地域別・企業規模別の基準差別化
