# BE-MS7-T02 S3 images Terraform 実装テスト設計

## 1. 目的

- `infra/terraform/app/s3_images.tf` に BE-MS7-T02 の完了条件（`PUT/GET/HEAD` 対応、private bucket）が満たされる定義が存在することを継続検証する。
- 専用テストスクリプトが `apps/api/package.json` と GitHub Actions CI (`.github/workflows/ci.yml`) に接続され、PRごとに自動実行されることを保証する。

## 2. 対象

- Terraform 定義: `infra/terraform/app/s3_images.tf`
- テストスクリプト: `apps/api/scripts/check-terraform-s3-images-ms7-t02-spec.mjs`
- スクリプト登録: `apps/api/package.json`
- CI 登録: `.github/workflows/ci.yml`

## 3. 前提

- `pnpm install --frozen-lockfile` が成功していること。
- リポジトリルートでテストコマンドを実行できること。

## 4. テスト観点 / テストケース

| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | images バケット定義 | `s3_images.tf` を検査 | `aws_s3_bucket.images` が定義され、`local.images_bucket_name` を使用する |
| TC-02 | CORS メソッド | `s3_images.tf` の CORS を検査 | `allowed_methods = ["GET", "PUT", "HEAD"]` が定義される |
| TC-03 | private bucket 設定 | `s3_images.tf` の public access block を検査 | `block_public_acls` / `block_public_policy` / `ignore_public_acls` / `restrict_public_buckets` がすべて `true` |
| TC-04 | テスト導線（package） | `apps/api/package.json` を検査 | `test:terraform-s3-images-ms7-t02` が定義され、`test` 集約スクリプトから呼び出される |
| TC-05 | テスト導線（CI） | `.github/workflows/ci.yml` を検査 | `pnpm --filter api test:terraform-s3-images-ms7-t02` を実行するstepが存在する |

## 5. 実行コマンド

- `pnpm --filter api test:terraform-s3-images-ms7-t02`

## 6. 完了条件

- TC-01〜TC-05 がすべて成功する。
- CI 上で同一コマンドが自動実行され、失敗時にPRをブロックできる。
