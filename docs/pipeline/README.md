# パイプライン ドキュメント

ETL パイプライン（スクレイピング → Ollama 数値抽出 → Supabase 登録）の仕様書・ガイド。

---

## 📖 ドキュメント一覧

### 📐 [architecture/](./architecture/)

**全体設計・データフロー** — パイプラインの概要を理解するために最初に読むべき。

| ファイル | 内容 |
|---|---|
| [data-flow.md](./architecture/data-flow.md) | スクレイピング〜DB登録の全体フロー、各ステップの入出力、型定義、注意事項 |

### 📋 [spec/](./spec/)

**詳細仕様書** — 実装レベルの詳細。スクレイパー修正や Ollama 抽出改善時に参照。

| ファイル | 内容 |
|---|---|
| [requirements.md](./spec/requirements.md) | 要件定義（FR/NFR）、全体アーキテクチャ、CLI インターフェース、エラーハンドリング、テスト戦略 |
| [scrapers.md](./spec/scrapers.md) | 各スクレイパー（connpass/openwork/github/ir）の詳細実装仕様、URL マッピング、HTML パースロジック、スコア算出式 |
| [ollama.md](./spec/ollama.md) | Ollama API リクエスト・レスポンス仕様、プロンプト設計、JSON パース、バリデーション関数、テストケース |

---

## 🚀 読み方（推奨順序）

### Step 1: 全体像を理解（10分）
```
[architecture/data-flow.md] を読む
├─ スクレイピング結果の型
├─ 各ステップの入出力
└─ Supabase スキーマ
```

### Step 2: 要件・設計を理解（20分）
```
[spec/requirements.md] を読む
├─ 機能要件・非機能要件
├─ CLI インターフェース
├─ エラーハンドリング戦略
└─ テスト戦略
```

### Step 3: 実装詳細を理解（スクレイパー修正時）
```
[spec/scrapers.md] を読む
└─ 修正対象のスクレイパーセクション
  ├─ URL マッピング
  ├─ データ取得アルゴリズム
  └─ content 生成フォーマット
```

### Step 4: Ollama 抽出詳細を理解（Ollama 改善時）
```
[spec/ollama.md] を読む
├─ プロンプトテンプレート
├─ JSON パース処理
├─ バリデーション関数
└─ テストケース
```

---

## 📌 よくある質問

### Q1. CLI 実行方法は？
→ [requirements.md#3-CLI-インターフェース](./spec/requirements.md#3-cli-インターフェース)

### Q2. 新しい企業を追加する場合は？
→ 各スクレイパーの「URL マッピング」セクション（[scrapers.md](./spec/scrapers.md)）に企業ID を追加

### Q3. OpenWork スクレイパーが失敗する場合は？
→ [scrapers.md#3-6-エラーハンドリング](./spec/scrapers.md#36-エラーハンドリング)

### Q4. Ollama 出力が JSON でない場合は？
→ [ollama.md#7-エラーハンドリング](./spec/ollama.md#7-エラーハンドリング)

### Q5. スコア計算ロジックは？
→ [scrapers.md#4-4-tech_stack_modernity-スコア算出](./spec/scrapers.md#44-tech_stack_modernity-スコア算出) など

---

## 🔗 関連リンク

- **親**: [`docs/README.md`](../README.md)
- **兄弟**: [`setup/`](../setup/)
- **コード**: `pipeline/run.ts`, `pipeline/scrapers/`, `pipeline/extractors/`

