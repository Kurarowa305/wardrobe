# BE-MS6-T05 presign テスト設計

## 目的

- BE-MS6-T05（presign の repo / usecase / handler テスト）の完了条件を継続検証する
- MIME/type 不正・category 不正・正常レスポンスを CI で自動検証し、API-17 周辺の回 regressions を防ぐ

## 対象スクリプト

- `apps/api/scripts/check-presign-ms6-t05-spec.mjs`
- 実行コマンド: `pnpm --filter api test:presign-ms6-t05`

## テストケース

### PSG-01 repo が `category/wardrobeId/uuid.extension` 形式の imageKey を生成できる
- 観点: 完了条件「repo テスト」の基礎仕様を満たすこと
- 期待結果:
  - `buildPresignImageKey` が `clothing/wd_.../uuid.jpg` 形式を返す

### PSG-02 usecase が repo 生成 imageKey と S3 presign を連携できる
- 観点: 完了条件「usecase テスト」を満たすこと
- 期待結果:
  - `imageKey`, `uploadUrl`, `method`, `expiresAt` を返す
  - `buildImageKey` と `presignPutObject` が 1 回ずつ呼ばれる

### PSG-03 handler が MIME/type 不正を `VALIDATION_ERROR` で返せる
- 観点: 完了条件「MIME/type不正」を満たすこと
- 期待結果:
  - `contentType=application/json` など画像 MIME 以外を指定すると `VALIDATION_ERROR` になる

### PSG-04 handler が category 不正を `VALIDATION_ERROR` で返せる
- 観点: 完了条件「category不正」を満たすこと
- 期待結果:
  - `category` が許可値外の場合に `VALIDATION_ERROR` になる

### PSG-05 handler が正常レスポンスを返せる
- 観点: 完了条件「正常レスポンス」を満たすこと
- 期待結果:
  - status 200
  - レスポンスに `imageKey`, `uploadUrl`, `method`, `expiresAt` を含む

### PSG-06 package script と CI 導線が維持される
- 観点: PR 上で自動検証される導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:presign-ms6-t05` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:presign-ms6-t05` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:presign-ms6-t05` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API presign MS6-T05 aggregate spec test` を追加し、push 時に自動検証する
