# BE-MS7-T01 DynamoDB Terraform 実装テスト設計

## 1. 目的

- `infra/terraform/app/dynamodb.tf` に BE-MS7-T01 の完了条件（`PK/SK`、4つのGSI、`PITR`、on-demand）が満たされる定義が存在することを継続検証する。
- 専用テストスクリプトが `apps/api/package.json` と GitHub Actions CI (`.github/workflows/ci.yml`) に接続され、PRごとに自動実行されることを保証する。

## 2. 対象

- Terraform 定義: `infra/terraform/app/dynamodb.tf`
- テストスクリプト: `apps/api/scripts/check-terraform-dynamodb-ms7-t01-spec.mjs`
- スクリプト登録: `apps/api/package.json`
- CI 登録: `.github/workflows/ci.yml`

## 3. 前提

- `pnpm install --frozen-lockfile` が成功していること。
- リポジトリルートでテストコマンドを実行できること。

## 4. テスト観点 / テストケース

| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | テーブル主キー | `dynamodb.tf` を検査 | `hash_key = "PK"` と `range_key = "SK"` が定義される |
| TC-02 | GSI 数と名前 | `dynamodb.tf` の `global_secondary_index` を検査 | `StatusListByCreatedAt` / `StatusListByWearCount` / `StatusListByLastWornAt` / `HistoryByDate` の4件のみが存在する |
| TC-03 | GSI キー定義 | 各 GSI ブロックを検査 | DB設計どおりの `hash_key` と `range_key` が設定される |
| TC-04 | 課金モード | `dynamodb.tf` を検査 | `billing_mode = "PAY_PER_REQUEST"` が定義される |
| TC-05 | PITR | `dynamodb.tf` を検査 | `point_in_time_recovery { enabled = true }` が定義される |
| TC-06 | テスト導線（package） | `apps/api/package.json` を検査 | `test:terraform-dynamodb-ms7-t01` が定義され、`test` 集約スクリプトから呼び出される |
| TC-07 | テスト導線（CI） | `.github/workflows/ci.yml` を検査 | `pnpm --filter api test:terraform-dynamodb-ms7-t01` を実行するstepが存在する |

## 5. 実行コマンド

- `pnpm --filter api test:terraform-dynamodb-ms7-t01`

## 6. 完了条件

- TC-01〜TC-07 がすべて成功する。
- CI 上で同一コマンドが自動実行され、失敗時にPRをブロックできる。
