# BE-MS7-T04 API Gateway Terraform 実装テスト設計

## 1. 目的

- `infra/terraform/app/apigw_http_api.tf` に BE-MS7-T04 の完了条件（HTTP API が path prefix ごとに正しい domain Lambda へルーティングされる）が満たされる定義が存在することを継続検証する。
- 専用テストスクリプトが `apps/api/package.json` と GitHub Actions CI (`.github/workflows/ci.yml`) に接続され、PRごとに自動実行されることを保証する。

## 2. 対象

- Terraform 定義: `infra/terraform/app/apigw_http_api.tf`
- テストスクリプト: `apps/api/scripts/check-terraform-apigw-ms7-t04-spec.mjs`
- スクリプト登録: `apps/api/package.json`
- CI 登録: `.github/workflows/ci.yml`

## 3. 前提

- `pnpm install --frozen-lockfile` が成功していること。
- リポジトリルートでテストコマンドを実行できること。

## 4. テスト観点 / テストケース

| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | HTTP API リソース定義 | `apigw_http_api.tf` を検査 | `aws_apigatewayv2_api.http_api` が定義される |
| TC-02 | domain integration 定義 | `apigw_http_api.tf` の locals を検査 | `wardrobe` / `clothing` / `template` / `history` / `presign` がそれぞれ `aws_lambda_function.domain[<domain>]` に紐づく |
| TC-03 | path prefix ルーティング | `apigw_http_api.tf` の route key を検査 | `/wardrobes`, `/clothing`, `/templates`, `/histories`, `/images/presign` の各 prefix が定義される |
| TC-04 | route から integration への紐付け | `apigw_http_api.tf` の route を検査 | route ごとに `aws_apigatewayv2_integration.domain` を参照する |
| TC-05 | Lambda invoke 権限 | `apigw_http_api.tf` を検査 | `aws_lambda_permission.apigw_domain` が domain Lambda ごとに定義される |
| TC-06 | テスト導線（package） | `apps/api/package.json` を検査 | `test:terraform-apigw-ms7-t04` が定義され、`test` 集約スクリプトから呼び出される |
| TC-07 | テスト導線（CI） | `.github/workflows/ci.yml` を検査 | `pnpm --filter api test:terraform-apigw-ms7-t04` を実行するstepが存在する |

## 5. 実行コマンド

- `pnpm --filter api test:terraform-apigw-ms7-t04`

## 6. 完了条件

- TC-01〜TC-07 がすべて成功する。
- CI 上で同一コマンドが自動実行され、失敗時にPRをブロックできる。
