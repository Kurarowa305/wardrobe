# Clothing Mutation hooksテスト設計（MS1-T06）

## 目的

- MS1-T06（Clothing Mutation hooks）の完了条件を継続的に検証する
- create/update/delete の `useMutation` ラッパと invalidate 方針の反映をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-mutation-hooks-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-mutation-hooks`

## テストケース

### CMH-01 Clothing Mutation hooks が src/api/hooks/clothing.ts に存在する
- 観点: 実装配置の統一
- 期待結果: `apps/web/src/api/hooks/clothing.ts` が存在する

### CMH-02 useCreateClothingMutation/useUpdateClothingMutation/useDeleteClothingMutation が useMutation ラッパとして公開される
- 観点: 画面が hooks 経由で create/update/delete を実行できる前提
- 期待結果:
  - `useMutation` と `useQueryClient` を利用する
  - `useCreateClothingMutation` / `useUpdateClothingMutation` / `useDeleteClothingMutation` が export される

### CMH-03 create mutation が createClothing を呼び、成功時に clothing lists を invalidate する
- 観点: 完了条件「create: clothing.list invalidate」の担保
- 期待結果:
  - `mutationFn` が `createClothing(wardrobeId, body)` を呼ぶ
  - 成功時に `queryKeys.clothing.lists(wardrobeId)` を invalidate する

### CMH-04 update mutation が updateClothing を呼び、detail(id) と関連一覧を invalidate する
- 観点: 完了条件「update: clothing.detail(id) と関連一覧 invalidate」の担保
- 期待結果:
  - `mutationFn` が `updateClothing(wardrobeId, clothingId, body)` を呼ぶ
  - 成功時に `queryKeys.clothing.detail(wardrobeId, clothingId)` を invalidate する
  - 成功時に `queryKeys.clothing.lists(wardrobeId)` を invalidate する

### CMH-05 delete mutation が deleteClothing を呼び、一覧除外/詳細再取得のため detail(id) と関連一覧を invalidate する
- 観点: 完了条件「delete: 一覧から消え、詳細は削除済み表示」に必要な再取得条件の担保
- 期待結果:
  - `mutationFn` が `deleteClothing(wardrobeId, clothingId)` を呼ぶ
  - 成功時に `queryKeys.clothing.detail(wardrobeId, clothingId)` を invalidate する
  - 成功時に `queryKeys.clothing.lists(wardrobeId)` を invalidate する

### CMH-06 服編集/削除で波及先（template/history）も wardrobe 単位で invalidate する
- 観点: TanStackQuery設計の invalidate 方針（参照波及先の再取得）との整合
- 期待結果:
  - `queryKeys.template.byWardrobe(wardrobeId)` を invalidate する
  - `queryKeys.history.byWardrobe(wardrobeId)` を invalidate する

## CI適用

- `.github/workflows/ci.yml` に `Clothing mutation hooks spec test` を追加し、PR時に自動検証する
