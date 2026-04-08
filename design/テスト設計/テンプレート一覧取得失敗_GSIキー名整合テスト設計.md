# テンプレート一覧取得失敗_GSIキー名整合 テスト設計

## 1. 背景

- テンプレート一覧 API は `StatusListByCreatedAt` / `StatusListByWearCount` / `StatusListByLastWornAt` を利用する。
- API 実装は GSI のソートキー属性として `createdAtSk` / `wearCountSk` / `lastWornAtSk` を前提としている。
- Terraform 側のキー名不整合があると、一覧取得時の結果不整合（0件化・ページング不安定）の原因になる。

## 2. 目的

- インフラ定義の GSI ソートキーが API 実装前提と一致していることを CI で担保する。
- 既存の DynamoDB Terraform 検証テストに回帰防止観点を追加し、キー名の取り違えを検出できるようにする。

## 3. 対象

- `infra/terraform/app/dynamodb.tf`
- `apps/api/scripts/check-terraform-dynamodb-ms7-t01-spec.mjs`
- `apps/api/scripts/check-terraform-dynamodb-ms7-t08-spec.mjs`

## 4. テスト観点

1. `StatusListByCreatedAt` の range key が `createdAtSk` であること
2. `StatusListByWearCount` の range key が `wearCountSk` であること
3. `StatusListByLastWornAt` の range key が `lastWornAtSk` であること
4. `HistoryByDate` など既存の他 GSI 要件が維持されること
5. テストスクリプトが package.json / CI から実行されること

## 5. テストケース

### TC-01: DynamoDB 基本 GSI 定義の整合（MS7-T01）
- **入力/条件**: 最新の `infra/terraform/app/dynamodb.tf` を読み込む
- **確認内容**:
  - 3つの一覧 GSI が `createdAtSk` / `wearCountSk` / `lastWornAtSk` を利用
  - `HistoryByDate` を含む必須 GSI が存在
- **期待結果**: `pnpm --filter api test:terraform-dynamodb-ms7-t01` が成功する

### TC-02: status+genre 追加観点を含む GSI 定義の整合（MS7-T08）
- **入力/条件**: 最新の `infra/terraform/app/dynamodb.tf` を読み込む
- **確認内容**:
  - `StatusGenreListByCreatedAt` が維持される
  - 既存3つの一覧 GSI の range key が `createdAtSk` / `wearCountSk` / `lastWornAtSk`
- **期待結果**: `pnpm --filter api test:terraform-dynamodb-ms7-t08` が成功する

## 6. 実行コマンド（CI適用）

```bash
pnpm --filter api test:terraform-dynamodb-ms7-t01
pnpm --filter api test:terraform-dynamodb-ms7-t08
```

## 7. リスクとフォローアップ

- 既存データが旧キー名で運用されている環境では、Terraform 更新後にデータ再作成/バックフィルが必要になる可能性がある。
- 本テストは「定義整合」の担保であり、実データ移行可否は別途運用手順で確認する。
