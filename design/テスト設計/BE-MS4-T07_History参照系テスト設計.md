# BE-MS4-T07 History 参照系 テスト設計

## 目的

- BE-MS4-T07（History 参照系テスト）の完了条件を継続的に検証する。
- repo / usecase / handler の観点で、履歴参照系（一覧・詳細）の仕様準拠を担保する。
- とくに `日付範囲`、`cursor整合`、`template入力 / combination入力` の両パターンを CI 上で自動検証する。

## 対象スクリプト

- `apps/api/scripts/check-history-ms4-t07-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-ms4-t07`

## テストケース

### HT07-01 repo.list が日付範囲・並び順・limit・cursor を Query に反映できる
- 観点: repository の検索条件整合
- 期待結果:
  - `from/to` が `DATE#<from>#` / `DATE#<to>#~` に変換される。
  - `order=asc` が `ScanIndexForward=true` に反映される。
  - `limit` と `exclusiveStartKey` が Query 入力に反映される。

### HT07-02 list usecase が cursor整合を維持しつつ template/combo の両パターンを返せる
- 観点: usecase の参照系組み立て
- 期待結果:
  - 正常な cursor で `exclusiveStartKey` が repo に渡る。
  - 一覧の `name` が template 入力時はテンプレート名、combination 入力時は `null` になる。
  - `INVALID_CURSOR` 条件（order 不一致）を検知できる。

### HT07-03 list/get handler が template/combo の両パターンを API 契約で返せる
- 観点: handler のレスポンス契約
- 期待結果:
  - `listHistoryHandler` が `200` と `items[]` を返し、`name` に string/null の両パターンを含む。
  - `getHistoryHandler` が template 入力 (`templateName` あり) / combination 入力 (`templateName` が `null`) の双方を返せる。
  - combination 側で削除済み服（`status: "DELETED"`）を含めても詳細レスポンスが成立する。

### HT07-04 配線（package.json / CI / テスト設計）が維持される
- 観点: 継続実行性
- 期待結果:
  - `test:history-ms4-t07` が `apps/api/package.json` と `.github/workflows/ci.yml` に登録されている。
  - 本テスト設計ファイルが参照されている。

## CI適用

- `.github/workflows/ci.yml` に `API history MS4-T07 aggregate spec test` を追加し、PR 時に自動検証する。
