# BE-MS0-T07 HTTPレスポンス整形テスト設計

## 目的

- BE-MS0-T07（HTTPレスポンス整形）の完了条件を継続的に検証する
- `core/response` に成功レスポンス・エラーレスポンス・No Contentレスポンスの生成処理を集約し、API設計に沿った共通フォーマットをCIで担保する

## 対象スクリプト

- `apps/api/scripts/check-response-spec.mjs`
- 実行コマンド: `pnpm --filter api test:response`

## テストケース

### RS-01 JSONレスポンス共通ヘッダーを生成できる
- 観点: JSONレスポンスの Content-Type 統一
- 期待結果: `createJsonHeaders()` が `application/json; charset=utf-8` を返し、追加ヘッダーをマージできる

### RS-02 成功レスポンスを任意のHTTPステータスで生成できる
- 観点: POST/GET などで再利用できる成功レスポンス整形
- 期待結果: `createJsonResponse(201, payload)` / `createSuccessResponse(payload)` が `statusCode` / `headers` / `body` / `json` を正しく返す

### RS-03 No Contentレスポンスを共通生成できる
- 観点: DELETE 等の空レスポンス共通化
- 期待結果: `createNoContentResponse()` が `204` と空文字ボディを返す

### RS-04 AppError をAPI設計の共通エラーenvelopeへ整形できる
- 観点: `error.code` / `error.message` / `error.details` / `error.requestId` の統一
- 期待結果: `toErrorBody(createAppError("VALIDATION_ERROR", ...))` が API 設計のエラーレスポンス共通フォーマットに一致する

### RS-05 未知例外も共通エラーフォーマットで返せる
- 観点: 想定外例外時のフォールバック統一
- 期待結果: `createErrorResponse(new Error(...), { requestId })` が `INTERNAL_ERROR` / `500` と `requestId` を含むJSONレスポンスを返す

## CI適用

- `.github/workflows/ci.yml` に `API response spec test` を追加し、PR時に自動検証する
