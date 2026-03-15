# QueryKey定義テスト設計（MS0-T07）

## 目的

- MS0-T07（QueryKey 定義）の完了条件を継続的に検証する
- `queryKeys` の集約、命名規則、画面/機能コードでの直書き防止をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-query-keys-spec.mjs`
- 実行コマンド: `pnpm --filter web test:query-keys`

## テストケース

### QK-01 QueryKey 集約ファイルが src/api/queryKeys.ts に存在する
- 観点: 集約先の固定
- 期待結果: `apps/web/src/api/queryKeys.ts` が存在する

### QK-02 queryKeys がドメイン別（wardrobe/clothing/template/history/image）で定義される
- 観点: ドメイン単位でキーを追跡できるか
- 期待結果: `queryKeys` に `wardrobe` / `clothing` / `template` / `history` / `image` が定義されている

### QK-03 clothing query key に list/detail と invalidate 用スコープ（lists/details）がある
- 観点: 服関連の取得キーと invalidate 対象キーの分離
- 期待結果: `queryKeys.clothing` に `list` / `detail` / `lists` / `details` が定義されている

### QK-04 template query key に list/detail と invalidate 用スコープ（lists/details）がある
- 観点: テンプレート関連の取得キーと invalidate 対象キーの分離
- 期待結果: `queryKeys.template` に `list` / `detail` / `lists` / `details` が定義されている

### QK-05 history query key に list/detail と from/to を含むパラメータ正規化がある
- 観点: 履歴一覧の検索条件（from/to/order/limit/cursor）のキー揺れ防止
- 期待結果:
  - `queryKeys.history.list(...)` が `HistoryListParams` を受け取る
  - `from` / `to` を含めて正規化してキーに反映する

### QK-06 キー命名が [domain, wardrobeId, scope, ...] の階層で追えるように定義される
- 観点: invalidate 対象がキーから追える状態か
- 期待結果:
  - `domain + wardrobeId` のスコープ生成関数がある
  - `list` / `detail` などのスコープが階層的に構成される

### QK-07 画面/機能コードで queryKey/mutationKey の配列直書きをしない
- 観点: 画面側の直書きを防ぎ、`queryKeys` 集約ルールを維持できるか
- 期待結果: `src/api/queryKeys.ts` 以外で `queryKey: [...]` / `mutationKey: [...]` が存在しない

## CI適用

- `.github/workflows/ci.yml` に `Query keys spec test` を追加し、PR時に自動検証する
