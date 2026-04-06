# Integration Test Instructions - company-filter

## 概要

company-filter は単一ユニットであり、マイクロサービス間の統合テストは不要です。
ここでは **コンポーネント間の統合**（フィルター + PersonalWeightPanel + チャート）を手動で確認する手順を定義します。

## テストシナリオ

### シナリオ 1: フィルター × パーソナルウェイトの組み合わせ

**目的**: フィルターで絞り込み後、パーソナルスコア順ソートが正しく動作すること

**手順**:
1. `npm run dev` で開発サーバーを起動
2. PersonalWeightPanel で「リモートワーク率」を「最重視」に設定
3. スコアフィルターで「70以上」を選択
4. **確認**: カード一覧が「スコア70以上かつリモート率が高い順」で表示される
5. **確認**: ランキング棒グラフが同じ企業セットで更新される

**期待する結果**: PersonalWeight と Filter が独立して機能し、Filter → Sort の順で適用される

### シナリオ 2: タグフィルター × キーワード検索の AND 動作

**手順**:
1. タグ「リモートOK」を選択
2. キーワードに「SaaS」を入力
3. **確認**: 「リモートOK」タグを持ち、かつ名前・説明・業種に「SaaS」を含む企業のみ表示される

### シナリオ 3: 0件時のチャート動作

**手順**:
1. スコアフィルター「70以上」+ タグで極端に絞り込む
2. 0件状態にする
3. **確認**: 「該当する企業が見つかりません」メッセージが表示される
4. **確認**: ランキング棒グラフが空または非表示になる
5. **確認**: 「フィルターをリセット」クリックで全件に戻る

### シナリオ 4: Supabase データとの統合

**前提**: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` が設定済みであること

**手順**:
1. `npm run dev` を起動し、実データが読み込まれるのを確認
2. タグフィルターに実データ由来のタグが表示されることを確認（上位10件）
3. 全フィルター条件で正しく絞り込まれることを確認

## 自動化（将来）

E2E テストには Playwright または Cypress の導入を推奨します。
`data-testid` 属性がコンポーネントに付与済みであるため、セレクターに使用できます:

```typescript
// Playwright の例
await page.getByTestId('filter-keyword-input').fill('SaaS')
await page.getByTestId('filter-score-button-70').click()
await page.getByTestId('filter-tag-button-Go').click()
```
