# BE-MS7-T03 Lambda Terraform 実装テスト設計

## 1. 目的

- `infra/terraform/app/lambda.tf` に BE-MS7-T03 の完了条件（`wardrobe` / `clothing` / `template` / `history` / `presign` の domain別Lambda作成、命名規則準拠）が満たされる定義が存在することを継続検証する。
- 専用テストスクリプトが `apps/api/package.json` と GitHub Actions CI (`.github/workflows/ci.yml`) に接続され、PRごとに自動実行されることを保証する。

## 2. 対象

- Terraform 定義: `infra/terraform/app/lambda.tf`
- Terraform 変数: `infra/terraform/app/variables.tf`
- テストスクリプト: `apps/api/scripts/check-terraform-lambda-ms7-t03-spec.mjs`
- スクリプト登録: `apps/api/package.json`
- CI 登録: `.github/workflows/ci.yml`

## 3. 前提

- `pnpm install --frozen-lockfile` が成功していること。
- リポジトリルートでテストコマンドを実行できること。

## 4. テスト観点 / テストケース

| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | domain Lambda リソース定義 | `lambda.tf` を検査 | `aws_lambda_function.domain` が `for_each = local.lambda_domains` で定義される |
| TC-02 | 対象ドメイン網羅 | `lambda.tf` の `lambda_domains` を検査 | `wardrobe` / `clothing` / `template` / `history` / `presign` の5つが含まれる |
| TC-03 | 命名規則 | `lambda.tf` の名前生成式を検査 | `{app}-{env}-{domain}_server` 形式（`${var.lambda_app_name}-${var.env}-${domain}_server`）で定義される |
| TC-04 | handler 対応 | `lambda.tf` の handler map を検査 | 各ドメインが `entry/lambda/<domain>_server.handler` に紐づく |
| TC-05 | Log Group 分離 | `lambda.tf` を検査 | `aws_cloudwatch_log_group.lambda_domain` が定義される |
| TC-06 | テスト導線（package） | `apps/api/package.json` を検査 | `test:terraform-lambda-ms7-t03` が定義され、`test` 集約スクリプトから呼び出される |
| TC-07 | テスト導線（CI） | `.github/workflows/ci.yml` を検査 | `pnpm --filter api test:terraform-lambda-ms7-t03` を実行するstepが存在する |

## 5. 実行コマンド

- `pnpm --filter api test:terraform-lambda-ms7-t03`

## 6. 完了条件

- TC-01〜TC-07 がすべて成功する。
- CI 上で同一コマンドが自動実行され、失敗時にPRをブロックできる。
