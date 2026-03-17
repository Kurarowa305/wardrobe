# Clothing編集画面テスト設計（MS1-T10）

## 目的

- MS1-T10（服編集画面）の完了条件を継続的に検証する
- 初期値反映・更新処理・更新後遷移をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-edit-screen-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-edit-screen`

## テストケース

### CES-01 服編集画面が規定ファイルに存在する
- 観点: 実装配置の統一
- 期待結果: `apps/web/src/components/app/screens/ClothingEditScreen.tsx` が存在する

### CES-02 服編集画面が useClothing / useUpdateClothingMutation を利用する
- 観点: MS1-T05 / MS1-T06 hooks再利用
- 期待結果:
  - `useClothing(wardrobeId, clothingId)` で既存値を取得する
  - `useUpdateClothingMutation(wardrobeId, clothingId)` で更新処理を実装する

### CES-03 既存データ取得後にフォーム初期値（name/imageKey）を反映する
- 観点: 完了条件「既存値反映」
- 期待結果:
  - 取得した `clothingQuery.data.name` を `name` stateへ反映する
  - 取得した `clothingQuery.data.imageKey` を `imageKey` stateへ反映する

### CES-04 初期値取得完了前はローディング表示し、取得失敗時はエラー表示する
- 観点: 完了条件「初期値が取れてからフォーム表示（スケルトン等）」
- 期待結果:
  - 取得中に `CLOTHING_STRINGS.edit.messages.loading` を表示する
  - 404時は `CLOTHING_STRINGS.detail.messages.notFound` を表示する
  - その他の失敗時は `CLOTHING_STRINGS.edit.messages.loadError` を表示する

### CES-05 服名未入力時に保存不可かつエラーメッセージを表示する
- 観点: 服追加画面と同等の必須バリデーション維持
- 期待結果:
  - `isNameEmpty` を基準にsubmitボタンをdisableする
  - エラーメッセージに `CLOTHING_STRINGS.edit.messages.nameRequired` を使う

### CES-06 更新成功時に詳細画面へ遷移する
- 観点: 完了条件「更新成功で詳細に反映される」
- 期待結果:
  - `updateMutation.mutateAsync` 実行後に `router.push(ROUTES.clothingDetail(wardrobeId, clothingId))` で詳細へ戻る

### CES-07 服編集画面向け文言が strings に定義される
- 観点: 文言設計ルール（文言の集約）
- 期待結果:
  - `src/features/clothing/strings.ts` に `loading` / `loadError` / `nameRequired` / `submitting` / `submitError` を定義する
  - 画像・服名のプレースホルダー文言を定義する

## CI適用

- `.github/workflows/ci.yml` に `Clothing edit screen spec test` を追加し、PR時に自動検証する
