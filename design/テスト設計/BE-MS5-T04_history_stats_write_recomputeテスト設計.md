# BE-MS5-T04 history/stats_write recompute テスト設計

## 目的

- BE-MS5-T04（`history/stats_write` の `lastWornAt` 再計算実装）の完了条件を継続検証する
- 履歴削除時に「最新日削除なら次点日へ更新 / 次点なしなら0」を判定できることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-stats-write-recompute-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-stats-write-recompute`

## テストケース

### HSWR-01 削除対象日が lastWornAt と不一致なら再計算しない
- 観点: 不要な Query を抑制し、キャッシュ値の不変ケースを安全に処理できるか
- 期待結果:
  - `recomputeLastWornAt` が `currentLastWornAt` をそのまま返す
  - `findLatestBeforeDate` が呼ばれない

### HSWR-02 最新日削除時に次点日へ再計算できる
- 観点: 完了条件「最新日削除時に次点日をQueryできる」を満たすこと
- 期待結果:
  - `recomputeLastWornAt` が `beforeDate=deletedDate` で検索を実行する
  - 検索結果の `yyyymmdd` を epoch ms に変換して返す

### HSWR-03 次点日がなければ 0 に落とせる
- 観点: 完了条件「なければ 0 に落とせる」を満たすこと
- 期待結果:
  - `findLatestBeforeDate` が `null` を返した場合、`recomputeLastWornAt` は `0` を返す

### HSWR-04 再計算 Query 用の日付キーを生成できる
- 観点: 降順 Query の開始点に使う `DATE#yyyymmdd` キーを helper で再利用できるか
- 期待結果:
  - `buildRecomputeCursor("20260107")` が `DATE#20260107` を返す

### HSWR-05 package script と CI 導線が維持される
- 観点: PR 上で自動検証される実行導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-stats-write-recompute` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-stats-write-recompute` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-stats-write-recompute` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history stats_write recompute spec test` を追加し、push 時に自動検証する
