# Clothing Query hooksテスト設計

## 目的
- Clothing Query hooks が一覧・詳細取得を query key と API client に沿って利用することをCIで担保する
- 服一覧 hook から nextCursor が除去されていることを固定化する

## 対象スクリプト
- `apps/web/scripts/check-clothing-query-hooks-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-query-hooks`

## テストケース
### CQ-01 Clothing Query hooks が存在する
- 期待結果: `apps/web/src/api/hooks/clothing.ts` が存在する

### CQ-02 useClothingList/useClothing が useQuery ラッパとして公開される
- 期待結果: `useQuery` を利用し、両hookを export する

### CQ-03 一覧 hook が queryKeys.clothing.list(params) と listClothings を利用する
- 期待結果: query key と query function が一覧APIに接続される

### CQ-04 詳細 hook が queryKeys.clothing.detail(id) と getClothing を利用する
- 期待結果: 詳細APIに接続される

### CQ-05 一覧 hook が DTO を ClothingListItem VM に変換し nextCursor を返さない
- 期待結果:
  - `response.items.map(toClothingListItem)` を使う
  - `nextCursor` を返却しない

### CQ-06 詳細 hook が DTO を Clothing VM に変換する
- 期待結果: `select: toClothing` を持つ

### CQ-07 服一覧 query に staleTime 方針（60秒）が反映される
- 期待結果: `CLOTHING_LIST_STALE_TIME_MS = 60_000` を利用する

## CI適用
- `.github/workflows/ci.yml` の `Clothing query hooks spec test` で自動検証する
