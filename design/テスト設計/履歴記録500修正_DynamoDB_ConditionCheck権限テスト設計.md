# 履歴記録500修正 DynamoDB ConditionCheck権限テスト設計

## 目的
- 履歴記録 API (`POST /wardrobes/{wardrobeId}/histories`) が `TransactWriteItems` 内で使う `ConditionCheck` に必要な IAM 権限 `dynamodb:ConditionCheckItem` を `history` ドメインLambdaが持つことを継続検証する。
- 履歴作成ユースケースの `ConditionCheck` 実装と Terraform の IAM 定義が乖離した場合に、CI で即座に検知できるようにする。

## 対象
- `apps/api/src/domains/history/usecases/createHistoryWithStatsWrite.ts`
- `infra/terraform/app/iam.tf`
- `apps/api/scripts/check-history-iam-condition-check-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. 履歴作成ユースケースが `TransactWriteItems` に参照先存在確認の `ConditionCheck` を含めること
2. 更新系ドメインLambda向け IAM ポリシーに `dynamodb:ConditionCheckItem` が含まれること
3. 追加テストが package script と CI に接続されること

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| HIC-01 | ユースケース実装 | `createHistoryWithStatsWrite.ts` を検査 | `buildReferenceConditionChecks` が存在し、`ConditionCheck` と `attribute_exists(PK)` を使って参照先存在確認を組み立てる |
| HIC-02 | IAM 権限 | `iam.tf` を検査 | DynamoDB 更新系アクションに `dynamodb:ConditionCheckItem` が含まれ、`wardrobe` / `clothing` / `template` / `history` 向けポリシーへ反映される |
| HIC-03 | CI導線 | `package.json` / `ci.yml` を検査 | `test:history-iam-condition-check` が scripts と CI の双方に登録される |

## 実行コマンド
- `pnpm --filter api test:history-iam-condition-check`
