# BE-MS2-T08 API-07 usecase/handler 実装 テスト設計

## 目的
- 服削除 API（API-07）が論理削除（`status=DELETED`, `deletedAt=now`）として動作することを担保する。
- handler / lambda adapter / package script / CI の配線が揃っていることを担保する。

## 対象
- `apps/api/src/domains/clothing/handlers/deleteClothingHandler.ts`
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テストケース

### TC-01: delete handler が 204 No Content を返し、repo.delete に deletedAt を渡す
- 入力:
  - path: `wardrobeId=wd_001`, `clothingId=cl_001`
  - 依存: `now` を固定値に差し替え
- 期待:
  - 204 No Content を返す
  - `repo.get` で対象取得後、`repo.delete` が呼ばれる
  - `repo.delete` に `deletedAt=now()` が渡る

### TC-02: delete handler が存在しない服を 404 として扱う
- 条件: `repo.get` が空を返す
- 期待: `NOT_FOUND`

### TC-03: API-07 の配線確認（adapter/package/CI）
- 期待:
  - clothing ドメインで DELETE が `deleteClothingHandler` にルーティングされる
  - `apps/api/package.json` に `test:clothing-ms2-api07` が存在する
  - `.github/workflows/ci.yml` に `pnpm --filter api test:clothing-ms2-api07` が存在する

## 実行コマンド
- `pnpm --filter api test:clothing-ms2-api07`
