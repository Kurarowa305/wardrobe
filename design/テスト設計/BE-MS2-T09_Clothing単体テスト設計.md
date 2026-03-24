# BE-MS2-T09 Clothing 単体テスト設計

## 目的
- Clothing の repo / usecase / handler の要点をまとめて検証し、MS2 の完了条件を継続確認できるようにする。
- 完了条件として定義された「一覧ACTIVEのみ」「削除後の詳細取得」「invalid cursor」を CI 上で担保する。

## 対象
- `apps/api/src/domains/clothing/repo/clothingRepo.ts`
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/clothing/handlers/getClothingHandler.ts`
- `apps/api/src/domains/clothing/handlers/listClothingHandler.ts`
- `apps/api/scripts/check-clothing-ms2-unit-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テストケース

### TC-01: repo.list が ACTIVE の statusListPk を既定で参照する
- 入力:
  - `wardrobeId=wd_001`
  - `indexName=StatusListByCreatedAt`
- 期待:
  - `QueryCommand` の `ExpressionAttributeValues[:statusListPk]` が `W#wd_001#CLOTH#ACTIVE`

### TC-02: usecase.get が DELETED 服の詳細を返せる
- 条件:
  - `repo.get` が `status=DELETED` の item を返す
- 期待:
  - usecase の戻り値に `status=DELETED` が含まれる
  - `wearCount`, `lastWornAt` も返る

### TC-03: get handler が DELETED 服を 200 で返す
- 入力:
  - path: `wardrobeId=wd_001`, `clothingId=cl_deleted`
  - 依存: `repo.get` が DELETED item を返す
- 期待:
  - `statusCode=200`
  - レスポンス JSON の `status=DELETED`

### TC-04: list handler が不正カーソルを INVALID_CURSOR で拒否する
- 入力:
  - query: `order=asc`
  - cursor: payload 内の `order=desc`（order 不一致）
- 期待:
  - `INVALID_CURSOR`

### TC-05: テストスクリプトと CI の配線確認
- 期待:
  - `apps/api/package.json` に `test:clothing-ms2-unit` が存在する
  - `apps/api/package.json` の `test` に `test:clothing-ms2-unit` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:clothing-ms2-unit` が存在する

## 実行コマンド
- `pnpm --filter api test:clothing-ms2-unit`
