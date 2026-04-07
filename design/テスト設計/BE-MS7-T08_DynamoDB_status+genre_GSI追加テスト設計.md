# BE-MS7-T08 DynamoDB status+genre GSI 追加テスト設計

## 目的
- `infra/terraform/app/dynamodb.tf` に `StatusGenreListByCreatedAt` が追加され、DB設計どおりのキー定義で作成されることを継続検証する。
- 追加GSIの検証スクリプトが package/CI に組み込まれ、PRごとに自動実行されることを保証する。

## 対象
- Terraform 定義: `infra/terraform/app/dynamodb.tf`
- テストスクリプト: `apps/api/scripts/check-terraform-dynamodb-ms7-t08-spec.mjs`
- スクリプト登録: `apps/api/package.json`
- CI登録: `.github/workflows/ci.yml`

## テスト観点 / テストケース
| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TG-01 | 追加GSIの存在 | `dynamodb.tf` を検査 | `StatusGenreListByCreatedAt` が1件存在する |
| TG-02 | 追加GSIのキー定義 | 同上 | `hash_key=statusGenreListPk` / `range_key=createdAtSk` |
| TG-03 | 既存GSIとの共存 | 同上 | 既存4 GSI（`StatusListByCreatedAt` / `StatusListByWearCount` / `StatusListByLastWornAt` / `HistoryByDate`）が維持される |
| TG-04 | テスト導線（package） | `apps/api/package.json` | `test:terraform-dynamodb-ms7-t08` が定義される |
| TG-05 | テスト導線（CI） | `.github/workflows/ci.yml` | `pnpm --filter api test:terraform-dynamodb-ms7-t08` を実行する step が存在する |

## 実行コマンド
```bash
pnpm --filter api test:terraform-dynamodb-ms7-t08
```

## 完了条件
- TG-01〜TG-05 がすべて成功する。
- CI 上で同一コマンドが自動実行される。
