# ワードローブ作成500修正 DynamoDB環境変数解決テスト設計

## 目的
- ワードローブ新規作成 API (`POST /wardrobes`) が、実行環境の DynamoDB テーブル名を正しく参照できることを検証する。
- `TABLE_NAME` 未参照による `500` 再発を防ぐ。

## 対象
- `apps/api/src/clients/dynamodb.ts`
- `apps/api/scripts/check-dynamodb-env-resolution-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. 既定値: 環境変数未設定時に既定設定で動作できる。
2. 環境変数反映: `AWS_REGION` / `DDB_ENDPOINT` / `TABLE_NAME` を設定へ反映できる。
3. 優先順位: 明示 override が環境変数より優先される。
4. 実リクエスト適用: 環境変数で解決した `TABLE_NAME` が `putItem` の送信コマンドへ反映される。
5. CI導線: 追加テストが package script と CI で継続実行される。

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| DER-01 | 既定値 | `AWS_REGION` / `DDB_ENDPOINT` / `TABLE_NAME` を未設定で `createDynamoDbClientConfig()` を呼ぶ | `region=ap-northeast-1`, `endpoint=undefined`, `tableName=WardrobeTable` |
| DER-02 | 環境変数反映 | `AWS_REGION=us-west-2`, `DDB_ENDPOINT=http://127.0.0.1:8001`, `TABLE_NAME=wardrobe-dev-WardrobeTable` を設定して `createDynamoDbClientConfig()` を呼ぶ | 各値が config に反映される |
| DER-03 | 優先順位 | DER-02 の環境変数を設定した状態で `createDynamoDbClientConfig({ region, endpoint, tableName })` を呼ぶ | override 値が採用される |
| DER-04 | リクエスト適用 | DER-02 の環境変数設定で `createDynamoDbClient(...).putItem(...)` を呼ぶ | 送信コマンドの `TableName` が `wardrobe-dev-WardrobeTable` になる |
| DER-05 | CI整合 | `apps/api/package.json` と `.github/workflows/ci.yml` を参照 | `pnpm --filter api test:dynamodb-env-resolution` が scripts / CI に登録される |

## 実行コマンド
- `pnpm --filter api test:dynamodb-env-resolution`
