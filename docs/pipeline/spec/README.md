# パイプライン 詳細仕様書

実装レベルの詳細仕様。スクレイパー修正、Ollama 抽出改善、テスト実装時に参照。

---

## 📄 ファイル一覧

| ファイル | 説明 |
|---|---|
| [requirements.md](./requirements.md) | 要件定義（FR/NFR）、全体アーキテクチャ、CLI インターフェース、エラーハンドリング戦略、テスト戦略 |
| [scrapers.md](./scrapers.md) | 各スクレイパー詳細実装仕様（connpass/openwork/github/ir）、データ抽出アルゴリズム、スコア算出式 |
| [ollama.md](./ollama.md) | Ollama API 仕様、プロンプトテンプレート、JSON パース、バリデーション関数、テストケース |
| [database-schema.md](./database-schema.md) | Supabase テーブル定義（companies / raw_documents）、カラム仕様、RLS、インデックス、データフロー |

---

## 📖 各ファイルの目次

### [requirements.md](./requirements.md)

要件定義から成功基準まで。

```
1. 要件定義（FR 6項目、NFR 5項目）
2. 全体アーキテクチャ（データフロー図、型定義）
3. CLI インターフェース（実行方法、引数、環境変数）
4. エラーハンドリング
   ├─ スクレイパーレベル
   ├─ Ollama レベル
   ├─ Supabase レベル
   └─ エラー時の動作
5. テスト戦略
6. 成功基準
7. 実行フロー（概要図）
```

### [scrapers.md](./scrapers.md)

各スクレイパーの詳細実装仕様。

```
1. 共通インターフェース（ScrapedDocument 型）
2. connpass スクレイパー
   ├─ 機能概要・URL マッピング
   ├─ 取得アルゴリズム（Step 1–4）
   ├─ skill_up_support スコア推定
   ├─ 技術タグ抽出
   ├─ content 生成フォーマット
   └─ エラーハンドリング
3. openwork スクレイパー
   ├─ 前提条件（--accept-tos, OPENWORK_COOKIE）
   ├─ URL マッピング戦略（優先順位）
   ├─ データ取得アルゴリズム
   ├─ 評価スコア・口コミ抽出
   ├─ content 生成フォーマット
   └─ エラーハンドリング
4. github スクレイパー
   ├─ 機能概要・API 呼び出し
   ├─ tech_stack_modernity スコア算出式
   ├─ dev_environment スコア算出式
   ├─ content 生成フォーマット
   └─ エラーハンドリング
5. ir スクレイパー
   ├─ 機能概要・URL マッピング
   ├─ 実装状況（ページ取得のみ）
   └─ 将来実装予定
6. スクレイパー共通仕様
   ├─ HTTP ヘッダ
   ├─ エラー時のデフォルト content
   └─ タイムアウト
```

### [ollama.md](./ollama.md)

Ollama による数値抽出・バリデーション仕様。

```
1. 全体フロー
2. Ollama API リクエスト仕様
   ├─ エンドポイント・パラメータ
   └─ 環境変数
3. プロンプトテンプレート
   ├─ プロンプト本体
   └─ 設計理由
4. JSON パース処理
   ├─ コードブロック除去
   └─ JSON パース
5. バリデーション仕様
   ├─ toIntOrNull() 関数
   ├─ フィールド別バリデーション
   └─ 異常値の例
6. 実装コード（全体）
7. エラーハンドリング
   ├─ API レベル
   ├─ パース レベル
   └─ バリデーション レベル
8. テストケース
   ├─ 正常系
   ├─ 部分的 null
   ├─ 異常値
   └─ コードブロック付き出力
9. Ollama モデル選択
10. パフォーマンス・制限
```

### [database-schema.md](./database-schema.md)

Supabase データベース テーブル定義・運用。

```
1. 全体概要（ERD 図）
2. companies テーブル
   ├─ テーブル定義
   ├─ カラム仕様（15カラム）
   ├─ インデックス
   ├─ トリガー（updated_at 自動更新）
   ├─ RLS（全員読み取り可）
   └─ 初期データ（seed）
3. raw_documents テーブル
   ├─ テーブル定義
   ├─ カラム仕様（6カラム）
   ├─ インデックス（3本）
   └─ RLS（service_role のみ書き込み）
4. データの流れ
   ├─ パイプライン実行時
   └─ dry-run 時
5. CHECK 制約一覧
6. パフォーマンス・スケーリング
   ├─ データ量見積もり
   └─ クエリパフォーマンス
7. バックアップ・リカバリ
8. スキーマの変更履歴
9. 監視・運用（SQL 例）
10. トラブルシューティング
```

---

## 🎯 どのファイルを読むべき？

| 目的 | ファイル | セクション |
|---|---|---|
| CLI 実行方法を知りたい | requirements.md | 3. CLI インターフェース |
| connpass スクレイパーを修正 | scrapers.md | 2. connpass スクレイパー |
| OpenWork スクレイパーを修正 | scrapers.md | 3. openwork スクレイパー |
| GitHub スクレイパーを修正 | scrapers.md | 4. github スクレイパー |
| Ollama プロンプトを改善 | ollama.md | 3. プロンプトテンプレート |
| Ollama バリデーションロジック | ollama.md | 5. バリデーション仕様 |
| エラーメッセージを確認 | requirements.md | 4. エラーハンドリング |
| スコア算出式を知りたい | scrapers.md | 4-4, 4-5（GitHub） |
| テストケースを確認 | ollama.md | 8. テストケース |
| テーブル構造を確認 | database-schema.md | 1. 全体概要 / 2. companies テーブル |
| raw_documents の仕様 | database-schema.md | 3. raw_documents テーブル |
| DB クエリを書きたい | database-schema.md | 9. 監視・運用 / 10. トラブルシューティング |
| CHECK 制約を確認 | database-schema.md | 5. CHECK 制約一覧 |

---

## 💡 実装ガイドライン

### スクレイパー修正時

1. [`requirements.md`](./requirements.md#6-エラーハンドリング) でエラーハンドリング戦略を確認
2. [`scrapers.md`](./scrapers.md) で修正対象スクレイパーの詳細実装を確認
3. content フォーマットを同じ形式に保つ（Ollama の読み込みを考慮）

### Ollama 抽出改善時

1. [`ollama.md`](./ollama.md#3-プロンプトテンプレート) でプロンプトを確認
2. [`ollama.md`](./ollama.md#5-バリデーション仕様) でバリデーションロジックを確認
3. [`ollama.md`](./ollama.md#8-テストケース) でテストケースを追加

### テスト実装時

1. [`requirements.md`](./requirements.md#5-テスト戦略) でテスト戦略を確認
2. [`requirements.md`](./requirements.md#6-成功基準) で成功基準を確認
3. [`ollama.md`](./ollama.md#8-テストケース) でテストケース例を参考に

---

## 🔗 関連リンク

- **親**: [`../README.md`](../README.md)
- **アーキテクチャ**: [`../architecture/`](../architecture/)
- **コード**: `pipeline/` ディレクトリ

