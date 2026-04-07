# フロントエンド ドキュメント

React + Vite で実装されている画面側の逆引き仕様書。

---

## 📖 ドキュメント一覧

### 📐 [architecture/](./architecture/)

画面構成と画面遷移の全体像。

| ファイル | 内容 |
|---|---|
| [screen-map.md](./architecture/screen-map.md) | ルーティング、共通レイアウト、主要画面間の遷移、データ取得の入口 |

### 📋 [spec/](./spec/)

画面ごとの詳細仕様。

| ファイル | 内容 |
|---|---|
| [screens.md](./spec/screens.md) | Home / CompanyDetail / PrivacyPolicy の表示内容、操作、状態管理、SEO、レスポンシブ挙動 |

---

## 🚀 読み方（推奨順序）

### Step 1: 画面の全体像を把握

`architecture/screen-map.md` を読む。

- どのURLでどの画面が開くか
- Header / Footer を含む共通レイアウト
- 一覧画面から詳細画面への導線

### Step 2: 画面ごとの仕様を確認

`spec/screens.md` を読む。

- 各画面の目的
- 表示ブロック
- データ取得フック
- 操作と遷移
- Loading / Error / Empty 時の振る舞い

---

## 🔗 関連リンク

- **親**: [../README.md](../README.md)
- **兄弟**: [../pipeline/README.md](../pipeline/README.md)
- **コード**: `src/App.tsx`, `src/pages/`, `src/components/`, `src/hooks/`
