# セットアップ ドキュメント

プロジェクトのセットアップ・初期設定に関するドキュメント。

---

## 📄 ファイル一覧

| ファイル | 説明 |
|---|---|
| [rtk.md](./rtk.md) | RTK（Rust Token Killer）コマンドリファレンス、トークン削減テクニック |

---

## 🚀 初期セットアップ手順

### Step 1: リポジトリのクローン

```bash
git clone https://github.com/your-org/dev-satisfaction-map.git
cd dev-satisfaction-map
```

### Step 2: 依存パッケージのインストール

```bash
npm install
# または
pnpm install
```

### Step 3: 環境変数の設定

```bash
# pipeline.env（パイプライン用）
cp pipeline.env.example pipeline.env

# .env.local（フロントエンド用）
cp .env.example .env.local
```

**パイプライン関連の環境変数**:

| 変数 | 用途 | 例 |
|---|---|---|
| `OLLAMA_HOST` | Ollama API の接続先 | `http://localhost:11434` |
| `OLLAMA_MODEL` | 使用モデル | `gemma2` |
| `OPENWORK_COOKIE` | OpenWork の認証 Cookie | `session=abc123; ...` |
| `OPENWORK_URL_MAP` | OpenWork URL マッピング（JSON） | `{"mercari-jp": "https://..."}` |
| `GITHUB_TOKEN` | GitHub API rate limit 拡張用（オプション） | `ghp_xxx` |
| `SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase API キー | `eyJxxx...` |

### Step 4: Ollama のセットアップ

```bash
# Ollama がインストール済みか確認
ollama --version

# gemma2 モデルをダウンロード
ollama pull gemma2

# Ollama サーバー起動（別ターミナル）
ollama serve
```

### Step 5: Supabase のセットアップ

```bash
# Supabase CLI がインストール済みか確認
supabase --version

# ローカル開発サーバー起動
supabase start

# マイグレーション実行
supabase migration up
```

### Step 6: 開発サーバー起動

```bash
npm run dev
# http://localhost:5173 で起動
```

---

## 🔧 RTK（Rust Token Killer）について

Claude Code でのトークン使用量を削減するツール。

詳細は [`rtk.md`](./rtk.md) を参照。

### 基本用法

```bash
# ビルド出力をコンパクト表示
rtk cargo build
rtk tsc

# テスト失敗のみ表示
rtk vitest run
rtk playwright test

# Git コマンドをコンパクト表示
rtk git status
rtk git diff
```

---

## 📚 関連ドキュメント

- **親**: [`../README.md`](../README.md)
- **パイプラインドキュメント**: [`../pipeline/`](../pipeline/)

