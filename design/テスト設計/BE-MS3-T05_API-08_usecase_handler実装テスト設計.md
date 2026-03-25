# BE-MS3-T05 API-08 usecase/handler 実装テスト設計

## 目的
- BE-MS3-T05（テンプレ一覧 API-08 usecase/handler 実装）の完了条件を CI で継続検証する。
- `clothingItems[]` の同梱、順序維持、サムネ上限4件、カーソル整合を壊さないことを自動確認する。

## 対象
- `apps/api/src/domains/template/usecases/templateUsecase.ts`
- `apps/api/src/domains/template/handlers/listTemplateHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/scripts/check-template-ms3-api08-spec.mjs`

## テスト観点

### TA-01 usecase が Template 一覧を createdAt インデックスで取得できる
- 観点: API-08 の一覧取得が `StatusListByCreatedAt` を利用し、`order` と `limit` を repo へ正しく伝搬できること。
- 判定方法: repo の呼び出し引数を検査し、`indexName`, `scanIndexForward`, `limit` を検証する。

### TA-02 usecase が clothingItems を順序維持・最大4件で返却できる
- 観点: template の `clothingIds` を batch get 結果に解決し、元順序を維持しつつサムネ用途で4件に制限できること。
- 判定方法: 5件構成の fixture を入力し、レスポンス `clothingItems` が 4 件で、先頭順序が `clothingIds` と一致することを確認する。

### TA-03 usecase が cursor を検証し、不整合時に INVALID_CURSOR を返せる
- 観点: API-08 のページングで order 不一致 cursor を拒否できること。
- 判定方法: 正常 cursor の decode / forward を確認し、order 不一致 cursor で `INVALID_CURSOR` になることを検証する。

### TA-04 handler が query/path を検証して API-08 レスポンスを返せる
- 観点: `order`, `limit`, `cursor` の parse と response schema の整合。
- 判定方法: 文字列 query を入力して handler 実行し、`items[]` と `nextCursor` を持つ 200 レスポンスになることを確認する。

### TA-05 adapter が template ドメインで API-08 にルーティングできる
- 観点: shared handler / lambda entry の両方で `GET /wardrobes/{wardrobeId}/templates` が API-08 handler に到達すること。
- 判定方法: `sharedDomainHandlers.template` と `createLambdaHandler({ domain: "template" })` の応答を検証する。

### TA-06 CI 配線が維持される
- 観点: `package.json` の script と `.github/workflows/ci.yml` のジョブ配線が維持されること。
- 判定方法: spec スクリプト内で script 文字列と CI ステップの存在を静的検査する。

## 実行コマンド
- `pnpm --filter api test:template-ms3-api08`
