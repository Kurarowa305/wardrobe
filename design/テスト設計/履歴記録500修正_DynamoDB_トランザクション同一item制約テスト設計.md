# 履歴記録500修正 DynamoDB トランザクション同一item制約テスト設計

## 目的
- 履歴記録 API (`POST /wardrobes/{wardrobeId}/histories`) が DynamoDB `TransactWriteItems` の「同一 item へ複数操作を含められない」制約に違反しないことを継続検証する。
- 参照先存在確認を `ConditionCheck` ではなく更新対象 item の `ConditionExpression` に集約し、実機 DynamoDB でのみ発生する 500 を CI で再発防止する。

## 対象
- `apps/api/src/domains/history/usecases/createHistoryWithStatsWrite.ts`
- `apps/api/scripts/check-history-create-dynamodb-transaction-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. 履歴作成トランザクションが `ConditionCheck` を含まないこと
2. `template` / `clothing` の存在確認を更新対象 item の `ConditionExpression=attribute_exists(PK)` で担保すること
3. 1回の `TransactWriteItems` 内で同一 `PK/SK` への複数操作が生成されないこと
4. 追加テストが package script と CI に接続されること

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| HTC-01 | template 記録 | `createHistoryWithStatsWrite.ts` で `templateId` 指定の履歴作成を組み立てる | `ConditionCheck` を含まず、`TPL#<templateId>` 更新に `ConditionExpression=attribute_exists(PK)` を持つ |
| HTC-02 | clothing 記録 | `createHistoryWithStatsWrite.ts` で `clothingIds[]` 指定の履歴作成を組み立てる | `ConditionCheck` を含まず、各 `CLOTH#<clothingId>` 更新に `ConditionExpression=attribute_exists(PK)` を持つ |
| HTC-03 | DynamoDB 制約 | template/clothing 両方のトランザクション item 一覧を検査する | 同一 `PK/SK` が2回以上出現しない |
| HTC-04 | ソース回帰 | `createHistoryWithStatsWrite.ts` のソースを検査する | `buildReferenceConditionChecks` と `ConditionCheck: {` が存在しない |
| HTC-05 | CI導線 | `package.json` / `ci.yml` を検査する | `test:history-create-dynamodb-transaction` が scripts と CI の双方に登録される |

## 実行コマンド
- `pnpm --filter api test:history-create-dynamodb-transaction`
