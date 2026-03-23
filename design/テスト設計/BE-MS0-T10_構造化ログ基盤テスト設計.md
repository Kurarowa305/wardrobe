# BE-MS0-T10 構造化ログ基盤テスト設計

## 目的

- BE-MS0-T10（構造化ログ基盤）の完了条件を継続的に検証する
- `core/logging` に JSONログ生成・出力・エラー時の共通ログ整形を集約し、API横断で同一フォーマットを利用できる状態をCIで担保する
- `requestId`, `method`, `path`, `domain`, `wardrobeId`, `statusCode`, `durationMs`, `errorCode` を含む共通ログ項目を欠落なく出力できることを確認する

## 対象スクリプト

- `apps/api/scripts/check-logging-spec.mjs`
- 実行コマンド: `pnpm --filter api test:logging`

## テストケース

### LG-01 成功ログで必須メタデータをJSONエントリへ整形できる
- 観点: 完了条件の共通フィールド出力
- 期待結果: `createRequestLogEntry()` が `requestId` / `method` / `path` / `domain` / `wardrobeId` / `statusCode` / `durationMs` を含む `info` レベルのJSONエントリを返す

### LG-02 エラーログで errorCode を含む error レベルへ切り替えられる
- 観点: 失敗時の判別容易性
- 期待結果: `errorCode` 付き outcome を渡すと `level: "error"` となり、`errorCode` がログへ含まれる

### LG-03 構造化ログをJSON文字列へ直列化できる
- 観点: CloudWatch等への1行JSON出力
- 期待結果: `serializeLogEntry()` がログエントリをそのまま JSON 文字列化する

### LG-04 durationMs を共通計算で非負ミリ秒へ正規化できる
- 観点: 実行時間メトリクスの安定化
- 期待結果: `measureDurationMs()` が通常ケースで差分を返し、時刻逆転時も 0 未満にならない

### LG-05 AppError / 未知例外を共通 errorCode・statusCode に正規化できる
- 観点: レスポンス基盤との整合
- 期待結果: `createErrorLogOutcome()` が `AppError` と未知例外の双方から `statusCode` / `errorCode` を導出できる

### LG-06 ログ出力先へ success/error を振り分けられる
- 観点: logger 実装差し替え容易性
- 期待結果: `logRequest()` が success は `logger.info()`、error は `logger.error()` を呼び分ける

### LG-07 console logger が1行JSONを標準出力・標準エラーへ出力できる
- 観点: ローカル実行とLambdaログの共通化
- 期待結果: `createConsoleLogger()` が success を `console.info()`、error を `console.error()` へ JSON 文字列で出力する

## CI適用

- `.github/workflows/ci.yml` に `API logging spec test` を追加し、PR時に自動検証する
