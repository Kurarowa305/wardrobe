# BE-MS5-T02 history/stats_write keys テスト設計

## 目的

- BE-MS5-T02（`history/stats_write` の key helper 実装）の完了条件を継続検証する
- DB 設計どおりに `DATE#yyyymmdd` と clothing/template の daily counter key を生成できることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-stats-write-keys-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-stats-write-keys`

## テストケース

### HSWK-01 DATE#yyyymmdd 形式の sort key を生成できる
- 観点: 完了条件「`DATE#yyyymmdd` 等の生成」を満たすこと
- 期待結果:
  - `buildHistoryStatsDateKey({ date: "20260102" })` が `DATE#20260102` を返す

### HSWK-02 clothing daily counter の partition key を生成できる
- 観点: 服の日次カウンタ item を一意に指せる key を構築できるか
- 期待結果:
  - `buildWearDailyPartitionKey` が `W#<wardrobeId>#COUNT#CLOTH#<clothingId>` を返す

### HSWK-03 template daily counter の partition key を生成できる
- 観点: テンプレの日次カウンタ item を一意に指せる key を構築できるか
- 期待結果:
  - `buildWearDailyPartitionKey` が `W#<wardrobeId>#COUNT#TPL#<templateId>` を返す

### HSWK-04 daily counter key helper が PK/SK を組み立てられる
- 観点: 後続タスク（daily aggregation / transact builder）で再利用できる最小 helper になっているか
- 期待結果:
  - `buildWearDailyKey` が `PK` と `SK` を同時に返す
  - `SK` は `DATE#<date>` を使う

### HSWK-05 package script と CI 導線が維持される
- 観点: PR 上で自動検証される実行導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-stats-write-keys` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-stats-write-keys` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-stats-write-keys` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history stats_write keys spec test` を追加し、push 時に自動検証する
