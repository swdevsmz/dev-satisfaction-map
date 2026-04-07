# ドキュメント ナビゲーション

dev-satisfaction-map プロジェクトのドキュメント一覧。

---

## 📁 ディレクトリ構成

### 🔧 [setup/](./setup/)

セットアップ・初期設定に関するドキュメント。

- **[rtk.md](./setup/rtk.md)** — RTK（Rust Token Killer）コマンドガイド

### 📊 [pipeline/](./pipeline/)

ETL パイプライン（スクレイピング → Ollama 抽出 → DB 登録）の仕様書・ガイド。

#### 📐 [architecture/](./pipeline/architecture/)

全体設計・データフローの概要。

- **[data-flow.md](./pipeline/architecture/data-flow.md)** — スクレイピング〜DB登録の全体フロー、各ステップの入出力、型定義

#### 📋 [spec/](./pipeline/spec/)

詳細仕様書（実装レベル）。

- **[requirements.md](./pipeline/spec/requirements.md)** — 要件定義（FR/NFR）、全体アーキテクチャ、CLI インターフェース、エラーハンドリング、テスト戦略
- **[scrapers.md](./pipeline/spec/scrapers.md)** — 各スクレイパー（connpass/openwork/github/ir）の詳細実装仕様、アルゴリズム、データ抽出ロジック
- **[ollama.md](./pipeline/spec/ollama.md)** — Ollama API リクエスト・プロンプト設計、JSON パース、バリデーション仕様、テストケース

---

## 🚀 クイックスタート

### 初めての方

1. **全体像を理解**: [pipeline/architecture/data-flow.md](./pipeline/architecture/data-flow.md) を読む
2. **パイプライン実行**: [pipeline/spec/requirements.md](./pipeline/spec/requirements.md) の「3. CLI インターフェース」を参照
3. **トラブルシューティング**: 各ファイルの「エラーハンドリング」セクション

### 実装者向け

1. **スクレイパー修正**: [pipeline/spec/scrapers.md](./pipeline/spec/scrapers.md) で該当ソースの仕様を確認
2. **Ollama 抽出改善**: [pipeline/spec/ollama.md](./pipeline/spec/ollama.md) でバリデーション・テストケースを確認
3. **要件追加**: [pipeline/spec/requirements.md](./pipeline/spec/requirements.md) に追記

---

## 📚 ドキュメント索引

| 内容 | ファイル |
|---|---|
| CLI 実行方法（引数・オプション） | [requirements.md#3-CLI-インターフェース](./pipeline/spec/requirements.md#3-cli-インターフェース) |
| 環境変数設定 | [requirements.md#3-2-引数仕様](./pipeline/spec/requirements.md#32-引数仕様) |
| connpass スクレイパー詳細 | [scrapers.md#2-connpass-スクレイパー](./pipeline/spec/scrapers.md#2-connpass-スクレイパー) |
| OpenWork スクレイパー詳細 | [scrapers.md#3-openwork-スクレイパー](./pipeline/spec/scrapers.md#3-openwork-スクレイパー) |
| GitHub スクレイパー詳細 | [scrapers.md#4-github-スクレイパー](./pipeline/spec/scrapers.md#4-github-スクレイパー) |
| Ollama プロンプト設計 | [ollama.md#3-プロンプトテンプレート](./pipeline/spec/ollama.md#3-プロンプトテンプレート) |
| バリデーションロジック | [ollama.md#5-バリデーション仕様](./pipeline/spec/ollama.md#5-バリデーション仕様) |
| エラーハンドリング | [requirements.md#4-エラーハンドリング](./pipeline/spec/requirements.md#4-エラーハンドリング) |

---

## 📖 ドキュメント仕様

- **言語**: 日本語
- **フォーマット**: Markdown
- **構成**: 
  - 全体設計（architecture）→ 詳細仕様（spec）の順で読むことを推奨
  - 各ファイルは独立して読むことも可能
- **更新**: コード変更と同時にドキュメント更新（要件）

