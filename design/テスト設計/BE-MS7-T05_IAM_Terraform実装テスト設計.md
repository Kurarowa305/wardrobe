# BE-MS7-T05 IAM Terraform 実装テスト設計

## 1. 目的

- `infra/terraform/app/iam.tf` と `infra/terraform/app/lambda.tf` が BE-MS7-T05 の完了条件（Lambda execution role、presign が S3 権限に加えて DynamoDB read-only 権限を持ち、他 domain は DynamoDB 中心、CloudWatch Logs 権限あり）を満たすことを継続検証する。
- 専用テストスクリプトが `apps/api/package.json` と GitHub Actions CI (`.github/workflows/ci.yml`) に接続され、PRごとに自動実行されることを保証する。

## 2. 対象

- Terraform 定義: `infra/terraform/app/iam.tf`
- Terraform 定義: `infra/terraform/app/lambda.tf`
- テストスクリプト: `apps/api/scripts/check-terraform-iam-ms7-t05-spec.mjs`
- スクリプト登録: `apps/api/package.json`
- CI 登録: `.github/workflows/ci.yml`

## 3. 前提

- `pnpm install --frozen-lockfile` が成功していること。
- リポジトリルートでテストコマンドを実行できること。

## 4. テスト観点 / テストケース

| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | ドメインLambda用ロール作成 | `iam.tf` を検査 | `aws_iam_role.lambda_domain` が `for_each = local.lambda_domains` で定義される |
| TC-02 | Lambda と IAM ロールの紐付け | `lambda.tf` を検査 | `aws_lambda_function.domain` が `aws_iam_role.lambda_domain[each.key].arn` を参照する |
| TC-03 | CloudWatch Logs 権限 | `iam.tf` を検査 | domain policy に `logs:CreateLogGroup` / `logs:CreateLogStream` / `logs:PutLogEvents` が含まれる |
| TC-04 | 権限分離（presign vs その他） | `iam.tf` を検査 | `wardrobe` / `clothing` / `template` / `history` は DynamoDB 権限、`presign` は S3 権限 + DynamoDB read-only（GetItem）を持つ |
| TC-05 | テスト導線（package） | `apps/api/package.json` を検査 | `test:terraform-iam-ms7-t05` が定義され、`test` 集約スクリプトから呼び出される |
| TC-06 | テスト導線（CI） | `.github/workflows/ci.yml` を検査 | `pnpm --filter api test:terraform-iam-ms7-t05` を実行するstepが存在する |

## 5. 実行コマンド

- `pnpm --filter api test:terraform-iam-ms7-t05`

## 6. 完了条件

- TC-01〜TC-06 がすべて成功する。
- CI 上で同一コマンドが自動実行され、失敗時にPRをブロックできる。
