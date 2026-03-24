# BE-MS2-T04 API-03 usecase/handler 実装テスト設計

## 目的
- BE-MS2-T04（服一覧 API-03）の完了条件を継続的に検証する。
- `order` / `limit` / `cursor` を受ける服一覧 usecase / handler が API 設計どおりに応答することを保証する。

## 対象
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/clothing/handlers/listClothingHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/scripts/check-clothing-list-usecase-spec.mjs`
- `apps/api/scripts/check-clothing-list-handler-spec.mjs`
- `apps/api/scripts/check-clothing-ms2-api03-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## 前提・方針
- 実DynamoDB接続は行わず、usecase に注入した repo スタブの入出力を検証する。
- handler は `parseRequest` による path/query バリデーションとレスポンス整形を検証する。
- cursor は共通 cursor 基盤の envelope を利用し、order / filter の不一致を `INVALID_CURSOR` として扱う。
- lambda/local の経路では collection GET が clothing list handler に委譲されることを確認する。

## テストケース

### CLU-01 list usecase が createdAt index を使って一覧取得する
- 観点: API-03 の登録順一覧と昇降順切替
- 入力: `wardrobeId=wd_001`, `order=asc`, `limit=5`
- 期待結果:
  - repo.list の `indexName` が `StatusListByCreatedAt`
  - `scanIndexForward=true`
  - `limit=5`

### CLU-02 list usecase が genre フィルタと nextCursor を返す
- 観点: APIレスポンス整形
- 入力: repo が `tops` / `bottoms` 混在の Items と `LastEvaluatedKey` を返す
- 期待結果:
  - response.items は指定 genre のみを含む
  - `nextCursor` が `resource=clothing-list`, `order`, `filters.genre`, `position.createdAtSk` を含む

### CLU-03 list usecase が cursor を ExclusiveStartKey に復元する
- 観点: ページング継続
- 入力: 正常な cursor / `order=desc`
- 期待結果:
  - repo.list の `exclusiveStartKey` に cursor.position がそのまま渡る
  - `scanIndexForward=false`

### CLU-04 list usecase が不正な cursor 条件を拒否する
- 観点: cursor の order/filter 整合性
- 入力: `order` または `genre` が cursor envelope と一致しないリクエスト
- 期待結果:
  - `INVALID_CURSOR` を送出する

### CLH-01 list handler が path/query を検証して 200 を返す
- 観点: handler 入出力
- 入力: `path.wardrobeId`, `query.order`, `query.genre`, `query.limit`, `query.cursor`
- 期待結果:
  - 200 レスポンスで `items[]`, `nextCursor` を返す
  - `content-type` が JSON

### CLH-02 list handler が limit を数値化して usecase に渡す
- 観点: query coercion
- 入力: `limit="2"`
- 期待結果:
  - usecase/repo に `limit=2` が渡る
  - `order=desc` は `scanIndexForward=false` として反映される

### CLH-03 list handler が不正入力を `VALIDATION_ERROR` に変換する
- 観点: バリデーション
- 入力: 空の `wardrobeId`, `limit=0`
- 期待結果:
  - `VALIDATION_ERROR` を送出する

### CLA-01 clothing ドメイン共有 handler が collection GET を API-03 に委譲する
- 観点: local/lambda 共有 adapter の配線
- 入力: `GET /wardrobes/wd_123/clothing`
- 期待結果:
  - clothing のデフォルト placeholder ではなく list handler の JSON (`items`, `nextCursor`) を返す

### CLA-02 clothing Lambda entry が API-03 応答を返す
- 観点: Lambda adapter 経由の統合
- 入力: API Gateway 互換 event (`rawPath=/wardrobes/wd_123/clothing`, query 付き)
- 期待結果:
  - 200 で `items`, `nextCursor` を返す

## 実行コマンド
- `pnpm --filter api test:clothing-list-usecase`
- `pnpm --filter api test:clothing-list-handler`
- `pnpm --filter api test:clothing-ms2-api03`
- `pnpm --filter api exec tsc --noEmit`
- `pnpm install --frozen-lockfile`
