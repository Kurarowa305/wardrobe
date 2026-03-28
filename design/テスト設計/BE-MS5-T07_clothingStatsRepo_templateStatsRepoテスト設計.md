# BE-MS5-T07 clothingStatsRepo / templateStatsRepo テスト設計

## 目的

- BE-MS5-T07（統計更新専用 repo 実装）の完了条件を継続検証する
- clothing/template の統計を usecase を経由せずに直接更新できることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-stats-write-stats-repo-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-stats-write-stats-repo`

## テストケース

### HSWR-01 clothing/template の sort key helper が統計インデックス値を生成できる
- 観点: `wearCountSk` / `lastWornAtSk` の生成を repo 側で完結できるか
- 期待結果:
  - clothing 用 helper が `WEAR#...` / `LASTWORN#...` を返す
  - template 用 helper が `WEAR#...` / `LASTWORN#...` を返す

### HSWR-02 clothingStatsRepo.updateStats が統計カラムを直接更新できる
- 観点: 完了条件「clothing usecase を呼ばずに統計更新できる」を満たすこと
- 期待結果:
  - base key（`W#...#CLOTH`, `CLOTH#...`）で `UpdateItem` する
  - `wearCount`, `lastWornAt`, `wearCountSk`, `lastWornAtSk` を同時更新する
  - `attribute_exists(PK)` で存在チェックする

### HSWR-03 templateStatsRepo.updateStats が統計カラムを直接更新できる
- 観点: 完了条件「template usecase を呼ばずに統計更新できる」を満たすこと
- 期待結果:
  - base key（`W#...#TPL`, `TPL#...`）で `UpdateItem` する
  - `wearCount`, `lastWornAt`, `wearCountSk`, `lastWornAtSk` を同時更新する
  - `attribute_exists(PK)` で存在チェックする

### HSWR-04 package script と CI 導線が維持される
- 観点: PR 上で自動検証される実行導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-stats-write-stats-repo` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-stats-write-stats-repo` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-stats-write-stats-repo` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history stats_write stats repo spec test` を追加し、push 時に自動検証する
