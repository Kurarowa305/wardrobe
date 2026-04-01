# BE-MS0-T05 S3クライアント実装テスト設計

## 目的
- `apps/api/src/clients/s3.ts` が presigned URL 発行に必要なS3クライアント設定と、local/mock 切替の土台を提供できることを確認する。
- BE-MS0-T05 の完了条件である presign 用クライアント利用口と storage driver 切替を CI で継続検証する。

## 対象
- `apps/api/src/clients/s3.ts`
- `apps/api/scripts/check-s3-client-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## 実行方法
- 実行コマンド: `pnpm --filter api test:s3`
- 補助確認: `pnpm --filter api exec tsc --noEmit`
- 補助確認: `pnpm install --frozen-lockfile`

## テスト観点
1. 正常系: 環境変数未設定時に region / bucket / publicBaseUrl / storageDriver の既定値を取得できる。
2. 切替: `storageDriver=local` かつ endpoint 指定時に mock 向け endpoint / credentials に切り替わる。
3. 切替: `storageDriver=s3` の場合は AWS モードを維持し、ローカル固定 credentials を強制しない。
4. API面: `presignPutObject` が `uploadUrl`, `publicUrl`, `method`, `expiresAt` を返せる。
5. API面: `createImagePublicUrl` により画像公開URLを一貫生成できる。
6. CI整合: テストスクリプトが package script と CI workflow に登録されている。

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| TS3-01 | 正常系 | `AWS_REGION` / `S3_BUCKET` / `IMAGE_PUBLIC_BASE_URL` / `STORAGE_DRIVER` を未設定で `createS3ClientConfig()` を呼ぶ | `region=ap-northeast-1`, `bucket=wardrobe-dev-images`, `publicBaseUrl=http://localhost:4000/images`, `storageDriver=local`, `presignExpiresInSec=600` が返る |
| TS3-02 | local切替 | `storageDriver=local`, `endpoint=http://localhost:4566` でクライアントを生成する | presigner endpoint が localhost を向き、ローカル用 credentials が設定される |
| TS3-03 | s3切替 | `storageDriver=s3`, `region=us-east-1` でクライアントを生成する | `accessMode=aws` を維持し、ローカル固定 credentials は設定されない |
| TS3-04 | presign API | `presignPutObject()` を呼ぶ | `method=PUT` と `uploadUrl`, `publicUrl`, `expiresAt`, `Bucket`, `ContentType` を含む結果が返る |
| TS3-05 | 公開URL生成 | `createImagePublicUrl("template/wd_01/image.png")` を呼ぶ | `http://localhost:4000/images/template/wd_01/image.png` が返る |
| TS3-06 | CI整合 | `apps/api/package.json` と `.github/workflows/ci.yml` を参照する | `pnpm --filter api test:s3` が scripts / CI に追加されている |
