# BE-MS5-T01 history/stats_write 型定義テスト設計

## 目的

- BE-MS5-T01（`history/stats_write` の内部型定義）の完了条件を継続検証する
- 履歴作成・削除の両系統で再利用する共通入力型（`HistoryFact`）を CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-stats-write-types-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-stats-write-types`

## テストケース

### HSWT-01 stats write mode が create/delete の判別子として扱える
- 観点: 更新系（作成/削除）分岐を型で安全に判別できるか
- 期待結果:
  - `HistoryStatsWriteCommand` の `mode` に `"create"` を設定できる
  - `HistoryStatsWriteCommand` の `mode` に `"delete"` を設定できる

### HSWT-02 HistoryFact が create/delete 共通の履歴事実を保持できる
- 観点: 完了条件「create/delete の両方で使える共通型」の担保
- 期待結果:
  - `HistoryFact` が `wardrobeId` / `historyId` / `date` / `templateId` / `clothingIds` / `createdAt` を保持する
  - テンプレ入力（`templateId` あり）と組み合わせ入力（`templateId: null`）の両方を同一構造で扱える

### HSWT-03 wear daily 集計の内部型が対象・日付・件数を表現できる
- 観点: 後続タスク（daily 集計・recompute）で必要な基礎情報が型として揃っているか
- 期待結果:
  - `WearDailyFact` が `target.kind` / `target.id` / `date` / `count` を保持する
  - `target.kind` は `clothing` / `template` を表現できる

### HSWT-04 型定義ファイルの export が維持される
- 観点: 後続タスクから参照する公開型の破壊検知
- 期待結果:
  - `types.ts` に `StatsWriteMode` / `HistoryFact` / `HistoryStatsWriteCommand` / `WearDailyFact` の export がある

### HSWT-05 package script と CI 導線が維持される
- 観点: PR 上で自動検証される実行導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-stats-write-types` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-stats-write-types` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-stats-write-types` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history stats_write types spec test` を追加し、push 時に自動検証する
