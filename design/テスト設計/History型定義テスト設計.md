# History型定義テスト設計（MS4-T01）

## 目的

- MS4-T01（History 型定義）の完了条件を継続的に検証する
- 履歴APIのDTOと画面表示用VMの責務分離、および履歴特有の入力種別・同梱服の変換ルールをCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-history-types-spec.mjs`
- 実行コマンド: `pnpm --filter web test:history-types`

## テストケース

### HT-01 history schema ファイルが src/api/schemas/history.ts に存在する
- 観点: APIレスポンス型の配置統一
- 期待結果: `apps/web/src/api/schemas/history.ts` が存在する

### HT-02 History API DTO に一覧条件と並び順が定義される
- 観点: API-13（履歴一覧）の期間条件・並び順・ページング要件を型で扱えるか
- 期待結果:
  - `HistoryListOrderDto` が `asc | desc` で定義される
  - `HistoryListParamsDto` が `from` / `to` / `order` / `limit` / `cursor` を持つ

### HT-03 History 作成リクエストDTOが templateId と clothingIds の排他的入力を表現する
- 観点: API-14 の「テンプレート入力」と「組み合わせ入力」の排他制約を型で表現できるか
- 期待結果:
  - `CreateHistoryRequestDto` が union type で定義される
  - テンプレート入力時は `templateId` を必須、`clothingIds` を禁止する
  - 組み合わせ入力時は `clothingIds` を必須、`templateId` を禁止する

### HT-04 History 一覧/詳細DTOが服同梱データとレスポンスDTOを定義する
- 観点: API-13/API-15 のレスポンス形状差分を型で区別できるか
- 期待結果:
  - 一覧同梱服DTOが `clothingId` / `name` / `imageKey` / `status` を持つ
  - 詳細同梱服DTOが `wearCount` / `lastWornAt` を追加で持つ
  - 一覧レスポンスDTOに `items` / `nextCursor` がある
  - 詳細レスポンスDTOが `HistoryDto` として定義される

### HT-05 画面表示用VMが features/history/types.ts に定義される
- 観点: APIスキーマ層と画面表示層の責務分離
- 期待結果: `apps/web/src/features/history/types.ts` に `History` / `HistoryListItem` / 同梱服VM型が定義される

### HT-06 History VM は入力種別を templateName/name の有無から導出する
- 観点: 履歴画面でテンプレート入力と組み合わせ入力を文脈表示できるか
- 期待結果:
  - `HistoryInputType` が `template | combination` で定義される
  - 一覧は `name`、詳細は `templateName` の有無から `inputType` を導出する

### HT-07 History の同梱服VM（一覧/詳細）で deleted と lastWornAt 正規化を扱える
- 観点: 履歴で削除済み服と未着用日時を一貫表示できるか
- 期待結果:
  - 同梱服VMで `status === "DELETED"` を `deleted` に変換する
  - 詳細同梱服VMで `lastWornAt=0` を `null` に正規化する
  - 一覧/詳細とも `clothingItems` をVMへ変換する

### HT-08 履歴一覧VMがテンプレ名のない組み合わせ入力でも name を null のまま保持する
- 観点: 組み合わせ入力時にテンプレ名を捏造せず、UI側で空表示方針を判断できるか
- 期待結果:
  - `HistoryListItem.name` が `string | null`
  - `toHistoryListItem` が DTO の `name` をそのまま保持する

## CI適用

- `.github/workflows/ci.yml` に `History types spec test` を追加し、PR時に自動検証する
