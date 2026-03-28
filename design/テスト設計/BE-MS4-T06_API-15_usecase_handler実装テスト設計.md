# BE-MS4-T06 API-15 usecase/handler 実装 テスト設計

## 目的
- API-15（履歴詳細取得）が、履歴本体の取得と詳細解決（テンプレート名・着用服詳細）を行い、削除済み服を含めた詳細を返せることを確認する。

## 対象
- `apps/api/src/domains/history/usecases/historyUsecase.ts`
- `apps/api/src/domains/history/handlers/getHistoryHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`（history domain の GET 詳細ルーティング）

## テスト観点

### 1. usecase
- `wardrobeId/historyId` で `historyRepo.get` を呼び出す。
- 取得した履歴を `historyDetailsResolver.resolveOne` へ渡し、`date/templateName/clothingItems[]` を構築する。
- `clothingItems[]` に `wearCount/lastWornAt` を含める。
- `status: DELETED` の服をレスポンスに含められる。
- 履歴が見つからない場合に `NOT_FOUND` を返す。

### 2. handler
- path（`wardrobeId/historyId`）のバリデーションを行う。
- 正常系で `200` と `date/templateName/clothingItems[]` を返す。
- 不正な path を `VALIDATION_ERROR` として拒否する。

### 3. API-15 集約（router/lambda）
- history domain の `GET /wardrobes/{wardrobeId}/histories/{historyId}` が get handler にルーティングされる。
- lambda entry 経由でも同ルートが処理対象になる。
- `package.json` と CI に API-15 向けテストスクリプトが組み込まれている。

## テストスクリプト
- `apps/api/scripts/check-history-get-usecase-spec.mjs`
- `apps/api/scripts/check-history-get-handler-spec.mjs`
- `apps/api/scripts/check-history-ms4-api15-spec.mjs`

## 実行コマンド
- `pnpm --filter api test:history-get-usecase`
- `pnpm --filter api test:history-get-handler`
- `pnpm --filter api test:history-ms4-api15`
