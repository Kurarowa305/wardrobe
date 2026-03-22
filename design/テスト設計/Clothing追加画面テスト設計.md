# Clothing追加画面テスト設計（MS1-T09）

## 目的

- MS1-T09（服追加画面）の完了条件を継続的に検証する
- 服名必須バリデーションと保存成功時の遷移をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-create-screen-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-create-screen`

## テストケース

### CCS-01 服追加画面が規定ファイルに存在する
- 観点: 実装配置の統一
- 期待結果: `apps/web/src/components/app/screens/ClothingCreateScreen.tsx` が存在する

### CCS-02 服追加画面が client component で、追加mutationとフォーム状態を持つ
- 観点: MS1-T06 mutation hooks再利用
- 期待結果:
  - client component として実装される
  - `useCreateClothingMutation(wardrobeId)` を利用する
  - `name` / `imageKey` の入力stateを保持する

### CCS-03 服名未入力時に保存不可かつエラーメッセージを表示する
- 観点: 完了条件「服名未入力で保存不可（エラーメッセージ）」
- 期待結果:
  - `isNameEmpty` を基準にsubmitボタンをdisableする
  - エラーメッセージに `CLOTHING_STRINGS.create.messages.nameRequired` を使う

### CCS-04 保存成功時に服一覧へ遷移する
- 観点: 完了条件「保存成功で詳細 or 一覧へ遷移」
- 期待結果:
  - `createMutation.mutateAsync` 実行後に `appendOperationToast(ROUTES.clothings(wardrobeId), OPERATION_TOAST_IDS.clothingCreated)` 付きで一覧へ遷移する

### CCS-05 服追加画面が画像任意・服名必須の入力UIを持つ
- 観点: 画面仕様（画像任意、服名必須）
- 期待結果:
  - 画像入力フィールド（`name="imageKey"`）が存在する
  - 服名入力フィールド（`name="name"`）が存在する

### CCS-06 服追加画面向け文言が strings に定義される
- 観点: 文言設計ルール（文言の集約）
- 期待結果:
  - `src/features/clothing/strings.ts` に `nameRequired` / `submitting` / `submitError` を定義する
  - 画像・服名のプレースホルダー文言を定義する

## CI適用

- `.github/workflows/ci.yml` に `Clothing create screen spec test` を追加し、PR時に自動検証する
