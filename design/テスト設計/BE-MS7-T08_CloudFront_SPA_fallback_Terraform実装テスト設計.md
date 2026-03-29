# BE-MS7-T08 CloudFront SPA fallback Terraform 実装テスト設計

## 1. 目的

- `infra/terraform/app/cloudfront_web.tf` と `s3_web.tf` が、SPA deep link 直アクセス時に `index.html` を返すための要件（403/404 fallback）を満たすことを継続検証する。
- 専用テストスクリプトが `apps/api/package.json` と GitHub Actions CI (`.github/workflows/ci.yml`) に接続され、PRごとに自動実行されることを保証する。

## 2. 対象

- Terraform 定義: `infra/terraform/app/cloudfront_web.tf`
- Terraform 定義: `infra/terraform/app/s3_web.tf`
- テストスクリプト: `apps/api/scripts/check-terraform-spa-fallback-ms7-t08-spec.mjs`
- スクリプト登録: `apps/api/package.json`
- CI 登録: `.github/workflows/ci.yml`

## 3. 前提

- `pnpm install --frozen-lockfile` が成功していること。
- リポジトリルートでテストコマンドを実行できること。

## 4. テスト観点 / テストケース

| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | web 配信用 S3 の private 構成 | `s3_web.tf` を検査 | `aws_s3_bucket_public_access_block.web` が定義され、public access block 4項目がすべて `true` である |
| TC-02 | CloudFront origin と HTTPS | `cloudfront_web.tf` を検査 | origin が `aws_s3_bucket.web.bucket_regional_domain_name` を参照し、OACが設定され、`viewer_protocol_policy = "redirect-to-https"` が定義される |
| TC-03 | SPA fallback | `cloudfront_web.tf` を検査 | `default_root_object = "index.html"` に加え、`custom_error_response` で `403` / `404` が `response_page_path = "/index.html"` かつ `response_code = 200` に設定される |
| TC-04 | OAC 経由のみの S3 読み取り | `cloudfront_web.tf` を検査 | `aws_s3_bucket_policy.web` が `cloudfront.amazonaws.com` principal + `AWS:SourceArn` 条件付きの `s3:GetObject` のみ許可する |
| TC-05 | テスト導線（package） | `apps/api/package.json` を検査 | `test:terraform-spa-fallback-ms7-t08` が定義され、`test` 集約スクリプトから呼び出される |
| TC-06 | テスト導線（CI） | `.github/workflows/ci.yml` を検査 | `pnpm --filter api test:terraform-spa-fallback-ms7-t08` を実行する step が存在する |

## 5. 実行コマンド

- `pnpm --filter api test:terraform-spa-fallback-ms7-t08`

## 6. 完了条件

- TC-01〜TC-06 がすべて成功する。
- CI 上で同一コマンドが自動実行され、失敗時にPRをブロックできる。
