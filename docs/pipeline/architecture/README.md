# パイプライン アーキテクチャ ドキュメント

パイプラインの全体設計・データフロー・型定義。

---

## 📄 ファイル一覧

| ファイル | 説明 |
|---|---|
| [data-flow.md](./data-flow.md) | スクレイピング → Ollama 抽出 → DB 登録の全体フロー、各ステップの詳細、Supabase スキーマ |

---

## 📊 ドキュメント内容（概要）

### [data-flow.md](./data-flow.md)

```
Step 1: スクレイピング（並列）
  connpass / openwork / github / ir
  ↓
  ScrapedDocument[]
  ↓
Step 2: raw_documents テーブルへ保存
  ↓
Step 3: Ollama への入力テキスト結合
  === connpass ===
  ...
  ===github ===
  ...
  ↓
Step 4: Ollama による数値抽出
  ↓
  ExtractedScores（9フィールド）
  ↓
Step 5: Supabase companies テーブルへ upsert
```

**セクション**:
1. 全体フロー図
2. Step 1–5 の詳細（各ステップの入出力・型定義）
3. raw_documents テーブル スキーマ
4. companies テーブル スキーマ
5. dry-run と通常実行の違い
6. 注意事項

---

## 🔍 このディレクトリを読むべき人

- パイプライン全体を理解したい人
- 新しくパイプラインプロジェクトに参加した人
- スクレイパーや Ollama の修正前に全体像を把握したい人

---

## 📖 読み方

1. **全体フロー図** を見て、パイプライン全体の流れを理解
2. **Step 1–5 の詳細** で、各ステップで何が起きているかを理解
3. **型定義** で、各ステップの入出力の型を確認
4. **Supabase スキーマ** で、DB テーブルの構造を確認

---

## 🔗 次に読むべきドキュメント

詳細実装仕様は [`../spec/`](../spec/) に:
- **要件・全体設計**: [`spec/requirements.md`](../spec/requirements.md)
- **スクレイパー詳細**: [`spec/scrapers.md`](../spec/scrapers.md)
- **Ollama 詳細**: [`spec/ollama.md`](../spec/ollama.md)

