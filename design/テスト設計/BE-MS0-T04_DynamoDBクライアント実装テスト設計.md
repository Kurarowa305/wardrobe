# BE-MS0-T04 DynamoDBクライアント実装テスト設計

## 目的
- `apps/api/src/clients/dynamodb.ts` が本番AWS / ローカルDynamoDB Localの両方を想定したクライアント設定を提供できることを確認する。
- BE-MS0-T04 の完了条件である `GetItem`, `PutItem`, `UpdateItem`, `Query`, `BatchGetItem`, `TransactWriteItems` の呼び出し口と endpoint 切替をCIで継続検証する。

## 対象
- `apps/api/src/clients/dynamodb.ts`
- `apps/api/scripts/check-dynamodb-client-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## 実行方法
- 実行コマンド: `pnpm --filter api test:dynamodb`
- 補助確認: `pnpm --filter api exec tsc --noEmit`
- 補助確認: `pnpm install --frozen-lockfile`

## テスト観点
1. 正常系: デフォルト設定で region / tableName の既定値を取得できる。
2. 切替: ローカルendpoint指定時に DynamoDB Local 向け endpoint / credentials に切り替わる。
3. 切替: 本番相当設定では region を保持し、ローカル固定 credentials を強制しない。
4. API面: 必要な6操作の呼び出しメソッドが公開されている。
5. 実装面: 必要なDynamoDB操作名とテーブル注入を伴うリクエスト組み立てが実装されている。
6. CI整合: テストスクリプトが package script と CI workflow に登録されている。

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| TD-01 | 正常系 | `createDynamoDbClientConfig()` を呼ぶ | `region=ap-northeast-1`, `tableName=WardrobeTable` が返る |
| TD-02 | endpoint切替 | `endpoint=http://localhost:8000` でクライアントを生成する | transport endpoint が localhost を向き、ローカル用 credentials が設定される |
| TD-03 | 本番設定 | `region=us-east-1` かつ endpoint 未指定でクライアントを生成する | region が維持され、ローカル固定 credentials は設定されない |
| TD-04 | API面 | 生成したクライアントを参照する | `getItem` / `putItem` / `updateItem` / `query` / `batchGetItem` / `transactWriteItems` が関数として公開される |
| TD-05 | 実装面 | `src/clients/dynamodb.ts` を参照する | `GetItem` / `PutItem` / `UpdateItem` / `Query` / `BatchGetItem` / `TransactWriteItems` の操作名と `TableName` 注入が実装されている |
| TD-06 | CI整合 | `apps/api/package.json` と `.github/workflows/ci.yml` を参照する | `pnpm --filter api test:dynamodb` が scripts / CI に追加されている |
