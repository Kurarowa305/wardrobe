# Clothing MSW fixturesテスト設計（MS1-T02）

## 目的

- MS1-T02（Clothing MSW fixtures）の完了条件を継続的に検証する
- 服一覧と服詳細で同一fixtureを参照し、画像有無・削除済みデータを含むことをCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-fixtures-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-fixtures`

## テストケース

### CF-01 Clothing fixture が src/mocks/fixtures/clothing.ts に存在する
- 観点: fixture 配置の固定化
- 期待結果: `apps/web/src/mocks/fixtures/clothing.ts` が存在する

### CF-02 clothing fixture が一覧用/詳細用のデータを同一ファイルで定義している
- 観点: 完了条件「`fixtures/clothing.ts` にまとまっている」の担保
- 期待結果:
  - `clothingDetailFixtures` が定義される
  - `clothingListFixture` が定義される

### CF-03 一覧 fixture は詳細 fixture から ACTIVE のみを抽出して作られる
- 観点: 完了条件「一覧・詳細で矛盾しない」の担保
- 期待結果:
  - 一覧 `items` が `clothingDetailFixtures` から生成される
  - `status === "ACTIVE"` で抽出される
  - `clothingId` / `name` / `imageKey` が詳細と同じ値でマッピングされる

### CF-04 fixture が 画像あり/なし と 削除済みデータを含む
- 観点: 完了条件「画像あり/なし、削除済みを含む」の担保
- 期待結果:
  - `imageKey` が文字列のデータを含む
  - `imageKey: null` のデータを含む
  - `status: "DELETED"` のデータを含む

### CF-05 詳細 fixture の ID 引き辞書が定義され、詳細取得で再利用できる
- 観点: 次タスク（MS1-T04）での詳細取得処理への再利用性
- 期待結果:
  - `clothingDetailFixtureById` が定義される
  - `clothingId` をキーとして詳細fixtureを参照できる

### CF-06 clothingDetailFixtures が合計50件（既存3件 + 追加47件）で構成される
- 観点: 服一覧/ページング検証で十分な件数を固定化する
- 期待結果:
  - `GENERATED_CLOTHING_FIXTURE_COUNT = 47` が定義される
  - `clothingDetailFixtures` が既存3件に加えて `Array.from` で47件を追加する

## CI適用

- `.github/workflows/ci.yml` に `Clothing fixtures spec test` を追加し、PR時に自動検証する
