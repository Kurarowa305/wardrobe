# BE-MS0-T12 Lambda entry 実装テスト設計

## 目的
- BE-MS0-T12（Lambda entry 実装）の完了条件を継続的に検証する
- 各 Lambda entry が API Gateway 互換イベントを local と同じ domain handler / usecase 形式へ変換できることを保証する

## 対象
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/src/entry/lambda/wardrobe_server.ts`
- `apps/api/src/entry/lambda/clothing_server.ts`
- `apps/api/src/entry/lambda/template_server.ts`
- `apps/api/src/entry/lambda/history_server.ts`
- `apps/api/src/entry/lambda/presign_server.ts`
- `apps/api/src/entry/local/router.ts`
- `apps/api/scripts/check-lambda-entry-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. entry 公開
   - 各ファイルが期待する Lambda entry 識別子を公開している
   - 各ファイルが実行可能な `handler` を公開している
2. API Gateway event 変換
   - `requestContext.http.method` / `rawPath` / `pathParameters` を local request 形式へ変換できる
   - `x-request-id` を request context に引き継げる
   - `rawQueryString` を単一値 / 複数値クエリへ復元できる
   - JSON body と base64 でない payload を parse できる
3. domain handler 委譲
   - `wardrobe` / `clothing` / `template` / `presign` が `createLambdaHandler` 経由で domain handler を呼び出せる
   - `history` が `createHistoryHandler` と同じ成功レスポンスを返せる
   - `history` の DELETE 委譲時に未存在データを共通エラー形式（`404 / NOT_FOUND`）で返せる
   - `history` の POST 委譲時に `headers`（`content-type` を含む）を `createHistoryHandler` へ引き継げる
   - handler で発生した validation error を共通エラーレスポンスへ変換できる
   - 外部DynamoDBへの実接続に依存せず、dependency注入で再現可能な結果を検証できる
4. CI 組み込み
   - `pnpm --filter api test:lambda-entry` が package script に追加されている
   - GitHub Actions の CI で lambda entry spec test が実行される

## テストケース
### 1. entry 公開
- コマンド: `pnpm --filter api test:lambda-entry`
- ケース:
  1. 各 `*_server.ts` が対応する domain 名の定数を export する
  2. 各 `*_server.ts` が `handler` を export する

### 2. API Gateway event 変換
- コマンド: `pnpm --filter api test:lambda-entry`
- ケース:
  1. `GET /wardrobes/wd_001` が `wardrobe` domain の path parameter を維持して成功する
  2. `PATCH /wardrobes/wd_010/clothing/cl_001` が `clothingId` を維持して成功する
  3. `POST /wardrobes/wd_040/images/presign?category=clothing&tag=a&tag=b` が query / body / requestId を持つイベントとして処理される

### 3. domain handler 委譲
- コマンド: `pnpm --filter api test:lambda-entry`
- ケース:
  1. `DELETE /wardrobes/wd_020/templates/tmp_001` が `template` domain handler を呼び出す
  2. `POST /wardrobes/wd_030/histories` が `createHistoryHandler` と同じ 201 応答（`{ historyId }`）を返す
  3. 上記の `historyId` は固定値比較ではなく `hs_` プレフィックスを持つ文字列として検証する
  4. `POST /wardrobes/wd_030/histories` の `content-type: application/json` が adapter から handler へ受け渡され、415 回避要件を満たす
  5. `DELETE /wardrobes/wd_030/histories/hs_001` が未存在時に `404` / `NOT_FOUND` / `requestId` を返す
  6. 不正な履歴作成 payload が `400` / `VALIDATION_ERROR` / `requestId` を返す
  7. `wardrobe` / `clothing` / `template` / `presign` の未存在系ケースは dependency注入で `404 / NOT_FOUND` を再現する

### 4. CI 組み込み
- コマンド: `pnpm --filter api test:lambda-entry`
- ケース:
  1. `apps/api/package.json` に `test:lambda-entry` が存在する
  2. `.github/workflows/ci.yml` に `API lambda entry spec test` ステップが存在する
