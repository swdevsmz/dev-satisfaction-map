# Unit Test Execution - company-filter

## テスト対象

`src/hooks/useCompanyFilter.test.ts`

- **Example-based テスト**: 4件（キーワード・スコア・リモート率・タグ）
- **PBTテスト**: 7件（P1〜P7、各200回ランダム入力）
- **合計**: 11テスト

## 実行方法（テストランナー未設定・暫定）

### 方法 A: tsx で直接実行（推奨・すぐ実行可能）

```bash
npm install          # fast-check を node_modules に入れる
npx tsx src/hooks/useCompanyFilter.test.ts
```

**期待する出力**:
```
=== useCompanyFilter Tests ===

✓ Example-based tests passed
✓ P1: 結果は入力の部分集合
✓ P2: 空フィルターは全件返す
✓ P3: 厳しいフィルタで件数は単調減少
✓ P4: フィルタは冪等
✓ P5: 全結果がフィルター条件を満たす
✓ P6: availableTags は最大10件
✓ P7: availableTags の各タグは最低1社が保有

✅ All tests passed
```

### 方法 B: Vitest 導入後（将来の推奨）

```bash
npm install -D vitest
# vitest.config.ts を作成（詳細は tech-stack-decisions.md 参照）
npx vitest run src/hooks/useCompanyFilter.test.ts
```

## fast-check seed について（PBT-08）

テスト失敗時、コンソールに以下のような出力が表示されます:

```
Property failed after 42 tests
{ seed: 1234567890, path: "...", endOnFailure: true }
```

失敗を再現するには:

```typescript
fc.assert(
  fc.property(...),
  { seed: 1234567890 }  // 表示されたseed値を指定
)
```

## テスト失敗時の対処

### P3 が失敗する場合
`calculateHappinessScore` の出力値が閾値 40/70 に対して想定外の分布になっている可能性があります。`src/utils/scoring.ts` の正規化ロジックを確認してください。

### P4（冪等性）が失敗する場合
フィルター関数が副作用を持っている可能性があります。`useCompanyFilter.ts` の `filtered` useMemo 内で配列を変更していないか確認してください。
