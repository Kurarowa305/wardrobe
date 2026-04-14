# BE-MS5-T10 API-14 handler 実装テスト設計

## 目的

- BE-MS5-T10（API-14 handler 実装）の完了条件を継続検証する
- 履歴作成 handler が schema validation と `409` / `404` / `400` を仕様どおり返却できることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-ms5-api14-handler-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-ms5-api14-handler`

## テストケース

### HMS5API14H-01 正常系: schema 検証後に usecase を実行し `201` と `historyId` を返せる
- 観点: 完了条件「履歴作成 handler」の正常動作
- 期待結果:
  - `path/body` が妥当な場合に `201` を返す
  - レスポンスに `historyId` を含む
  - usecase のトランザクション実行が 1 回呼ばれる

### HMS5API14H-02 Content-Type 不正を `UNSUPPORTED_MEDIA_TYPE(415)` で拒否できる
- 観点: API設計のエラー仕様（Content-Type 不正）
- 期待結果:
  - `application/json` 以外の Content-Type で `UNSUPPORTED_MEDIA_TYPE` を送出する

### HMS5API14H-03 不正な request body を `VALIDATION_ERROR(400)` で拒否できる
- 観点: 完了条件「schema validation」
- 期待結果:
  - `date` 形式不正などで `VALIDATION_ERROR` を送出する

### HMS5API14H-04 `clothingIds` 重複入力を `CONFLICT(409)` で返せる
- 観点: API設計の競合エラー仕様
- 期待結果:
  - `clothingIds` に重複がある場合 `CONFLICT` を送出する

### HMS5API14H-05 参照テンプレ/服の不在を `NOT_FOUND(404)` に正規化できる
- 観点: API設計の 404 仕様
- 期待結果:
  - トランザクション条件チェック失敗（`ConditionalCheckFailed`）を `NOT_FOUND` に変換する


### HMS5API14H-07 template 解決で `NOT_FOUND(404)` を返せる
- 観点: usecase の template 参照エラーを handler 仕様で返却できるか
- 期待結果:
  - template 解決で `NOT_FOUND` が発生した場合、handler も `NOT_FOUND` を返す

### HMS5API14H-08 template 不正（`clothingIds` 空など）を `VALIDATION_ERROR(400)` で返せる
- 観点: template 由来データ不整合のハンドリング
- 期待結果:
  - template 解決で不正 payload が返る場合、handler は `VALIDATION_ERROR` を返す

### HMS5API14H-06 package script と CI 導線が維持される
- 観点: PR 上で自動検証される導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-ms5-api14-handler` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-ms5-api14-handler` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-ms5-api14-handler` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history API-14 handler spec test` を追加し、push 時に自動検証する
