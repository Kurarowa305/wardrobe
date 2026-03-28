# BE-MS6-T03 presign usecase 実装テスト設計

## 目的

- BE-MS6-T03（presign usecase 実装）の完了条件を継続検証する
- API-17 の設計どおり `imageKey`, `uploadUrl`, `method`, `expiresAt` を返すことを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-presign-usecase-spec.mjs`
- 実行コマンド: `pnpm --filter api test:presign-usecase`

## テストケース

### PUC-01 presign usecase が imageKey/uploadUrl/method/expiresAt を返せる
- 観点: 完了条件「`imageKey`, `uploadUrl`, `method`, `expiresAt` を返す」を満たすこと
- 期待結果:
  - `issue` の戻り値に `imageKey` が含まれる
  - `uploadUrl` が署名付きURL形式（`X-Amz-Signature` を含む）で返る
  - `method` が `PUT` で返る
  - `expiresAt` が ISO 8601 文字列で返る

### PUC-02 presign usecase が imageKey 生成と S3 presign 発行を連携できる
- 観点: BE-MS6-T02 の imageKey 生成ロジックと BE-MS0-T05 の S3 クライアント連携ができること
- 期待結果:
  - `buildImageKey` に `wardrobeId/contentType/category` が渡される
  - `s3Client.presignPutObject` が `key` と `contentType` を受け取る

### PUC-03 package script と CI 導線が維持される
- 観点: PR 上で自動検証される導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:presign-usecase` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:presign-usecase` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:presign-usecase` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API presign usecase spec test` を追加し、push 時に自動検証する
