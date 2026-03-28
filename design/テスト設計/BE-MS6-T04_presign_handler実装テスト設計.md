# BE-MS6-T04 presign handler 実装テスト設計

## 目的

- BE-MS6-T04（presign handler 実装）の完了条件を継続検証する
- API-17 の設計どおり wardrobe 存在確認と `validation error` / `unsupported media type` を返せることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-presign-ms6-api17-spec.mjs`
- 実行コマンド: `pnpm --filter api test:presign-ms6-api17`

## テストケース

### PHD-01 API-17 handler が wardrobe存在確認後に正常レスポンスを返せる
- 観点: 完了条件「wardrobe存在確認」を満たすこと
- 期待結果:
  - `wardrobeId` が存在する場合のみ処理が進む
  - レスポンスに `imageKey`, `uploadUrl`, `method`, `expiresAt` が含まれる

### PHD-02 API-17 handler が Content-Type 不正を UNSUPPORTED_MEDIA_TYPE で返せる
- 観点: 完了条件「unsupported media type を返せる」を満たすこと
- 期待結果:
  - `Content-Type` が `application/json` 以外の場合に `UNSUPPORTED_MEDIA_TYPE` が返る

### PHD-03 API-17 handler が request 不正を VALIDATION_ERROR で返せる
- 観点: 完了条件「validation error を返せる」を満たすこと
- 期待結果:
  - `contentType` / `category` / `extension` が schema 不正の場合に `VALIDATION_ERROR` が返る

### PHD-04 API-17 handler が wardrobe 未存在を NOT_FOUND で返せる
- 観点: API 仕様の 404 条件を満たすこと
- 期待結果:
  - `wardrobeId` が存在しない場合に `NOT_FOUND` が返る

### PHD-05 lambda adapter が API-17 を presign handler にルーティングできる
- 観点: API-17 エンドポイントを実運用導線で呼び出せること
- 期待結果:
  - `POST /wardrobes/{wardrobeId}/images/presign` が presign handler にルーティングされる

### PHD-06 package script と CI 導線が維持される
- 観点: PR 上で自動検証される導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:presign-ms6-api17` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:presign-ms6-api17` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:presign-ms6-api17` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API presign API-17 handler spec test` を追加し、push 時に自動検証する
