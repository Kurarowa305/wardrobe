# Presign実装修正 S3環境変数解決テスト設計

## 目的
- Presign 用 S3 クライアント設定が `local` 固定ではなく、実行環境の設定（AWS 向け設定）を正しく参照できることを検証する。
- `createS3ClientConfig()` が環境変数を解決できる状態を CI で継続検証し、再発を防ぐ。

## 対象
- `apps/api/src/clients/s3.ts`
- `apps/api/scripts/check-s3-env-resolution-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. 既定値: 環境変数未設定時はローカル向け既定値で動作できる。
2. 環境変数反映: `AWS_REGION` / `S3_BUCKET` / `IMAGE_PUBLIC_BASE_URL` / `STORAGE_DRIVER` を設定へ反映できる。
3. 優先順位: 明示 override が環境変数より優先される。
4. 実リクエスト適用: 環境変数で解決した設定が presign リクエスト内容と URL 生成に反映される。
5. CI導線: 追加テストが package script と CI で継続実行される。

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| SER-01 | 既定値 | `AWS_REGION` / `S3_BUCKET` / `IMAGE_PUBLIC_BASE_URL` / `STORAGE_DRIVER` 未設定で `createS3ClientConfig()` を呼ぶ | `region=ap-northeast-1`, `bucket=wardrobe-dev-images`, `publicBaseUrl=http://localhost:4000/images`, `storageDriver=local`, `presignExpiresInSec=600` |
| SER-02 | 環境変数反映 | `AWS_REGION=us-west-2`, `S3_BUCKET=wardrobe-prod-images`, `IMAGE_PUBLIC_BASE_URL=https://images.example.com`, `STORAGE_DRIVER=s3` を設定して `createS3ClientConfig()` を呼ぶ | 各値が config に反映される |
| SER-03 | 優先順位 | SER-02 の設定状態で `createS3ClientConfig({ region, bucket, publicBaseUrl, storageDriver, presignExpiresInSec })` を呼ぶ | override 値が採用される |
| SER-04 | リクエスト適用 | SER-02 の設定状態で `createS3Client().presignPutObject(...)` を呼ぶ | `request.region`, `request.bucket`, `request.storageDriver`, `uploadUrl`, `publicUrl` に環境変数解決値が反映される |
| SER-05 | CI整合 | `apps/api/package.json` と `.github/workflows/ci.yml` を参照 | `pnpm --filter api test:s3-env-resolution` が scripts / CI に登録される |

## 実行コマンド
- `pnpm --filter api test:s3-env-resolution`
