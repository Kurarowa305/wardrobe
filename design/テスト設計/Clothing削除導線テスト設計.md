# Clothing削除導線テスト設計（MS1-T11）

## 目的

- MS1-T11（服削除導線）の完了条件を継続的に検証する
- ︙メニューからの削除実行、削除後遷移、削除失敗時通知をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-delete-flow-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-delete-flow`

## テストケース

### CDL-01 服詳細画面で useDeleteClothingMutation を利用して削除処理を実行する
- 観点: MS1-T06 の削除Mutation hooks再利用
- 期待結果:
  - `useDeleteClothingMutation(wardrobeId, clothingId)` を利用する
  - 削除実行で `deleteMutation.mutateAsync()` を呼び出す

### CDL-02 削除確認ダイアログで共通文言を利用する
- 観点: 画面仕様の削除確認（削除しますか？）と文言集約
- 期待結果:
  - `COMMON_STRINGS.dialogs.confirmDelete.title` を参照する
  - `COMMON_STRINGS.dialogs.confirmDelete.message` を参照する
  - `window.confirm` で削除前確認を行う

### CDL-03 削除成功時に服一覧へ遷移する
- 観点: 完了条件「削除後：一覧に消える」へ繋がる導線保証
- 期待結果:
  - 削除成功後に `appendOperationToast(ROUTES.clothings(wardrobeId), OPERATION_TOAST_IDS.clothingDeleted)` 付きで一覧へ遷移する

### CDL-04 削除失敗時にエラー文言でトースト通知する
- 観点: 操作失敗時のユーザー通知
- 期待結果:
  - `CLOTHING_STRINGS.detail.messages.deleteError` を表示する
  - `src/features/clothing/strings.ts` に削除失敗文言を定義する

### CDL-05 OverflowMenu がリンク遷移だけでなく onSelect アクションを実行できる
- 観点: ︙メニューからの即時アクション（削除）の実現
- 期待結果:
  - `OverflowMenuAction` が `onSelect` を受け取れる
  - `href` が無いメニュー項目を button として描画できる
  - 選択時に `action.onSelect?.()` を実行できる

## CI適用

- `.github/workflows/ci.yml` に `Clothing delete flow spec test` を追加し、PR時に自動検証する
