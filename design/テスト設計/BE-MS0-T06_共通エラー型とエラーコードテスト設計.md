# BE-MS0-T06 共通エラー型とエラーコードテスト設計

## 目的

- BE-MS0-T06（共通エラー型とエラーコード）の完了条件を継続的に検証する
- API設計で定義された共通エラーコード、HTTPステータス対応、`AppError` の保持情報、未知例外の正規化をCIで担保する

## 対象スクリプト

- `apps/api/scripts/check-errors-spec.mjs`
- 実行コマンド: `pnpm --filter api test:errors`

## テストケース

### ER-01 API設計で定義された共通エラーコードを列挙できる
- 観点: エラーコード体系の統一
- 期待結果: `VALIDATION_ERROR` / `INVALID_CURSOR` / `NOT_FOUND` / `CONFLICT` / `PAYLOAD_TOO_LARGE` / `UNSUPPORTED_MEDIA_TYPE` / `RATE_LIMITED` / `INTERNAL_ERROR` / `SERVICE_UNAVAILABLE` を `errorCodes` が保持する

### ER-02 エラーコードとHTTPステータスの対応がAPI設計と一致する
- 観点: レスポンス層で再利用できるステータス定義
- 期待結果:
  - `VALIDATION_ERROR`, `INVALID_CURSOR` -> `400`
  - `NOT_FOUND` -> `404`
  - `CONFLICT` -> `409`
  - `PAYLOAD_TOO_LARGE` -> `413`
  - `UNSUPPORTED_MEDIA_TYPE` -> `415`
  - `RATE_LIMITED` -> `429`
  - `INTERNAL_ERROR` -> `500`
  - `SERVICE_UNAVAILABLE` -> `503`

### ER-03 AppError が code/status/message/details/requestId を保持する
- 観点: ドメイン・レスポンス層で扱う共通エラー型
- 期待結果: `createAppError("VALIDATION_ERROR")` で生成したエラーから `code` / `status` / `message` / `details` / `requestId` を参照できる

### ER-04 エラーコード判定と既定メッセージ取得を共通関数で行える
- 観点: ハンドラやバリデーション層の共通利用性
- 期待結果: `isErrorCode` / `getErrorStatus` / `getDefaultErrorMessage` が期待値を返す

### ER-05 既知の AppError は normalizeUnknownError で保持される
- 観点: 既知例外の情報欠落防止
- 期待結果: `AppError` を `normalizeUnknownError` に渡したとき、元の `code` / `details` / `requestId` を維持する

### ER-06 requestId 未設定の AppError は normalizeUnknownError で補完できる
- 観点: ログ追跡用IDの後付け
- 期待結果: `requestId` 未設定の `AppError` に対して `normalizeUnknownError(error, requestId)` を実行すると、同内容で `requestId` 付きの `AppError` を得られる

### ER-07 ネイティブ Error は INTERNAL_ERROR に正規化される
- 観点: 想定外例外の共通フォールバック
- 期待結果: `Error` を `normalizeUnknownError` に渡すと `INTERNAL_ERROR` / `500` になり、`cause` と `requestId` を保持する

### ER-08 Error 以外の未知値も INTERNAL_ERROR に正規化される
- 観点: throw された任意値への耐性
- 期待結果: オブジェクトなどの未知値を `normalizeUnknownError` に渡すと、`details.value` に元値を保持した `INTERNAL_ERROR` を返す

## CI適用

- `.github/workflows/ci.yml` に `API errors spec test` を追加し、PR時に自動検証する
