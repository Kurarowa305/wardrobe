# BE-MS5-T08 wearDailyQueryRepo テスト設計

## 目的

- BE-MS5-T08（wearDailyQueryRepo 実装）の完了条件を継続検証する
- `lastWornAt` 再計算で必要な「削除日より前の最新日を降順 Query で取得する」要件を CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-stats-write-wear-daily-query-repo-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-stats-write-wear-daily-query-repo`

## テストケース

### HSWQ-01 降順 Query の入力を正しく組み立てられる
- 観点: `beforeDate` より前の次点日を探索できるクエリ条件を repo が組み立てられるか
- 期待結果:
  - `KeyConditionExpression` が `#PK = :PK AND #SK < :beforeDateSk` になる
  - `:PK` が `W#<wardrobeId>#COUNT#<CLOTH|TPL>#<id>` になる
  - `:beforeDateSk` が `DATE#<yyyymmdd>` になる
  - `ScanIndexForward=false` かつ `Limit=1` になる

### HSWQ-02 Query 結果1件目から日付を取り出して返せる
- 観点: `DATE#yyyymmdd` 形式の SK を `recomputeLastWornAt` に渡せる `date` へ復元できるか
- 期待結果:
  - 先頭 item の SK が `DATE#20260105` のとき `{ date: "20260105" }` を返す

### HSWQ-03 該当データがない/形式不正でも安全に null を返せる
- 観点: 次点日が見つからないケースで `lastWornAt=0` へフォールバックできるか
- 期待結果:
  - `Items=[]` のとき `null` を返す
  - SK が `DATE#` 形式でないとき `null` を返す

### HSWQ-04 helper と CI 導線が維持される
- 観点: PR 上で自動検証される実行導線の担保
- 期待結果:
  - `wearDailyQueryRepo.ts` が `extractDateFromWearDailySk` と `createWearDailyQueryRepo` を export する
  - `apps/api/package.json` に `test:history-stats-write-wear-daily-query-repo` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-stats-write-wear-daily-query-repo` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-stats-write-wear-daily-query-repo` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history stats_write wearDaily query repo spec test` を追加し、push 時に自動検証する
