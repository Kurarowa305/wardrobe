# BE-MS5-T09 API-14 usecase 実装テスト設計

## 目的

- BE-MS5-T09（API-14 usecase 実装）の完了条件を継続検証する
- 履歴作成時に `history作成 + daily counter更新 + wearCount更新 + lastWornAt更新` を同一トランザクションで実行することを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-ms5-api14-usecase-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-ms5-api14-usecase`

## テストケース

### HMS5API14-01 `templateId` と `clothingIds` の同時指定を拒否できる
- 観点: 完了条件「`templateId` と `clothingIds` は同時指定不可」を usecase 側で担保できるか
- 期待結果:
  - 同時指定時に `CONFLICT` を送出する

### HMS5API14-02 `clothingIds` の重複指定を拒否できる
- 観点: 同一統計対象の二重加算を防ぐ
- 期待結果:
  - `clothingIds` に重複がある場合 `CONFLICT` を送出する

### HMS5API14-03 template入力の作成トランザクションを1回で構築できる
- 観点: 履歴作成と統計更新の同一トランザクション化
- 期待結果:
  - `history Put` を含む
  - `ConditionCheck` を使わない
  - `template` 更新の `ConditionExpression=attribute_exists(PK)` で存在確認を兼ねる
  - 同一 `PK/SK` への複数操作を含まない
  - `wearDaily` 更新 + 統計キャッシュ更新（`wearCount` / `lastWornAt`）を含む

### HMS5API14-04 clothing入力の作成トランザクションを1回で構築できる
- 観点: templateなし入力でも同様に同一トランザクションで処理できるか
- 期待結果:
  - `history Put` を含む
  - `ConditionCheck` を使わない
  - 各 `clothing` 更新の `ConditionExpression=attribute_exists(PK)` で存在確認を兼ねる
  - 同一 `PK/SK` への複数操作を含まない
  - `wearDaily` 更新 + 統計キャッシュ更新（`wearCount` / `lastWornAt`）を含む


### HMS5API14-06 template 不在時に `NOT_FOUND` を返せる
- 観点: template 解決時の参照整合
- 期待結果:
  - `templateId` 指定時に template が取得できない場合 `NOT_FOUND` を送出する

### HMS5API14-07 template 不正時（`clothingIds` 空配列など）に `VALIDATION_ERROR` を返せる
- 観点: template 由来データの入力保証
- 期待結果:
  - template の `clothingIds` が空配列または不正値の場合 `VALIDATION_ERROR` を送出する

### HMS5API14-08 template入力時に history/clothing 更新へ template 由来 `clothingIds` を反映できる
- 観点: template 作成フローが template 自体と配下 clothing の統計更新を同時に行う
- 期待結果:
  - history Put の `Item.clothingIds` に template 由来 ID 群が入る（空配列ではない）
  - transact に `SK=CLOTH#...` の clothing 更新が含まれる

### HMS5API14-05 package script と CI 導線が維持される
- 観点: PR 上で自動検証される導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-ms5-api14-usecase` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-ms5-api14-usecase` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-ms5-api14-usecase` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history API-14 usecase spec test` を追加し、push 時に自動検証する
