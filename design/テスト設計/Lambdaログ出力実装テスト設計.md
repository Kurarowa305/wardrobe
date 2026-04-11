# Lambdaログ出力実装テスト設計

## 目的

- Lambda adapter 経由のリクエストで、構造化ログの必須項目が欠落なく出力されることを継続的に検証する。
- 成功系・ハンドラエラー・例外・入力不正（JSON不正）の各経路で、ログレベルと `errorCode` / `errorResponseBody` の扱いが期待どおりであることを保証する。
- ローカル実行と同じ `core/logging` 基盤を Lambda 側でも利用していることを CI で担保する。

## 対象スクリプト

- `apps/api/scripts/check-lambda-logging-spec.mjs`
- 実行コマンド: `pnpm --filter api test:lambda-logging`

## テストケース

### LLG-01 成功レスポンスで必須ログ項目を `info` で出力できる
- 観点: 基本ログ項目の充足
- 期待結果: 成功時に `requestId` / `method` / `path` / `domain` / `wardrobeId` / `statusCode` / `durationMs` を含む `info` ログが 1 件出力される。

### LLG-02 ハンドラがエラーレスポンスを返す場合に `errorCode` を出力できる
- 観点: エラーレスポンスの構造化ログ反映
- 期待結果: ハンドラが `NOT_FOUND` を返す場合、`error` レベルで `errorCode: "NOT_FOUND"` と `errorResponseBody` を含むログが出力される。

### LLG-03 例外 throw 時に `INTERNAL_ERROR` へ正規化してログ出力できる
- 観点: 例外経路の正規化
- 期待結果: 例外発生時、HTTP 500 へ変換されると同時に `errorCode: "INTERNAL_ERROR"` と正規化後の `errorResponseBody` を含む `error` ログが出力される。

### LLG-04 不正JSON入力時にハンドラ呼び出し前で `VALIDATION_ERROR` をログ出力できる
- 観点: adapter 入力検証失敗時のログ
- 期待結果: JSON parse 失敗時にハンドラは呼ばれず、HTTP 400 + `errorCode: "VALIDATION_ERROR"` + `errorResponseBody` の `error` ログが出力される。

## CI適用

- `.github/workflows/ci.yml` に `API lambda logging spec test` を追加し、push 時に自動検証する。
