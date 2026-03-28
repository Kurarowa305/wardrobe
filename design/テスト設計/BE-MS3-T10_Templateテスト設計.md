# BE-MS3-T10 Template テスト設計

## 目的

- BE-MS3-T10（Template テスト）の完了条件を継続的に検証する
- repo / usecase / handler の連携で、テンプレート詳細・一覧・作成時バリデーションが仕様どおり成立することを担保する
- 特に `BatchGet` 補完、削除済み服の同梱、`duplicate clothingIds` の 409 変換をCIで自動検証する

## 対象スクリプト

- `apps/api/scripts/check-template-ms3-t10-spec.mjs`
- 実行コマンド: `pnpm --filter api test:template-ms3-t10`

## テストケース

### TT10-01 list usecase が BatchGet 補完を行い clothingIds 順序を保持できる
- 観点: 一覧レスポンスの欠損防止と並び順整合
- 期待結果: `list()` 実行時に `clothingBatchGetRepo.batchGetByIds()` が呼ばれ、`clothingItems` はテンプレートの `clothingIds` 順序（`cl_003 -> cl_001 -> cl_002`）で返る

### TT10-02 get usecase が削除済み服を status=DELETED で含められる
- 観点: 詳細APIの履歴互換性
- 期待結果: `get()` の `clothingItems` に削除済み服が残り、`status: "DELETED"` のまま返却される

### TT10-03 create handler が duplicate clothingIds を CONFLICT にし、Lambdaで409へ変換できる
- 観点: APIエラー契約（409）
- 期待結果: `createTemplateHandler()` が重複 `clothingIds` 入力で `CONFLICT` を返し、Lambda adapter 経由ではHTTP 409 + `error.code = "CONFLICT"` になる

### TT10-04 テスト配線（package.json / CI / テスト設計ファイル）が維持される
- 観点: 継続実行性
- 期待結果: `test:template-ms3-t10` スクリプトが `apps/api/package.json` と `.github/workflows/ci.yml` に登録され、設計ドキュメント参照も存在する

## CI適用

- `.github/workflows/ci.yml` に `API template MS3-T10 aggregate spec test` を追加し、PR時に自動検証する
