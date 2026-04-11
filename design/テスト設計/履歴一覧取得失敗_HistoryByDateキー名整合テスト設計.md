# 履歴一覧取得失敗_HistoryByDateキー名整合 テスト設計

## 1. 背景

- 履歴一覧 API は `HistoryByDate` GSI を利用する。
- 実装側が `dateSk`、Terraform 側が `historyDateSk` を参照すると、DynamoDB Query が `Query condition missed key schema element` で失敗する。
- 実装テストと Terraform テストが別々に通っても、両者の整合が崩れていると本番で 500 になる。

## 2. 目的

- 履歴ドメイン実装と Terraform の `HistoryByDate` GSI 定義が、同じキー名 `historyDateSk` を前提としていることを CI で担保する。
- 履歴作成時の保存キー、一覧 Query 条件、cursor、Terraform 定義の取り違えを単一テストで検出できるようにする。

## 3. 対象

- `apps/api/src/domains/history/repo/historyKeys.ts`
- `apps/api/src/domains/history/repo/historyRepo.ts`
- `apps/api/src/domains/history/usecases/historyUsecase.ts`
- `infra/terraform/app/dynamodb.tf`
- `apps/api/scripts/check-history-date-gsi-alignment-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## 4. テスト観点

1. `buildHistoryItem` が `historyDateSk` を付与すること
2. `HistoryByDate` Query が `historyDateSk BETWEEN` を使うこと
3. 一覧 cursor の position / decode 渡し替えが `historyDateSk` を使うこと
4. Terraform の `HistoryByDate` GSI range key が `historyDateSk` であること
5. テストスクリプトが package.json / CI に登録されていること

## 5. テストケース

### TC-01: 履歴 item が `historyDateSk` を保持する
- 入力/条件: `date=20260105`, `historyId=hs_001` の履歴 entity を `buildHistoryItem` に渡す
- 確認内容:
  - `PK = W#wd_001#HIST`
  - `SK = HIST#hs_001`
  - `historyDateSk = DATE#20260105#hs_001`
- 期待結果: 履歴作成時に GSI 用キーが `historyDateSk` で保存される

### TC-02: repository.list が `historyDateSk` を Query に使う
- 入力/条件: `createHistoryRepo().list({ from, to, order, limit, exclusiveStartKey })`
- 確認内容:
  - `KeyConditionExpression` が `#historyDateSk BETWEEN :fromDateSk AND :toDateSk`
  - `ExpressionAttributeNames["#historyDateSk"] = "historyDateSk"`
  - `ExclusiveStartKey.historyDateSk` が透過される
- 期待結果: Terraform の `HistoryByDate` 定義と一致した Query を構築できる

### TC-03: usecase cursor が `historyDateSk` を保持する
- 入力/条件: `history-list` cursor を encode して `usecase.list` に渡す
- 確認内容:
  - decode 後の `exclusiveStartKey.historyDateSk` が repo に渡る
  - usecase 実装が `historyDateSk` を必須キーとして扱う
- 期待結果: ページング時にもキー名不整合が起きない

### TC-04: Terraform の `HistoryByDate` GSI が `historyDateSk` を range key に持つ
- 入力/条件: 最新の `infra/terraform/app/dynamodb.tf` を読み込む
- 確認内容:
  - `HistoryByDate` の `range_key = "historyDateSk"`
- 期待結果: アプリ実装とインフラ定義が一致している

### TC-05: package.json / CI 配線が維持される
- 入力/条件: 最新の `apps/api/package.json` と `.github/workflows/ci.yml` を読み込む
- 確認内容:
  - `test:history-date-gsi-alignment` が scripts に存在する
  - CI に `pnpm --filter api test:history-date-gsi-alignment` が登録されている
- 期待結果: PR ごとに自動で回帰検知できる

## 6. 実行コマンド

```bash
pnpm --filter api test:history-date-gsi-alignment
```

## 7. CI適用

- GitHub Actions `CI` ワークフローに `API history date GSI alignment spec test` を追加し、上記コマンドを実行する。
