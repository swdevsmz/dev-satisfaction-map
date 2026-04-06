# Functional Design Plan - company-filter

## Unit Context
- **Unit**: company-filter（企業絞り込み機能）
- **Source**: requirements.md（Units Generation スキップのため要件から直接）

## Plan Steps

- [x] Step 1: ビジネスロジックモデル設計（フィルタアルゴリズム・データフロー）
- [x] Step 2: ドメインエンティティ設計（FilterState型・関連型定義）
- [x] Step 3: ビジネスルール定義（AND/OR・閾値・タグ上限等）
- [x] Step 4: PBT-01 テスト可能プロパティ特定
- [x] Step 5: フロントエンドコンポーネント設計（CompanyFilterBar構造・Props・状態）
- [x] Step 6: ユーザーインタラクションフロー設計
- [x] Step 7: エラー/エッジケース設計

## Clarifying Questions

以下の質問に回答してください。`[Answer]:` タグの後に記入し、完了したら「done」とお知らせください。

---

## Question 1
スコア下限フィルターのボタン値はどうしますか？
（スコア色分けに合わせて40・70が自然ですが確認します）

A) 全て / 40以上（yellow以上） / 70以上（green）
B) 全て / 50以上 / 70以上
C) 全て / 60以上 / 80以上
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
リモート率フィルターのボタン値はどうしますか？

A) 全て / 50%以上 / 80%以上（フルリモート近い）
B) 全て / 30%以上 / 70%以上
C) 全て / リモートOK（1%以上） / フルリモート（100%）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
タグフィルターに表示するタグの最大数はどうしますか？

A) 上位10件（すっきりした表示）
B) 上位15件（バランス）
C) 上位20件（多め）
D) 全タグ（スクロール可）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
PersonalWeightPanel（パーソナルスコア）と絞り込みを両方使った場合の動作はどうしますか？

A) フィルタで絞り込み → 絞り込み結果をパーソナルスコア順でソート（自然な流れ）
B) パーソナルスコア順ソート → そのうちフィルタ条件に合う企業を表示
X) Other (please describe after [Answer]: tag below)

[Answer]: A
