# BE-MS2-T06 API-05 usecase/handler 実装テスト設計

## 目的
- BE-MS2-T06（服詳細取得 API-05）の完了条件を継続的に検証する。
- 削除済み服を含む詳細取得で `status` / `wearCount` / `lastWornAt` を返せることを保証する。

## 対象
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/clothing/handlers/getClothingHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/scripts/check-clothing-get-usecase-spec.mjs`
- `apps/api/scripts/check-clothing-get-handler-spec.mjs`
- `apps/api/scripts/check-clothing-ms2-api05-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## 前提・方針
- 実DynamoDB接続は行わず、usecase に注入した repo スタブで返却値と呼び出し引数を検証する。
- handler は `parseRequest` による path バリデーションとレスポンス整形を検証する。
- API-05 の仕様どおり、`DELETED` 状態の服でも詳細取得可能であることを重点確認する。
- lambda/local の経路では detail GET が clothing get handler に委譲されることを確認する。

## テストケース

### CGU-01 get usecase が wardrobeId/clothingId で repo.get を呼ぶ
- 観点: 検索キーの正当性
- 入力: `wardrobeId=wd_001`, `clothingId=cl_001`
- 期待結果:
  - repo.get 呼び出し引数に `wardrobeId`, `clothingId` がそのまま渡る

### CGU-02 get usecase が詳細レスポンスに status/wearCount/lastWornAt を含める
- 観点: API-05 完了条件
- 入力: repo が `status=DELETED`, `wearCount=12`, `lastWornAt=1735690000123` を返す
- 期待結果:
  - usecase の戻り値に上記3項目が反映される
  - `imageKey` が null でも返却可能

### CGU-03 get usecase が未存在データを NOT_FOUND とする
- 観点: エラー仕様
- 入力: repo.get が item 未返却
- 期待結果:
  - `NOT_FOUND` を送出する

### CGH-01 get handler が path を検証して 200 を返す
- 観点: handler 入出力
- 入力: `path.wardrobeId`, `path.clothingId`
- 期待結果:
  - 200 レスポンスで `clothingId`, `name`, `genre`, `imageKey`, `status`, `wearCount`, `lastWornAt` を返す
  - `content-type` が JSON

### CGH-02 get handler が削除済み服も返却する
- 観点: API-05 要件（削除済みでも取得可能）
- 入力: usecase/repo が `status=DELETED` を返す
- 期待結果:
  - `status=DELETED` のまま成功レスポンス

### CGH-03 get handler が不正 path を VALIDATION_ERROR とする
- 観点: バリデーション
- 入力: 空 `wardrobeId` など
- 期待結果:
  - `VALIDATION_ERROR` を送出する

### CGA-01 clothing ドメイン共有 handler が detail GET を API-05 に委譲する
- 観点: local/lambda 共有 adapter の配線
- 入力: `GET /wardrobes/wd_123/clothing/cl_123`
- 期待結果:
  - clothing の default placeholder ではなく get handler の JSON（`clothingId`, `status`, `wearCount` 等）を返す

### CGA-02 clothing Lambda entry が API-05 応答を返す
- 観点: Lambda adapter 経由の統合
- 入力: API Gateway 互換 event (`rawPath=/wardrobes/wd_123/clothing/cl_123`, method=GET)
- 期待結果:
  - 200 で `clothingId`, `status`, `wearCount`, `lastWornAt` を返す

## 実行コマンド
- `pnpm --filter api test:clothing-get-usecase`
- `pnpm --filter api test:clothing-get-handler`
- `pnpm --filter api test:clothing-ms2-api05`
- `pnpm --filter api exec tsc --noEmit`
- `pnpm install --frozen-lockfile`
