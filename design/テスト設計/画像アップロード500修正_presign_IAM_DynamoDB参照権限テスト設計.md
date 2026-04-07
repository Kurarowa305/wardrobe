# 画像アップロード500修正 presign IAM DynamoDB参照権限テスト設計

## 目的
- 画像アップロード時に利用する `presign` ドメインLambdaが、ワードローブ存在確認に必要な DynamoDB `GetItem` 権限を持つことを継続検証する。
- テストスクリプトが `apps/api/package.json` と `.github/workflows/ci.yml` に登録され、PRごとに自動実行されることを保証する。

## 対象
- `infra/terraform/app/iam.tf`
- `apps/api/scripts/check-presign-iam-dynamodb-read-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. presignドメインが DynamoDB 読み取り対象として明示されること
2. presignドメイン向けに `dynamodb:GetItem` が付与されること
3. 対象リソースがワードローブテーブル ARN に限定されること
4. テスト導線（package script / CI）が整備されていること

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| PID-01 | 読み取り対象の定義 | `iam.tf` を検査 | `lambda_dynamodb_read_only_domains` に `presign` が含まれる |
| PID-02 | 権限定義 | `iam.tf` を検査 | `contains(local.lambda_dynamodb_read_only_domains, each.key)` の dynamic statement が存在し、`dynamodb:GetItem` が定義される |
| PID-03 | リソース範囲 | `iam.tf` を検査 | `resources` に `aws_dynamodb_table.wardrobe.arn` が指定される |
| PID-04 | テスト導線 | `package.json` / `ci.yml` を検査 | `test:presign-iam-dynamodb-read` が scripts と CI の双方に登録される |

## 実行コマンド
- `pnpm --filter api test:presign-iam-dynamodb-read`
