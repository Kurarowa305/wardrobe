# Template fixturesテスト設計（MS3-T02）

## 目的

- MS3-T02（Template fixtures）の完了条件を継続的に検証する
- テンプレ一覧とテンプレ詳細で同じ同梱服データを参照し、Clothing fixture と整合した状態をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-template-fixtures-spec.mjs`
- 実行コマンド: `pnpm --filter web test:template-fixtures`

## テストケース

### TF-01 Template fixture が src/mocks/fixtures/template.ts に存在する
- 観点: fixture 配置の固定化
- 期待結果: `apps/web/src/mocks/fixtures/template.ts` が存在する

### TF-02 Template fixture が一覧用/詳細用のデータを同一ファイルで定義している
- 観点: 一覧/詳細fixture管理の一元化
- 期待結果:
  - `templateDetailFixtures` が定義される
  - `templateListFixture` が定義される

### TF-03 Template fixture が Clothing fixture と同じ wardrobeId を参照する
- 観点: テンプレ/服のfixture参照先の一貫性
- 期待結果:
  - `CLOTHING_FIXTURE_WARDROBE_ID` を参照する
  - `TEMPLATE_FIXTURE_WARDROBE_ID` が同値で定義される

### TF-04 Template 詳細 fixture の同梱服データが clothing fixture の辞書から解決される
- 観点: 完了条件「服同梱の整合性」の担保
- 期待結果:
  - `clothingDetailFixtureById` を使って同梱服を解決する
  - `seed.clothingIds` から `clothingItems` を生成する

### TF-05 一覧 fixture は詳細 fixture から ACTIVE のみを抽出して作られる
- 観点: 完了条件「テンプレ一覧/詳細が同じ服データを参照」の担保
- 期待結果:
  - 一覧 `items` が `templateDetailFixtures` から生成される
  - `status === "ACTIVE"` のテンプレートのみ一覧に含まれる
  - `templateId` / `name` / `clothingItems` の各項目が詳細fixture由来でマッピングされる

### TF-06 fixture が削除済みテンプレート・削除済み服・画像なし服を含む
- 観点: 削除済みデータと画像有無の表示検証に必要なデータ網羅
- 期待結果:
  - `status: "DELETED"` のテンプレートを含む
  - 同梱服に `status: "DELETED"` の服を含む構成を持つ
  - 同梱服に `imageKey: null` の服を含む構成を持つ

### TF-07 詳細 fixture の ID 引き辞書が定義され、詳細取得で再利用できる
- 観点: 次タスク（MS3-T04）での詳細取得実装への再利用性
- 期待結果:
  - `templateDetailFixtureById` が定義される
  - `templateId` をキーとして詳細fixtureを参照できる

### TF-08 fixture に構成服が5件のテンプレートが含まれ、`+x` 表示検証に利用できる
- 観点: テンプレ一覧画面のサムネ上限4件 + `+x` 表示をfixtureで再現できること
- 期待結果:
  - 構成服5件の ACTIVE テンプレートが存在する
  - 画像あり/画像なし/削除済み服を含む複数サムネの表示検証に利用できる

### TF-09 templateDetailFixtures が合計30件（既存4件 + 追加26件）で構成される
- 観点: テンプレ一覧のページング・画面確認に必要な件数の固定化
- 期待結果:
  - `GENERATED_TEMPLATE_FIXTURE_COUNT = 26` が定義される
  - `templateDetailFixtureSeeds` が既存4件に加えて `Array.from` で26件を追加する

## CI適用

- `.github/workflows/ci.yml` に `Template fixtures spec test` を追加し、PR時に自動検証する
