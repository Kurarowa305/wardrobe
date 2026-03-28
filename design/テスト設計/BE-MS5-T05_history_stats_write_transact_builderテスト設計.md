# BE-MS5-T05 history/stats_write transact builder テスト設計

## 目的

- BE-MS5-T05（`history/stats_write` の `TransactWriteItems` 組み立て実装）の完了条件を継続検証する
- 履歴 create/delete の双方で、wear daily 更新とキャッシュ更新のトランザクション項目が生成できることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-stats-write-transact-builder-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-stats-write-transact-builder`

## テストケース

### HSWT-01 create 用に wearDaily + cache 更新 items を組み立てられる
- 観点: 完了条件「create用 items を生成できる」を満たすこと
- 期待結果:
  - template/clothing の wearDaily キー (`W#...#COUNT#...`) が生成される
  - template/clothing のキャッシュ更新キー (`W#...#TPL`, `W#...#CLOTH`) が生成される

### HSWT-02 create 用 wearDaily の更新式が加算である
- 観点: 履歴追加時の daily counter 増分を表現できるか
- 期待結果:
  - `UpdateExpression` が `if_not_exists + :countDelta` で構成される
  - `:countDelta = 1` が渡される

### HSWT-03 delete 用に wearCount 減分 + lastWornAt 再計算値を反映できる
- 観点: 完了条件「delete用 items を生成できる」を満たすこと
- 期待結果:
  - cache 更新 item で `:wearCountDelta = -1`
  - 再計算済み `:lastWornAt` が反映される

### HSWT-04 recompute resolver 未指定時に明示的に失敗する
- 観点: delete 時の再計算依存を見落とさない安全性
- 期待結果:
  - `lastWornAt recompute result is required` を含む例外が発生する

### HSWT-05 package script と CI 導線が維持される
- 観点: PR 上で自動検証される実行導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-stats-write-transact-builder` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-stats-write-transact-builder` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-stats-write-transact-builder` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history stats_write transact builder spec test` を追加し、push 時に自動検証する
