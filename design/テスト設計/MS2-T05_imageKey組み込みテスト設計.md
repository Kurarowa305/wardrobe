# MS2-T05 服作成/更新に imageKey を組み込む テスト設計

## 目的

擬似アップロード成功後に返却される `imageKey` を、服作成/更新APIのpayloadへ正しく組み込むことを静的検査で担保する。あわせて、保存後に一覧/詳細へ反映できる最低限の連携（MSW保存・invalidate・表示分岐）を確認する。

## 対象

- `apps/web/src/components/app/screens/ClothingCreateScreen.tsx`
- `apps/web/src/components/app/screens/ClothingEditScreen.tsx`
- `apps/web/src/api/schemas/clothing.ts`
- `apps/web/src/api/hooks/clothing.ts`
- `apps/web/src/mocks/handlers/clothing.ts`
- `apps/web/src/components/app/screens/ClothingsTabScreen.tsx`
- `apps/web/src/components/app/screens/ClothingDetailScreen.tsx`
- `apps/web/scripts/check-image-key-payload-spec.mjs`

## テスト観点

1. 追加画面で presign返却 `imageKey` を取得できること
2. 追加画面の create payload にアップロード後 `imageKey` を設定すること
3. 編集画面で presign返却 `imageKey` を取得できること
4. 編集画面の update payload が既存 `imageKey` を保持し、新規アップロード時は置き換えること
5. create/update DTO が `imageKey` を受け取れること
6. MSW handler が create/update で `imageKey` を保存すること
7. 保存後の一覧/詳細再取得に必要な invalidate があること
8. 一覧/詳細画面が `imageKey` を `resolveImageUrl` 経由で表示に反映すること

## テストケース

### IKP-01: 服追加画面で擬似アップロード結果の imageKey を取得できる

- チェック内容
  - `uploadImage` が `Promise<string>` を返す
  - `uploadImageWithPresign` の戻り値から `presigned.imageKey` を返す
- 期待結果
  - create payload に渡すためのアップロード後 `imageKey` を取得できる

### IKP-02: 服追加画面の保存payloadがアップロード成功後の imageKey を使う

- チェック内容
  - `uploadedImageKey` 変数で値を保持する
  - 画像選択時に `uploadedImageKey = await uploadImage(...)` を実行する
  - `createMutation.mutateAsync` の payload で `imageKey: uploadedImageKey` を使う
- 期待結果
  - ファイル名直指定ではなく、presign成功後の `imageKey` が保存される

### IKP-03: 服編集画面で擬似アップロード結果の imageKey を取得できる

- チェック内容
  - `uploadImage` が `Promise<string>` を返す
  - `uploadImageWithPresign` の戻り値から `presigned.imageKey` を返す
- 期待結果
  - update payload に渡すためのアップロード後 `imageKey` を取得できる

### IKP-04: 服編集画面の保存payloadは既存imageKeyを保持しつつ、新規アップロード時は置き換える

- チェック内容
  - 既存 `imageKey` を初期値として `nextImageKey` に保持する
  - 画像選択時に `nextImageKey = await uploadImage(...)` で上書きする
  - `updateMutation.mutateAsync` の payload で `imageKey: nextImageKey` を使う
- 期待結果
  - 画像未変更時は既存キーを維持し、新規画像時のみ新しいキーへ置換される

### IKP-05: clothing create/update DTO が imageKey を受け取れる

- チェック内容
  - `CreateClothingRequestDto` / `UpdateClothingRequestDto` に `imageKey?: string | null` がある
- 期待結果
  - imageKeyを型安全にAPIへ渡せる

### IKP-06: MSW clothing handler が create/update で imageKey を保存する

- チェック内容
  - create時に `imageKey` を保存する
  - update時に `payload.imageKey` がある場合に保存値を更新する
- 期待結果
  - モック環境でも保存後の一覧/詳細に `imageKey` 反映が再現できる

### IKP-07: 保存後のキャッシュ更新で一覧/詳細の再取得が走る

- チェック内容
  - create後に一覧invalidateがある
  - update後に詳細/一覧invalidateがある
- 期待結果
  - 保存後に最新 `imageKey` を参照できる

### IKP-08: 一覧/詳細画面が imageKey を resolveImageUrl で表示に反映する

- チェック内容
  - 一覧画面で `resolveImageUrl(item.imageKey)` を使う
  - 詳細画面で `resolveImageUrl(clothingQuery.data?.imageKey)` を使う
  - 画像なし時は `no image` フォールバック表示を持つ
- 期待結果
  - 保存後に `imageKey` から生成した表示URLで画像描画できる

## 実行方法

```bash
pnpm --filter web test:image-key-payload
```

## CI適用

- GitHub Actions `CI` ワークフローに `Image key payload spec test` を追加し、上記スクリプトを実行する。
