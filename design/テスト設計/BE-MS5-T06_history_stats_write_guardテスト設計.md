# BE-MS5-T06 history/stats_write guard テスト設計

## 目的

- BE-MS5-T06（`history/stats_write` の `TransactWrite` 件数 guard 実装）の完了条件を継続検証する
- DynamoDB `TransactWriteItems` 上限 25 件の超過を事前に明示的失敗へ変換できることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-stats-write-guard-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-stats-write-guard`

## テストケース

### HSWG-01 上限値 25 が定数として公開される
- 観点: 上限値を実装内でハードコード散在させず再利用できるか
- 期待結果:
  - `HISTORY_STATS_WRITE_LIMIT === 25`

### HSWG-02 上限以内（25 件）は通過する
- 観点: 正常な create/delete 更新量を誤検知しないこと
- 期待結果:
  - `assertHistoryStatsWriteWithinLimit({ itemCount: 25 })` が例外を投げない

### HSWG-03 上限超過（26 件）は明示的に失敗する
- 観点: 完了条件「上限超過時に明示的に失敗できる」を満たすこと
- 期待結果:
  - `assertHistoryStatsWriteWithinLimit({ itemCount: 26 })` が `history stats write transact items exceed limit: 26 > 25` を含む例外を投げる

### HSWG-04 custom limit と items helper でも同じ防御を適用できる
- 観点: 呼び出し側の都合に応じた件数判定 API を提供できるか
- 期待結果:
  - `limit` 明示時に同形式の超過エラーが返る
  - `assertHistoryStatsWriteItemsWithinLimit(items)` でも `items.length` で同様に超過検知できる

### HSWG-05 package script と CI 導線が維持される
- 観点: PR 上で自動検証される実行導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-stats-write-guard` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-stats-write-guard` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-stats-write-guard` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history stats_write guard spec test` を追加し、push 時に自動検証する
