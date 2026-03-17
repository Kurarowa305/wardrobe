# MS2-T06 画像表示URLの解決（imageKey→表示URL）テスト設計

## 目的

`imageKey` から表示URLを組み立てる責務を `resolveImageUrl` に集約し、一覧/詳細の画像表示で同じ解決ロジックを利用していることを静的検査で担保する。あわせて、`IMAGE_PUBLIC_BASE_URL` の差し替え（CloudFront化）に向けたベースURL設定点が1箇所であることを確認する。

## 対象

- `apps/web/src/features/clothing/imageUrl.ts`
- `apps/web/src/components/app/screens/ClothingsTabScreen.tsx`
- `apps/web/src/components/app/screens/ClothingDetailScreen.tsx`
- `apps/web/scripts/check-image-url-resolution-spec.mjs`

## テスト観点

1. `resolveImageUrl` 共通関数が存在し、`imageKey` から表示URLを返せること
2. ベースURLが `NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL` で切り替え可能で、既定値を持つこと
3. `imageKey` の空値処理とURLエンコード処理があること
4. 一覧画面（サムネ）が `resolveImageUrl` を利用し、`no image` フォールバックを持つこと
5. 詳細画面が `resolveImageUrl` を利用し、`no image` フォールバックを持つこと

## テストケース

### IUR-01: imageKey から表示URLを解決する共通関数が存在する

- チェック内容
  - `src/features/clothing/imageUrl.ts` が存在する
  - `resolveImageUrl(imageKey)` が export されている
- 期待結果
  - URL解決責務が共通関数へ集約されている

### IUR-02: 表示URL解決は NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL を参照し、既定値 /images を持つ

- チェック内容
  - `DEFAULT_IMAGE_PUBLIC_BASE_URL` が定義されている
  - `process.env.NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL` を参照している
- 期待結果
  - 本番では CloudFront、ローカルではモック配信URLへ差し替え可能

### IUR-03: 表示URL解決は空の imageKey を null 扱いし、path segment をエンコードする

- チェック内容
  - `imageKey` が文字列でない場合に `null` を返す分岐がある
  - 空キーを `null` 扱いにする分岐がある
  - `encodeURIComponent` でpath segmentをエンコードしている
- 期待結果
  - 不正/空キーで壊れたURLを返さず、安全にURLを組み立てられる

### IUR-04: 服一覧画面のサムネ表示が resolveImageUrl を使い、no image フォールバックを持つ

- チェック内容
  - 一覧画面が `resolveImageUrl` を import している
  - `item.imageKey` から `imageUrl` を解決している
  - `img` 表示と `COMMON_STRINGS.placeholders.noImage` のフォールバックがある
- 期待結果
  - 一覧サムネ表示が共通解決関数で統一される

### IUR-05: 服詳細画面の画像表示が resolveImageUrl を使い、no image フォールバックを持つ

- チェック内容
  - 詳細画面が `resolveImageUrl` を import している
  - `clothingQuery.data?.imageKey` から `imageUrl` を解決している
  - `img` 表示と `COMMON_STRINGS.placeholders.noImage` のフォールバックがある
- 期待結果
  - 詳細画面も一覧と同じURL解決ロジックを利用する

## 実行方法

```bash
pnpm --filter web test:image-url-resolution
```

## CI適用

- GitHub Actions `CI` ワークフローに `Image URL resolution spec test` を追加し、上記スクリプトを実行する。
