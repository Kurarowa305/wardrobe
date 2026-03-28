# BE-MS4-T05 API-13 usecase/handler 実装 テスト設計

## 目的
- API-13（履歴一覧）が、日付範囲・カーソル・並び順を扱いながら、テンプレート名と着用服情報を同梱して返却できることを確認する。

## 対象
- `apps/api/src/domains/history/usecases/historyUsecase.ts`
- `apps/api/src/domains/history/handlers/listHistoryHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`（history domain の GET ルーティング）

## テスト観点

### 1. usecase
- `from/to/order/limit/cursor` を `historyRepo.list` に正しく引き渡す。
- `historyDetailsResolver.resolveMany` の結果から `name`（templateName）と `clothingItems[]` を組み立てる。
- 一覧レスポンスの `clothingItems[]` は `wearCount/lastWornAt` を含まない。
- `LastEvaluatedKey` を `nextCursor` に変換できる。
- 並び順・フィルタ条件が一致しない cursor を `INVALID_CURSOR` として拒否する。

### 2. handler
- path/query を検証し、`from/to` の `yyyymmdd` 形式を強制する。
- `from > to` の範囲逆転を `VALIDATION_ERROR` として拒否する。
- `limit` を数値として解釈し usecase に渡す。
- 正常系で `200` と `items[]`, `nextCursor` を返す。

### 3. API-13 集約（router/lambda）
- history domain の `GET /wardrobes/{wardrobeId}/histories` が list handler にルーティングされる。
- lambda entry 経由でも同ルートが処理対象になる。
- `package.json` と CI に API-13 向けテストスクリプトが組み込まれている。

## テストスクリプト
- `apps/api/scripts/check-history-list-usecase-spec.mjs`
- `apps/api/scripts/check-history-list-handler-spec.mjs`
- `apps/api/scripts/check-history-ms4-api13-spec.mjs`

## 実行コマンド
- `pnpm --filter api test:history-list-usecase`
- `pnpm --filter api test:history-list-handler`
- `pnpm --filter api test:history-ms4-api13`
