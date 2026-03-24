# BE-MS2-T07 API-06 usecase/handler 実装 テスト設計

## 目的
- 服編集 API（API-06）が `name?` / `genre?` / `imageKey?` の部分更新を受け付けることを担保する。
- handler / lambda adapter / package script / CI の配線が揃っていることを担保する。

## 対象
- `apps/api/src/domains/clothing/handlers/updateClothingHandler.ts`
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テストケース

### TC-01: update handler が部分更新を受け付け、repo.update に反映する
- 入力:
  - path: `wardrobeId=wd_001`, `clothingId=cl_001`
  - body: `name`, `genre`, `imageKey`
  - headers: `content-type: application/json`
- 期待:
  - 204 No Content を返す
  - `repo.get` で既存データを取得後、`repo.update` に更新値が渡る
  - 未指定属性は既存値が維持される

### TC-02: update handler が Content-Type 不正を 415 として扱う
- 入力: `content-type: text/plain`
- 期待: `UNSUPPORTED_MEDIA_TYPE`

### TC-03: update handler が存在しない服を 404 として扱う
- 条件: `repo.get` が空を返す
- 期待: `NOT_FOUND`

### TC-04: API-06 の配線確認（adapter/package/CI）
- 期待:
  - clothing ドメインで PATCH が `updateClothingHandler` にルーティングされる
  - `apps/api/package.json` に `test:clothing-ms2-api06` が存在する
  - `.github/workflows/ci.yml` に `pnpm --filter api test:clothing-ms2-api06` が存在する

## 実行コマンド
- `pnpm --filter api test:clothing-ms2-api06`
