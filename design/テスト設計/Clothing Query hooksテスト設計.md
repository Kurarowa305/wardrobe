# Clothing Query hooksテスト設計（MS1-T05）

## 目的

- MS1-T05（Clothing Query hooks）の完了条件を継続的に検証する
- `useQuery` ラッパ、`queryKeys` 利用、`staleTime` 方針反映をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-query-hooks-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-query-hooks`

## テストケース

### CQ-01 Clothing Query hooks が src/api/hooks/clothing.ts に存在する
- 観点: 実装配置の統一
- 期待結果: `apps/web/src/api/hooks/clothing.ts` が存在する

### CQ-02 useClothingList/useClothing が useQuery ラッパとして公開される
- 観点: 画面が hooks 経由で取得できる前提
- 期待結果:
  - `useQuery` を利用する
  - `useClothingList` / `useClothing` が export される

### CQ-03 一覧 hook が queryKeys.clothing.list(params) と listClothings を利用する
- 観点: QueryKey 集約ルールと API クライアント利用の徹底
- 期待結果:
  - `queryKey` に `queryKeys.clothing.list(wardrobeId, params)` を使う
  - `queryFn` で `listClothings(wardrobeId, params)` を呼ぶ

### CQ-04 詳細 hook が queryKeys.clothing.detail(id) と getClothing を利用する
- 観点: 詳細取得での QueryKey 一貫性
- 期待結果:
  - `queryKey` に `queryKeys.clothing.detail(wardrobeId, clothingId)` を使う
  - `queryFn` で `getClothing(wardrobeId, clothingId)` を呼ぶ

### CQ-05 一覧 hook が DTO を ClothingListItem VM に変換し nextCursor を返す
- 観点: 画面向けデータ整形とページング情報維持
- 期待結果:
  - `response.items.map(toClothingListItem)` で VM 変換する
  - `nextCursor` を返却値に含める

### CQ-06 詳細 hook が DTO を Clothing VM に変換する
- 観点: 詳細データの VM 変換統一
- 期待結果: `select: toClothing` を利用する

### CQ-07 服一覧 query に staleTime 方針（60秒）が反映される
- 観点: TanStack Query 設計のキャッシュポリシー反映
- 期待結果:
  - `CLOTHING_LIST_STALE_TIME_MS = 60_000` が定義される
  - 一覧 query で `staleTime` に定数を設定する

## CI適用

- `.github/workflows/ci.yml` に `Clothing query hooks spec test` を追加し、PR時に自動検証する
