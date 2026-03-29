# BE-MS7-T07 CIデプロイ基盤 テスト設計

## 1. 目的

- `.github/workflows/terraform.yml` が、BE-MS7-T07 の完了条件（GitHub Actions で Terraform plan/apply、apply は CI のみ、concurrency 設定）を満たすことを継続検証する。
- Terraform の plan/apply が `master` マージ時（`push` to `master`）にのみ実行されることを保証する。
- 専用テストスクリプトが `apps/api/package.json` と GitHub Actions CI (`.github/workflows/ci.yml`) に接続され、PRごとに自動実行されることを保証する。

## 2. 対象

- Terraform Workflow: `.github/workflows/terraform.yml`
- テストスクリプト: `apps/api/scripts/check-terraform-ci-deploy-ms7-t07-spec.mjs`
- スクリプト登録: `apps/api/package.json`
- CI 登録: `.github/workflows/ci.yml`

## 3. 前提

- `pnpm install --frozen-lockfile` が成功していること。
- リポジトリルートでテストコマンドを実行できること。

## 4. テスト観点 / テストケース

| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | トリガー条件 | `terraform.yml` を検査 | `on.push.branches` が `master` で、`pull_request` / `workflow_dispatch` が存在しない |
| TC-02 | plan 実行 | `terraform.yml` を検査 | `plan` job が存在し、`terraform plan -var-file=../env/dev.tfvars` を実行する |
| TC-03 | apply 実行順序 | `terraform.yml` を検査 | `apply` job が存在し、`needs: plan` を持ち、`terraform apply -auto-approve -var-file=../env/dev.tfvars` を実行する |
| TC-04 | Lambda パッケージング導線 | `terraform.yml` を検査 | `plan` / `apply` job の両方で `bash infra/terraform/app/scripts/package-lambda.sh` を実行する |
| TC-05 | 排他制御 | `terraform.yml` を検査 | `apply` job に `concurrency.group=wardrobe-dev-terraform` と `cancel-in-progress=false` が設定される |
| TC-06 | テスト導線（package） | `apps/api/package.json` を検査 | `test:terraform-ci-deploy-ms7-t07` が定義され、`test` 集約スクリプトから呼び出される |
| TC-07 | テスト導線（CI） | `.github/workflows/ci.yml` を検査 | `pnpm --filter api test:terraform-ci-deploy-ms7-t07` を実行するstepが存在する |

## 5. 実行コマンド

- `pnpm --filter api test:terraform-ci-deploy-ms7-t07`

## 6. 完了条件

- TC-01〜TC-07 がすべて成功する。
- CI 上で同一コマンドが自動実行され、失敗時にPRをブロックできる。
