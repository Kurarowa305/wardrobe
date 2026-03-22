# Clothing型定義テスト設計

## 目的
- Clothing関連DTO/VMの型定義をCIで担保する
- 一覧レスポンスから nextCursor が除去されたことを固定化する

## 対象スクリプト
- `apps/web/scripts/check-clothing-types-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-types`

## テストケース
### CT-01 Clothing schema が存在する
- 期待結果: `apps/web/src/api/schemas/clothing.ts` が存在する

### CT-02 ClothingStatusDto / ClothingGenreDto / ClothingListOrderDto が定義される
- 期待結果: 各 union type が定義される

### CT-03 一覧/詳細レスポンスDTOに genre を含み nextCursor を持たない
- 期待結果:
  - `ClothingListItemDto` が `genre` を含む
  - `ClothingListResponseDto` は `items` のみを持つ
  - `nextCursor` を持たない

### CT-04 Clothing VM 変換が deleted / lastWornAt の整形を行う
- 期待結果: `toClothing` が `status` と `lastWornAt` を整形する

## CI適用
- `.github/workflows/ci.yml` の `Clothing types spec test` で自動検証する
