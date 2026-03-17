# MS2-T01 画像選択UI（プレビュー/クリア）テスト設計

## 目的

服追加画面・服編集画面において、画像ファイル選択時のプレビュー表示とクリア導線が実装されていることを静的検査で担保する。

## 対象

- `apps/web/src/components/app/screens/ClothingCreateScreen.tsx`
- `apps/web/src/components/app/screens/ClothingEditScreen.tsx`
- `apps/web/src/features/clothing/strings.ts`
- `apps/web/scripts/check-clothing-image-selection-ui-spec.mjs`

## テスト観点

1. 画像ファイル選択UIが追加されていること
2. 選択した画像のプレビュー表示が実装されていること
3. 画像プレビューをクリアできること
4. 画像選択UI向け文言が strings に定義されていること

## テストケース

### CIS-01: 服追加画面に画像ファイル選択UIがある

- チェック内容
  - `name="imageFile"`
  - `type="file"`
  - `accept="image/*"`
  - `setSelectedImageFile(event.target.files?.[0] ?? null)`
- 期待結果
  - すべての実装断片が存在する

### CIS-02: 服追加画面で画像プレビューとクリア導線を表示できる

- チェック内容
  - `previewUrl` state
  - `URL.createObjectURL` / `URL.revokeObjectURL`
  - `<img` によるプレビュー
  - `clearSelectedImage` とクリア文言
- 期待結果
  - プレビュー表示/後始末/クリア導線の実装断片が存在する

### CIS-03: 服編集画面に画像ファイル選択UIとプレビュー/クリア導線がある

- チェック内容
  - 追加画面と同等の画像選択・プレビュー・クリア実装
- 期待結果
  - すべての実装断片が存在する

### CIS-04: 画像選択UI向け文言が clothing strings に追加されている

- チェック内容
  - `imageFile`, `clearImage`, `noPreview`, `previewAlt`
- 期待結果
  - 追加・編集双方で必要文言が定義されている

## 実行方法

```bash
pnpm --filter web test:clothing-image-selection-ui
```

## CI適用

- GitHub Actions `CI` ワークフローに `Clothing image selection UI spec test` を追加し、上記スクリプトを実行する。
