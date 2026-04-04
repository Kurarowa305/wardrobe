# BE-MS7-T06 CloudFront / S3 web / images Terraform 実装テスト設計

## 1. 目的

- `infra/terraform/app/cloudfront_web.tf` / `cloudfront_images.tf` / `s3_web.tf` / `s3_images.tf` / `outputs.tf` が、BE-MS7-T06 の完了条件（web配信・images配信・OAC）を満たすことを継続検証する。
- 専用テストスクリプトが `apps/api/package.json` と GitHub Actions CI (`.github/workflows/ci.yml`) に接続され、PRごとに自動実行されることを保証する。

## 2. 対象

- Terraform 定義: `infra/terraform/app/s3_web.tf`
- Terraform 定義: `infra/terraform/app/cloudfront_web.tf`
- Terraform 定義: `infra/terraform/app/cloudfront_images.tf`
- Terraform 定義: `infra/terraform/app/s3_images.tf`
- Terraform 定義: `infra/terraform/app/outputs.tf`
- テストスクリプト: `apps/api/scripts/check-terraform-cloudfront-ms7-t06-spec.mjs`
- スクリプト登録: `apps/api/package.json`
- CI 登録: `.github/workflows/ci.yml`

## 3. 前提

- `pnpm install --frozen-lockfile` が成功していること。
- リポジトリルートでテストコマンドを実行できること。

## 4. テスト観点 / テストケース

| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | web 配信用 S3 構成 | `s3_web.tf` を検査 | `aws_s3_bucket.web` と `aws_s3_bucket_public_access_block.web` が定義され、public access block がすべて `true` である |
| TC-02 | web 配信用 CloudFront + OAC | `cloudfront_web.tf` を検査 | `aws_cloudfront_origin_access_control.web` と `aws_cloudfront_distribution.web` が定義され、distribution origin が OAC を参照する |
| TC-03 | images 配信用 CloudFront + OAC | `cloudfront_images.tf` を検査 | `aws_cloudfront_origin_access_control.images` と `aws_cloudfront_distribution.images` が定義され、distribution origin が OAC を参照する |
| TC-04 | OAC 前提のバケットポリシー | `cloudfront_web.tf` / `cloudfront_images.tf` を検査 | 両バケットで `cloudfront.amazonaws.com` principal + `AWS:SourceArn` 条件付き `s3:GetObject` 許可ポリシーが定義される |
| TC-05 | CDN 出力値 | `outputs.tf` を検査 | `web_cdn_domain` / `web_cdn_distribution_id` / `images_cdn_domain` / `images_cdn_distribution_id` が定義される |
| TC-06 | web 配信URL rewrite | `cloudfront_web.tf` を検査 | `aws_cloudfront_function.web_rewrite_html` が定義され、default cache behavior の `viewer-request` に関連付く |
| TC-07 | web 配信エラー時のHTMLフォールバック | `cloudfront_web.tf` を検査 | `custom_error_response` で `403` / `404` が `response_page_path="/404.html"` を返す |
| TC-08 | テスト導線（package） | `apps/api/package.json` を検査 | `test:terraform-cloudfront-ms7-t06` が定義され、`test` 集約スクリプトから呼び出される |
| TC-09 | テスト導線（CI） | `.github/workflows/ci.yml` を検査 | `pnpm --filter api test:terraform-cloudfront-ms7-t06` を実行するstepが存在する |
| TC-10 | web 配信URL rewrite 詳細挙動 | `cloudfront_web.tf` 内 CloudFront Function を検査 | `/` は `/index.html`、`/wardrobes/new` は `/wardrobes/new.html`、`/wardrobes/new/` は `/wardrobes/new/index.html` に rewrite される。`/_next/static/chunks/*.js`・`/styles/*.css`・`/index.html` は rewrite されない |

## 5. 実行コマンド

- `pnpm --filter api test:terraform-cloudfront-ms7-t06`

## 6. 完了条件

- TC-01〜TC-10 がすべて成功する。
- CI 上で同一コマンドが自動実行され、失敗時にPRをブロックできる。
