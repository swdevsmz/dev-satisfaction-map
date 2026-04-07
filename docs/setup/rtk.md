# RTK (Rust Token Killer) セットアップガイド

Claude Code のトークン消費を **60〜90% 削減**する CLI プロキシツール。

> ⚠️ **名前衝突に注意**: `rtk` という名前のツールが2種類存在する。
> - ✅ **Rust Token Killer** (`rtk-ai/rtk`) ← こちらが目的のもの
> - ❌ **Rust Type Kit** (`reachingforthejack/rtk`) ← 別物、インストールしない
>
> インストール後に `rtk gain` が動けば正しい方が入っている。

---

## インストール

### macOS

```bash
# Homebrew（推奨）
brew install rtk

# または cargo 経由
cargo install --git https://github.com/rtk-ai/rtk
```

### Windows

Homebrew が使えないため、Cargo 経由のインストールのみ。

**前提: Rust のインストール**（未インストールの場合）

```powershell
# rustup インストーラーをダウンロードして実行
winget install Rustlang.Rustup
# または https://rustup.rs/ からインストーラーを入手
```

**RTK インストール**

```powershell
cargo install --git https://github.com/rtk-ai/rtk
```

インストール後、PATH が通っていない場合は `~/.cargo/bin` を追加する。

```powershell
# PowerShell の場合（永続化）
[Environment]::SetEnvironmentVariable(
  "PATH",
  "$env:USERPROFILE\.cargo\bin;$env:PATH",
  "User"
)
# ターミナルを再起動して反映
```

---

## インストール確認

```bash
rtk --version   # "rtk 0.27.x" のように表示されること
rtk gain        # トークン節約統計が表示されること（← これが正しいRTKの証明）
```

`rtk gain` が動けばOK。`command not found` になる場合は PATH が通っていない。

---

## Claude Code への組み込み（初期化）

### 推奨: グローバル設定（全プロジェクトで有効化）

```bash
rtk init -g
# → ~/.claude/hooks/rtk-rewrite.sh を作成
# → ~/.claude/RTK.md を作成（10行、軽量）
# → ~/.claude/CLAUDE.md に @RTK.md の参照を追加
# → settings.json への書き込みを確認するプロンプトが出る → y で確認
```

これで Claude Code が `git status` などのコマンドを自動的に `rtk git status` に書き換えてくれる。

**プロンプトなしで自動設定したい場合:**

```bash
rtk init -g --auto-patch
```

**設定の確認:**

```bash
rtk init --show   # フックが正しくインストールされているか確認
```

### 単一プロジェクトのみに適用する場合

```bash
cd /path/to/project
rtk init   # ./CLAUDE.md にRTK設定を追記
```

---

## 動作確認

```bash
# ファイル一覧
rtk ls .

# Git ステータス
rtk git status

# テスト実行（失敗のみ表示）
rtk vitest run
rtk test npm test
```

---

## このプロジェクトで特に効くコマンド

| コマンド | 削減率 | 備考 |
|---------|--------|------|
| `rtk test npm test` | -90% | 失敗したテストのみ表示 |
| `rtk tsc` | -80% | TypeScript エラーをグループ化 |
| `rtk lint` | -80% | ESLint エラーをルール別に集約 |
| `rtk git status` | -80% | 変更ファイルをコンパクト表示 |
| `rtk git diff` | -70% | 差分を圧縮（詳細確認時は `-v` で生出力） |
| `rtk git log -n 10` | -80% | コミット履歴を1行ずつ表示 |

---

## 節約統計の確認

```bash
rtk gain              # 累計節約トークン数
rtk gain --graph      # 30日間の ASCII グラフ
rtk gain --history    # コマンド別の履歴
```

---

## 注意点

- **ファイル読み取りは RTK を通さない方が安全**: `rtk read` の `aggressive` モードは関数の中身を `{ ... }` に置換するため、Claude がコードを誤解する可能性がある。Claude Code の Read ツール（`cat` ではなく専用ツール）はそのまま使う。
- **`rtk git diff` は差分詳細が圧縮される**: デバッグ中に詳細が必要な場合は `rtk git diff -v` で生出力を確認。
- **フィルタ失敗時は元の出力にフォールバック**: 安全設計になっているが、疑わしい場合は `-v` フラグで確認できる。

---

## アンインストール

```bash
# Claude Code のフック・設定を削除
rtk init -g --uninstall

# バイナリ削除
cargo uninstall rtk        # Cargo 経由でインストールした場合
brew uninstall rtk         # macOS Homebrew の場合

# バックアップから復元（必要な場合）
cp ~/.claude/settings.json.bak ~/.claude/settings.json
```

---

## 参考

- GitHub: https://github.com/rtk-ai/rtk
- 公式サイト: https://www.rtk-ai.app
- トラブルシューティング: https://github.com/rtk-ai/rtk/blob/master/docs/TROUBLESHOOTING.md
