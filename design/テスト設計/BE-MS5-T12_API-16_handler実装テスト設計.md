# BE-MS5-T12 API-16 handler 実装テスト設計

## 目的

- BE-MS5-T12（API-16 handler 実装）の完了条件を継続検証する
- 履歴削除 handler が schema validation を通過した上で usecase を実行し、`404` / `500` を仕様どおり返却できることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-ms5-api16-handler-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-ms5-api16-handler`

## テストケース

### HMS5API16H-01 正常系: path 検証後に usecase を実行し `204` を返せる
- 観点: 完了条件「履歴削除handler」の正常動作
- 期待結果:
  - `wardrobeId` / `historyId` が妥当な場合に `204` を返す
  - usecase 側の削除トランザクション実行が 1 回呼ばれる

### HMS5API16H-02 異常系: 不正な path を `VALIDATION_ERROR(400)` で拒否できる
- 観点: handler の schema validation
- 期待結果:
  - 空文字など不正な `historyId` で `VALIDATION_ERROR` を送出する

### HMS5API16H-03 異常系: 履歴未存在を `NOT_FOUND(404)` で返せる
- 観点: API-16 の 404 仕様
- 期待結果:
  - usecase で履歴が見つからない場合 `NOT_FOUND` を送出する

### HMS5API16H-04 異常系: 予期しないエラーを `INTERNAL_ERROR(500)` として返せる
- 観点: API-16 の 500 仕様
- 期待結果:
  - 非AppError例外をエラーレスポンス整形時に `INTERNAL_ERROR` / `500` へ正規化できる

### HMS5API16H-05 package script と CI 導線が維持される
- 観点: PR上で自動検証される導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-ms5-api16-handler` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-ms5-api16-handler` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-ms5-api16-handler` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history API-16 handler spec test` を追加し、push 時に自動検証する
