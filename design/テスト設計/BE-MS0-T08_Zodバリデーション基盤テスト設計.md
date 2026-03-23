# BE-MS0-T08 Zodバリデーション基盤テスト設計

## 目的

- BE-MS0-T08（Zodバリデーション基盤）の完了条件を継続的に検証する
- `core/validation` に path/query/body の入力検証を集約し、Zod の検証失敗を `VALIDATION_ERROR` へ正規化する共通基盤をCIで担保する
- handler が共通スキーマ経由で入力検証を実施できることを履歴APIの利用例で確認する

## 対象スクリプト

- `apps/api/scripts/check-validation-spec.mjs`
- 実行コマンド: `pnpm --filter api test:validation`

## テストケース

### VL-01 safeValidate が成功時にパース済みデータを返せる
- 観点: Zodスキーマの安全な共通検証
- 期待結果: `safeValidate()` が `success: true` と型変換後データを返す

### VL-02 safeValidate が失敗時に人が読める issue 一覧を返せる
- 観点: CLI・デバッグ用途の検証結果確認
- 期待結果: `safeValidate()` が `success: false` と `path: message` 形式の issue を返す

### VL-03 ZodError を VALIDATION_ERROR に正規化できる
- 観点: エラーコード体系の統一
- 期待結果: `normalizeValidationError()` が `VALIDATION_ERROR` / `400` / `details` / `requestId` を保持した `AppError` を返す

### VL-04 validateOrThrow が scope 付き details を持つ AppError を送出できる
- 観点: path/query/body ごとの失敗箇所識別
- 期待結果: `validateOrThrow()` が `query.limit` のような scope 付きキーを持つ `details` で例外送出する

### VL-05 parseRequest が path/query/body をまとめて検証できる
- 観点: handler の共通入力検証
- 期待結果: `parseRequest()` が各入力を個別スキーマで検証し、coerce 後の値を返す

### VL-06 handler で共通schemaを使って検証できる
- 観点: 完了条件の「handlerでschemaを使って検証できる」担保
- 期待結果: `createHistoryHandler()` が共通バリデーション関数経由で `wardrobeId` / `date` / `clothingIds` を検証し、成功レスポンスを返す

### VL-07 handler の検証失敗が VALIDATION_ERROR に正規化される
- 観点: 完了条件の「バリデーション失敗が VALIDATION_ERROR に正規化される」担保
- 期待結果: `createHistoryHandler()` に不正な `date` や競合する入力を渡すと `body.date` / `body.templateId` を含む `VALIDATION_ERROR` が送出される

### VL-08 path 検証を DELETE handler でも再利用できる
- 観点: 複数handlerでの横断利用
- 期待結果: `deleteHistoryHandler()` が path を共通検証したうえで `204 No Content` を返す

## CI適用

- `.github/workflows/ci.yml` に `API validation spec test` を追加し、PR時に自動検証する
