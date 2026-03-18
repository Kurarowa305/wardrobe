# MS4-T02 History fixturesテスト設計

## 目的

- MS4-T02（History fixtures）の完了条件を継続的に検証する
- 履歴fixtureが Template fixture / Clothing fixture と同じデータソースを参照し、テンプレ入力・組み合わせ入力の双方で同梱服の整合をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-history-fixtures-spec.mjs`
- 実行コマンド: `pnpm --filter web test:history-fixtures`

## テストケース

### HF-01 History fixture が src/mocks/fixtures/history.ts に存在する
- 観点: fixture 配置の固定化
- 期待結果: `apps/web/src/mocks/fixtures/history.ts` が存在する

### HF-02 History fixture が一覧用/詳細用のデータを同一ファイルで定義している
- 観点: 一覧/詳細fixture管理の一元化
- 期待結果:
  - `historyDetailFixtures` が定義される
  - `historyListFixture` が定義される

### HF-03 History fixture が Template fixture と同じ wardrobeId を参照する
- 観点: 履歴/テンプレ/服のfixture参照先の一貫性
- 期待結果:
  - `TEMPLATE_FIXTURE_WARDROBE_ID` を参照する
  - `HISTORY_FIXTURE_WARDROBE_ID` が同値で定義される

### HF-04 テンプレ入力の履歴詳細 fixture は template fixture の同梱服データを再利用する
- 観点: 完了条件「テンプレ同梱の整合性」の担保
- 期待結果:
  - `templateDetailFixtureById` を使ってテンプレートを解決する
  - `templateFixture.name` を `templateName` に設定する
  - `templateFixture.clothingItems` を複製して `clothingItems` に設定する

### HF-05 組み合わせ入力の履歴詳細 fixture は clothing fixture の辞書から服詳細を解決する
- 観点: 完了条件「服同梱の整合性」の担保
- 期待結果:
  - `clothingDetailFixtureById` を使って服を解決する
  - `seed.clothingIds` から `clothingItems` を生成する

### HF-06 一覧 fixture は詳細 fixture から historyId/date/name/clothingItems を射影して作られる
- 観点: 完了条件「履歴一覧/詳細が同じ同梱服データを参照」の担保
- 期待結果:
  - 一覧 `items` が `historyDetailFixtures` から生成される
  - `historyId` / `date` / `name` / `clothingItems` の各項目が詳細fixture由来でマッピングされる
  - 一覧の服項目に `status` が残る

### HF-07 fixture がテンプレ入力・組み合わせ入力・削除済み服を含む
- 観点: 画面表示とMSW handler検証に必要なデータ網羅
- 期待結果:
  - テンプレ入力の履歴を含む
  - 組み合わせ入力の履歴を含む
  - 削除済みテンプレート由来または削除済み服を含む履歴を含む

### HF-08 詳細 fixture の ID 引き辞書が定義され、詳細取得で再利用できる
- 観点: 次タスク（MS4-T04）での詳細取得/削除実装への再利用性
- 期待結果:
  - `historyDetailFixtureById` が定義される
  - `historyId` をキーとして詳細fixtureを参照できる

### HF-09 historyDetailFixtures が合計27件（既存3件 + 追加24件）で構成される
- 観点: 履歴一覧のスクロールやページング検証に必要な件数の固定化
- 期待結果:
  - `GENERATED_HISTORY_FIXTURE_COUNT = 24` が定義される
  - `historyDetailFixtureSeeds` が既存3件に加えて `Array.from` で24件を追加する

## CI適用

- `.github/workflows/ci.yml` に `History fixtures spec test` を追加し、push時に自動検証する
