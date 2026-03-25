# BE-MS3-T05 API-08 usecase/handler 実装テスト設計

## 目的
- BE-MS3-T05（テンプレ一覧 API-08）の完了条件を継続的に検証する。
- `clothingItems[]` を服データ同梱で返し、4件制限なしで全件返却する仕様を保証する。

## 対象
- `apps/api/src/domains/template/usecases/templateUsecase.ts`
- `apps/api/src/domains/template/handlers/listTemplateHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/scripts/check-template-list-usecase-spec.mjs`
- `apps/api/scripts/check-template-list-handler-spec.mjs`
- `apps/api/scripts/check-template-ms3-api08-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## 前提・方針
- 実DynamoDB接続は行わず、usecase に注入した template repo / clothing batch-get repo スタブで検証する。
- template 一覧は `ACTIVE` のみを前提に repo.list の返却結果を usecase が整形する。
- `clothingItems[]` は template の `clothingIds` 順を維持し、上限4件で切り捨てない。
- cursor は共通 cursor 基盤の envelope を利用し、order 不一致を `INVALID_CURSOR` として扱う。
- lambda/local の経路では collection GET が template list handler に委譲されることを確認する。

## テストケース

### TLU-01 list usecase が createdAt index を使って一覧取得する
- 観点: API-08 の登録順一覧と昇降順切替
- 入力: `wardrobeId=wd_001`, `order=asc`, `limit=5`
- 期待結果:
  - repo.list の `indexName` が `StatusListByCreatedAt`
  - `scanIndexForward=true`
  - `limit=5`

### TLU-02 list usecase が clothingItems を全件返却し順序維持する
- 観点: 4件制限撤廃
- 入力: 1テンプレに `clothingIds` 5件、batchGet で5件すべて返却
- 期待結果:
  - response.items[0].clothingItems.length が 5
  - clothingIds の順序で返却される

### TLU-03 list usecase が nextCursor を返す
- 観点: ページング
- 入力: repo が `LastEvaluatedKey` を返却
- 期待結果:
  - `resource=template-list`, `order`, `position.createdAtSk` を含む cursor を返却

### TLU-04 list usecase が cursor を ExclusiveStartKey に復元する
- 観点: ページング継続
- 入力: 正常な cursor / `order=desc`
- 期待結果:
  - repo.list の `exclusiveStartKey` に cursor.position が渡る
  - `scanIndexForward=false`

### TLU-05 list usecase が不整合 cursor を拒否する
- 観点: cursor 整合性
- 入力: cursor の `order` とリクエスト `order` が不一致
- 期待結果:
  - `INVALID_CURSOR` を送出する

### TLH-01 list handler が path/query を検証して 200 を返す
- 観点: handler 入出力
- 入力: `path.wardrobeId`, `query.order`, `query.limit`, `query.cursor`
- 期待結果:
  - 200 レスポンスで `items[]`, `nextCursor` を返す
  - `content-type` が JSON

### TLH-02 list handler が limit を数値化して usecase に渡す
- 観点: query coercion
- 入力: `limit="2"`
- 期待結果:
  - usecase/repo に `limit=2` が渡る
  - `order=desc` は `scanIndexForward=false` として反映される

### TLH-03 list handler が不正入力を `VALIDATION_ERROR` に変換する
- 観点: バリデーション
- 入力: 空の `wardrobeId`, `limit=0`
- 期待結果:
  - `VALIDATION_ERROR` を送出する

### TLA-01 template ドメイン共有 handler が collection GET を API-08 に委譲する
- 観点: local/lambda 共有 adapter の配線
- 入力: `GET /wardrobes/wd_123/templates`
- 期待結果:
  - template の default placeholder ではなく list handler の JSON (`items`, `nextCursor`) を返す

### TLA-02 template Lambda entry が API-08 応答を返す
- 観点: Lambda adapter 経由の統合
- 入力: API Gateway 互換 event (`rawPath=/wardrobes/wd_123/templates`, query 付き)
- 期待結果:
  - 200 で `items`, `nextCursor` を返す

## 実行コマンド
- `pnpm --filter api test:template-list-usecase`
- `pnpm --filter api test:template-list-handler`
- `pnpm --filter api test:template-ms3-api08`
- `pnpm --filter api exec tsc --noEmit`
- `pnpm install --frozen-lockfile`
