# BE-MS5-T03 history/stats_write daily aggregation テスト設計

## 目的

- BE-MS5-T03（`history/stats_write` の daily aggregation 実装）の完了条件を継続検証する
- 履歴 create/delete の双方で、daily counter と `wearCount` / `lastWornAt` 更新方針を表現できることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-stats-write-daily-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-stats-write-daily`

## テストケース

### HSWD-01 create 時に daily 集計対象を抽出できる
- 観点: テンプレ入力 + 服組合せ入力の双方を同じ集計フローで扱えるか
- 期待結果:
  - `resolveDailyStatsTargets` が template 1件 + clothing 複数件を返す
  - `clothingIds` の重複は除外される

### HSWD-02 create 時の daily counter 増分を表現できる
- 観点: 完了条件「create時の増分更新を表現できる」を満たすこと
- 期待結果:
  - `buildWearDailyFacts` が対象ごとに `count=1` を返す
  - `wardrobeId` と `date` が履歴事実から引き継がれる

### HSWD-03 delete 時の daily counter 減分を表現できる
- 観点: 完了条件「delete時の減分更新方針を表現できる」を満たすこと
- 期待結果:
  - `buildWearDailyFacts` が対象ごとに `count=-1` を返す
  - `templateId=null` の場合は clothing 対象のみを返す

### HSWD-04 create/delete の wearCount / lastWornAt 更新方針を表現できる
- 観点: AP-16/AP-17 のキャッシュ更新戦略を helper 出力に落とし込めるか
- 期待結果:
  - create: `wearCountDelta=1` かつ `lastWornAt.mode="max"`（`yyyymmdd` を epoch ms に変換）
  - delete: `wearCountDelta=-1` かつ `lastWornAt.mode="recompute"`

### HSWD-05 package script と CI 導線が維持される
- 観点: PR 上で自動検証される実行導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-stats-write-daily` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-stats-write-daily` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-stats-write-daily` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history stats_write daily aggregation spec test` を追加し、push 時に自動検証する
