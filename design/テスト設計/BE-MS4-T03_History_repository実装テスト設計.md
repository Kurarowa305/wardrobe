# BE-MS4-T03 History repository 実装テスト設計

## 目的
- History repository が DB設計どおりに base key / `HistoryByDate` GSI を扱えることを確認する。
- `from/to/order/limit/cursor` を反映した日付順 Query を構築できることを確認する。
- 履歴削除が物理削除（TransactWriteItems の Delete）として構築されることを確認する。

## テスト対象
- `apps/api/src/domains/history/repo/historyRepo.ts`
- `apps/api/scripts/check-history-repo-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. `buildHistoryItem` が entity に `PK` / `SK` / `historyDateSk` を付与する。
2. `buildHistoryDateRange` がデフォルト範囲（`00000000`〜`99999999`）と、`from/to` 指定範囲の双方を生成できる。
3. `buildHistoryPartitionKey` が `W#<wardrobeId>#HIST` を返す。
4. `get` が base key への `ConsistentRead=true` の `GetItem` を構築する。
5. `list` が `HistoryByDate` に対して `PK + historyDateSk BETWEEN` を使い、`order/limit/exclusiveStartKey` を透過する。
6. `delete` が `attribute_exists(PK)` ガード付きの物理削除トランザクションを構築する。
7. `package.json` と CI に `test:history-repo` が追加されている。

## テストケース
| No. | 観点 | 入力/操作 | 期待結果 |
| --- | --- | --- | --- |
| 1 | item構築 | History entity を `buildHistoryItem` に渡す | `PK=W#...#HIST` / `SK=HIST#...` / `historyDateSk=DATE#<date>#<historyId>` |
| 2 | 日付範囲 | `buildHistoryDateRange({})` と `buildHistoryDateRange({ from, to })` | デフォルト範囲と指定範囲を正しく返す |
| 3 | パーティションキー | `buildHistoryPartitionKey({ wardrobeId })` | `W#<wardrobeId>#HIST` を返す |
| 4 | get | `get({ wardrobeId, historyId })` | `GetItem` / `ConsistentRead=true` |
| 5 | list | `list({ wardrobeId, from, to, order, limit, exclusiveStartKey })` | `Query(IndexName=HistoryByDate)` / `BETWEEN` / `ScanIndexForward` / `Limit` / 開始キーが反映される |
| 6 | delete | `delete({ wardrobeId, historyId })` | `TransactWriteItems` で Delete 1件、`ConditionExpression=attribute_exists(PK)` |
| 7 | CI連携 | `package.json` / `.github/workflows/ci.yml` を検査 | `test:history-repo` が npm script と CI に含まれる |

## 実行コマンド

```bash
pnpm --filter api test:history-repo
```

## CI適用
- GitHub Actions `CI` ワークフローに `API history repo spec test` を追加し、`pnpm --filter api test:history-repo` を実行する。
