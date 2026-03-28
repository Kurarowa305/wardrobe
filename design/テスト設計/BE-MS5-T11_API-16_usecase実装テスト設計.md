# BE-MS5-T11 API-16 usecase 実装テスト設計

## 目的

- BE-MS5-T11（API-16 usecase 実装）の完了条件を継続検証する
- 履歴削除時に `history取得 → delete transact 実行 → daily counter減算/削除 → lastWornAt再計算` が一貫して行われることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-ms5-api16-usecase-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-ms5-api16-usecase`

## テストケース

### HMS5API16-01 履歴削除トランザクションを1回で構築できる
- 観点: 完了条件「history取得後に delete transact を実行」を満たすか
- 期待結果:
  - `History Delete` を含むトランザクションを1回実行する

### HMS5API16-02 daily counter を減算し、0件になる場合はdaily itemを削除できる
- 観点: 完了条件「daily counter減算」「0件ならdaily item削除」を担保できるか
- 期待結果:
  - 残件がある対象は `count -= 1` の更新を行う
  - 残件が0になる対象は `Delete` を行う

### HMS5API16-03 wearCount 減算と lastWornAt 再計算を対象別に適用できる
- 観点: 完了条件「必要時 lastWornAt 再計算」の正当性
- 期待結果:
  - `wearCountDelta = -1` の統計更新を行う
  - 削除日が最新日の対象は WearDaily 降順Query結果で `lastWornAt` を更新する
  - 該当日が存在しない場合は `lastWornAt = 0` を設定する
  - 削除日が最新日でない対象は `lastWornAt` を維持する

### HMS5API16-04 履歴未存在を NOT_FOUND として扱える
- 観点: 履歴削除対象が存在しない異常系の扱い
- 期待結果:
  - 履歴取得結果が不正/空の場合 `NOT_FOUND` を送出する

### HMS5API16-05 package script と CI 導線が維持される
- 観点: PR上で自動検証される導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-ms5-api16-usecase` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-ms5-api16-usecase` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-ms5-api16-usecase` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history API-16 usecase spec test` を追加し、push 時に自動検証する
