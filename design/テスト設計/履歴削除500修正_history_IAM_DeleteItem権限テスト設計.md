# 履歴削除500修正 history IAM DeleteItem権限テスト設計

## 目的
- 履歴削除 API (`DELETE /wardrobes/{wardrobeId}/histories/{historyId}`) を担当する `history` ドメインLambdaが、DynamoDB 物理削除に必要な `dynamodb:DeleteItem` 権限を持つことを継続検証する。
- Terraform の IAM 修正が `apps/api/package.json` と `.github/workflows/ci.yml` に接続された spec test で常時検知されることを保証する。

## 対象
- `infra/terraform/app/iam.tf`
- `apps/api/scripts/check-history-delete-iam-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. `history` ドメインが DynamoDB 書き込み対象として維持されること
2. 共通 Lambda policy と domain Lambda policy の両方に `dynamodb:DeleteItem` が含まれること
3. テスト導線（package script / CI / テスト設計書）が整備されること

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| HDI-01 | 書き込み対象ドメイン定義 | `iam.tf` を検査 | `lambda_dynamodb_domains` に `history` が含まれる |
| HDI-02 | 共通 Lambda policy | `iam.tf` を検査 | `data.aws_iam_policy_document.lambda_policy` の DynamoDB action 一覧に `dynamodb:DeleteItem` が含まれる |
| HDI-03 | domain Lambda policy | `iam.tf` を検査 | `lambda_dynamodb_domains` 向け dynamic statement の action 一覧に `dynamodb:DeleteItem` が含まれる |
| HDI-04 | テスト導線 | `package.json` / `ci.yml` / 本設計書を検査 | `test:history-delete-iam` が scripts と CI に登録され、本設計書が `check-history-delete-iam-spec.mjs` を参照する |

## 実行コマンド
- `pnpm --filter api test:history-delete-iam`
