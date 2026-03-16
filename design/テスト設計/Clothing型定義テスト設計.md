# Clothing型定義テスト設計（MS1-T01）

## 目的

- MS1-T01（Clothing 型定義）の完了条件を継続的に検証する
- APIレスポンスDTOと画面表示用VMの分離、および削除済み表示に必要なフラグ定義をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-types-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-types`

## テストケース

### CT-01 clothing schema ファイルが src/api/schemas/clothing.ts に存在する
- 観点: APIレスポンス型の配置統一
- 期待結果: `apps/web/src/api/schemas/clothing.ts` が存在する

### CT-02 Clothing API DTO が status を含めて定義される
- 観点: DTOの基礎情報（`status` を含む）を欠落なく扱えるか
- 期待結果:
  - `ClothingStatusDto` が `ACTIVE | DELETED` で定義される
  - `ClothingDto` が `status` を保持する

### CT-03 一覧/詳細レスポンスDTO（ClothingListResponseDto / ClothingDetailResponseDto）が定義され、詳細に clothingId を含める
- 観点: API-03（一覧）とAPI-05（詳細）のレスポンス形状を型で区別できるか
- 期待結果:
  - `ClothingListResponseDto` が `items` / `nextCursor` を持つ
  - `ClothingDetailResponseDto` は `ClothingDto` として定義され、`clothingId` を含む

### CT-04 画面表示用VMが features/clothing/types.ts に定義される
- 観点: APIスキーマ層と画面表示層の責務分離
- 期待結果: `apps/web/src/features/clothing/types.ts` に `Clothing` / `ClothingListItem` が定義される

### CT-05 Clothing VM が deleted フラグを持ち、DTO由来の状態から表示用に分離される
- 観点: 画面の「削除済み」表示判定をVMに集約できるか
- 期待結果:
  - `Clothing` VM に `deleted: boolean` がある
  - `toClothing` で `status === "DELETED"` を `deleted` に変換する

### CT-06 未着用（lastWornAt=0）を VM で null に正規化する
- 観点: UI側で未着用判定を一貫して扱えるか
- 期待結果:
  - `Clothing.lastWornAt` は `number | null`
  - DTOの `lastWornAt=0` を `null` へ変換する

### CT-07 一覧VM（ClothingListItem / toClothingListItem）は deleted を持たない
- 観点: 一覧表示に不要な削除フラグを持ち込まず、詳細VMとの責務を分離できるか
- 期待結果:
  - `ClothingListItem` に `deleted` が定義されていない
  - `toClothingListItem` が `clothingId` / `name` / `imageKey` のみを返す

## CI適用

- `.github/workflows/ci.yml` に `Clothing types spec test` を追加し、PR時に自動検証する
