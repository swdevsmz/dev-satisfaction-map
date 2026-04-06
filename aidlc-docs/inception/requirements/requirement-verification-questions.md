# Requirements Clarification Questions - 企業絞り込み機能

以下の質問に回答してください。各 `[Answer]:` タグの後に回答を記入してください。
完了したら「done」とお知らせください。

---

## Question 1
どの絞り込み条件を実装しますか？（複数該当する場合は最も近いものを選択）

A) 最小セット：キーワード検索 + 幸福度スコア下限 + リモート率
B) 標準セット：キーワード検索 + 幸福度スコア下限 + リモート率 + タグ選択
C) フルセット：キーワード検索 + 幸福度スコア下限 + リモート率 + タグ選択 + 業種（industry）
D) カスタム（後述）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2
フィルターUIはどこに配置しますか？

A) 企業カード一覧の上部（横長バー形式）
B) PersonalWeightPanel の下に追加（縦積み）
C) 右側チャートパネルの上部
D) ページ上部のヒーロー直下（全幅バー）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
フィルターの動作はどうしますか？

A) リアルタイム（入力するたびに即時反映）
B) 「適用」ボタンを押して反映
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
絞り込み結果が0件になった場合、どう表示しますか？

A) 「該当する企業が見つかりません」メッセージを表示
B) 自動的にフィルターをリセットして全件表示に戻す
C) 絞り込み条件を緩めるサジェストを表示
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
フィルター状態をページリロード後も保持しますか？

A) 保持しない（毎回リセット）
B) localStorage に保存してリロード後も復元する
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
右側のランキング棒グラフ・レーダーチャートは絞り込みの影響を受けますか？

A) 受ける（絞り込まれた企業の中でのランキングを表示）
B) 受けない（常に全企業対象のランキングを表示）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7 - Extension: Security
セキュリティ拡張ルールをこのプロジェクトに適用しますか？

A) Yes — 全セキュリティルールをブロッキング制約として適用（本番グレードのアプリ推奨）
B) No — セキュリティルールをスキップ（PoC・プロトタイプ・実験的プロジェクト向け）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8 - Extension: Property-Based Testing
プロパティベーステスト（PBT）ルールをこのプロジェクトに適用しますか？

A) Yes — 全PBTルールをブロッキング制約として適用（ビジネスロジック・データ変換があるプロジェクト推奨）
B) Partial — 純粋関数とシリアライゼーションのみPBTルールを適用
C) No — PBTルールをスキップ（シンプルなCRUD・UIオンリー・薄い統合レイヤー向け）
X) Other (please describe after [Answer]: tag below)

[Answer]: A
