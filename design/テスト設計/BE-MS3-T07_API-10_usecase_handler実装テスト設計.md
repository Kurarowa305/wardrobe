# BE-MS3-T07 API-10 usecase/handler 実装 テスト設計

## 目的
- API-10（テンプレ詳細）の usecase / handler が、設計どおりにテンプレ情報と同梱服情報を返せることを確認する。

## 対象
- `apps/api/src/domains/template/usecases/templateUsecase.ts`
- `apps/api/src/domains/template/handlers/getTemplateHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`（template domain の GET 詳細ルーティング）

## テスト観点

### 1. usecase
- テンプレ取得時に `templateId` が存在しない場合、`NOT_FOUND` を返す。
- 正常系でテンプレの `name/status/wearCount/lastWornAt` を返す。
- `clothingItems[]` を全件同梱し、テンプレの `clothingIds` 順を保持する。
- 同梱服に `status=DELETED` が含まれても除外せず返せる。

### 2. handler
- path（`wardrobeId/templateId`）を検証し、不正値を `VALIDATION_ERROR` とする。
- 正常系で `200` と `templateDetailResponseSchema` 準拠の JSON を返す。
- 同梱服に `DELETED` ステータスが含まれるケースを透過して返す。

### 3. API-10 集約（router/lambda）
- template domain の `GET /wardrobes/{wardrobeId}/templates/{templateId}` が get handler にルーティングされる。
- lambda entry 経由でも同ルートが処理対象になる。
- `package.json` と CI に API-10 向けテストスクリプトが組み込まれている。

## テストスクリプト
- `apps/api/scripts/check-template-get-usecase-spec.mjs`
- `apps/api/scripts/check-template-get-handler-spec.mjs`
- `apps/api/scripts/check-template-ms3-api10-spec.mjs`

## 実行コマンド
- `pnpm --filter api test:template-get-usecase`
- `pnpm --filter api test:template-get-handler`
- `pnpm --filter api test:template-ms3-api10`
