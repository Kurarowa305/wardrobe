# BE-MS2-T05 API-04 usecase/handler 実装テスト設計

## 目的
- BE-MS2-T05（服追加 API-04）の完了条件を継続的に検証する。
- `name` 必須、`imageKey` 任意、UUIDv7 採番、初期値（`wearCount=0`, `lastWornAt=0`, `status=ACTIVE`）が実装されていることを保証する。

## 対象
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/clothing/handlers/createClothingHandler.ts`
- `apps/api/src/domains/clothing/entities/clothing.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/scripts/check-clothing-create-handler-spec.mjs`
- `apps/api/scripts/check-clothing-ms2-api04-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## 前提・方針
- 実DynamoDB接続は行わず、repo スタブの呼び出し引数で永続化内容を検証する。
- handler は `parseRequest` による path/body バリデーションと `Content-Type` 検証を対象にする。
- ID 採番と時刻は依存注入（`generateClothingId`, `now`）で決定論的に検証する。
- lambda/local の経路では collection POST が clothing create handler に委譲されることを確認する。

## テストケース

### CCH-01 create handler が path/body を検証して 201 を返す
- 観点: handler 入出力
- 入力: `path.wardrobeId`, `body.name`, `body.genre`, `body.imageKey`
- 期待結果:
  - 201 レスポンスで `clothingId` を返す
  - `content-type` が JSON

### CCH-02 create handler が初期属性を構築して repo.create に渡す
- 観点: API-04 完了条件（初期値）
- 入力: `name`, `genre`, `imageKey` と固定 `now`, `generateClothingId`
- 期待結果:
  - repo.create の引数に `status=ACTIVE`, `wearCount=0`, `lastWornAt=0`, `deletedAt=null` が設定される
  - `createdAt` と `clothingId` が注入値で設定される

### CCH-03 create handler が Content-Type 不正を `UNSUPPORTED_MEDIA_TYPE` とする
- 観点: API-04 エラー仕様
- 入力: `content-type=text/plain`
- 期待結果:
  - `UNSUPPORTED_MEDIA_TYPE` を送出する

### CCH-04 create handler が不正 body を `VALIDATION_ERROR` とする
- 観点: バリデーション
- 入力: 空文字 `name`、不正 `genre`
- 期待結果:
  - `VALIDATION_ERROR` を送出する

### CCA-01 clothing ドメイン共有 handler が collection POST を API-04 に委譲する
- 観点: local/lambda 共有 adapter の配線
- 入力: `POST /wardrobes/wd_123/clothing`
- 期待結果:
  - clothing の default placeholder ではなく create handler の JSON (`clothingId`) を返す

### CCA-02 clothing Lambda entry が API-04 応答を返す
- 観点: Lambda adapter 経由の統合
- 入力: API Gateway 互換 event (`rawPath=/wardrobes/wd_123/clothing`, method=POST)
- 期待結果:
  - 201 で `clothingId` を返す

## 実行コマンド
- `pnpm --filter api test:clothing-create-handler`
- `pnpm --filter api test:clothing-ms2-api04`
- `pnpm --filter api exec tsc --noEmit`
- `pnpm install --frozen-lockfile`
