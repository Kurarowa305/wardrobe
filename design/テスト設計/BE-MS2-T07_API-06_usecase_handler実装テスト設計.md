# BE-MS2-T07 API-06 usecase/handler 実装テスト設計

## 目的
- BE-MS2-T07（服編集 API-06）の完了条件をCIで継続検証する。
- `name?`, `imageKey?` の部分更新ができること、および HTTP ルーティングが正しく接続されていることを担保する。

## 対象
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/clothing/handlers/updateClothingHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/src/domains/clothing/schema/clothingSchema.ts`

## テスト観点
1. PATCH handler が `application/json` を要求し、部分更新入力を usecase に中継できること。
2. バリデーションエラー (`VALIDATION_ERROR`)・Content-Type エラー (`UNSUPPORTED_MEDIA_TYPE`)・未存在 (`NOT_FOUND`) を返せること。
3. update usecase が既存データを取得し、指定された `name` / `imageKey` のみ上書きして repo.update へ渡すこと。
4. local router / lambda adapter の clothing domain が PATCH を API-06 handler にルーティングすること。
5. API用 package script と CI ジョブに API-06 向けテストが接続されていること。

## テストケース

### 1) `check-clothing-update-handler-spec.mjs`
- 正常系: 部分更新（`name`, `imageKey`）で 200 と `clothingId` を返す。
- 異常系: 不正 name で `VALIDATION_ERROR`。
- 異常系: `text/plain` で `UNSUPPORTED_MEDIA_TYPE`。
- 異常系: 対象なしで `NOT_FOUND`。
- 配線: handler 実装本体・package script・CI step の存在確認。

### 2) `check-clothing-ms2-api06-spec.mjs`
- 正常系（配線検証）: shared domain handler で PATCH が API-06 へ到達すること。
- 正常系（配線検証）: lambda handler で PATCH が API-06 へ到達すること。
- 配線: adapter 実装本体・package script・CI step の存在確認。

## 実行コマンド
- `pnpm --filter api test:clothing-update-handler`
- `pnpm --filter api test:clothing-ms2-api06`
