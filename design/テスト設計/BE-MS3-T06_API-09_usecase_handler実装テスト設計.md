# BE-MS3-T06 API-09 usecase/handler 実装 テスト設計

## 目的
- API-09（テンプレ追加）の usecase / handler が、設計どおりに入力検証・参照整合性チェック・作成処理を実行できることを確認する。

## 対象
- `apps/api/src/domains/template/usecases/templateUsecase.ts`
- `apps/api/src/domains/template/handlers/createTemplateHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`（template domain の POST ルーティング）

## テスト観点

### 1. usecase
- `clothingIds` に重複がある場合、`CONFLICT` を返す。
- 参照 `clothingIds` に未存在（または利用不可）がある場合、`NOT_FOUND` を返す。
- 正常系で `templateId` を採番し、`ACTIVE` / `wearCount=0` / `lastWornAt=0` で作成する。
- 参照服チェックのため `batchGetByIds` に `wardrobeId` / `clothingIds` を渡す。

### 2. handler
- `Content-Type: application/json` 以外を `UNSUPPORTED_MEDIA_TYPE` として拒否する。
- `name` 必須・`clothingIds` 必須（空配列不可）などの不正入力を `VALIDATION_ERROR` とする。
- 正常系で `201` と `templateId` を返す。

### 3. API-09 集約（router/lambda）
- template domain の `POST /wardrobes/{wardrobeId}/templates` が create handler にルーティングされる。
- lambda entry 経由でも同ルートが処理対象になる。
- `package.json` と CI に API-09 向けテストスクリプトが組み込まれている。

## テストスクリプト
- `apps/api/scripts/check-template-create-usecase-spec.mjs`
- `apps/api/scripts/check-template-create-handler-spec.mjs`
- `apps/api/scripts/check-template-ms3-api09-spec.mjs`

## 実行コマンド
- `pnpm --filter api test:template-create-usecase`
- `pnpm --filter api test:template-create-handler`
- `pnpm --filter api test:template-ms3-api09`
