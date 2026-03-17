# Template型定義テスト設計（MS3-T01）

## 目的

- MS3-T01（Template 型定義）の完了条件を継続的に検証する
- テンプレートに同梱される服配列（`clothingItems`）を含むDTO/VMの責務分離と変換ルールをCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-template-types-spec.mjs`
- 実行コマンド: `pnpm --filter web test:template-types`

## テストケース

### TT-01 template schema ファイルが src/api/schemas/template.ts に存在する
- 観点: APIレスポンス型の配置統一
- 期待結果: `apps/web/src/api/schemas/template.ts` が存在する

### TT-02 Template API DTO に status / order / params が定義される
- 観点: API-08（一覧）の並び順・ページング要件と状態管理を型で扱えるか
- 期待結果:
  - `TemplateStatusDto` が `ACTIVE | DELETED` で定義される
  - `TemplateListOrderDto` が `asc | desc` で定義される
  - `TemplateListParamsDto` が `order` / `limit` / `cursor` を持つ

### TT-03 Template 作成/更新リクエストDTOが clothingIds を配列で受ける
- 観点: API-09/API-11 の入力（`clothingIds[]`）を型安全に扱えるか
- 期待結果:
  - `CreateTemplateRequestDto` に `clothingIds: string[]` がある
  - `UpdateTemplateRequestDto` に `clothingIds?: string[]` がある

### TT-04 Template 一覧/詳細DTOが clothingItems の同梱データ配列を定義する
- 観点: MS3-T01完了条件「同梱データ配列を型で表現できる」を満たすか
- 期待結果:
  - 一覧DTOが `clothingItems: TemplateListClothingItemDto[]` を持つ
  - 詳細DTOが `clothingItems: TemplateDetailClothingItemDto[]` を持つ
  - 一覧レスポンスDTOに `items` / `nextCursor` が定義される

### TT-05 画面表示用VMが features/template/types.ts に定義される
- 観点: APIスキーマ層と画面表示層の責務分離
- 期待結果: `apps/web/src/features/template/types.ts` に `Template` / `TemplateListItem` / 同梱服VM型が定義される

### TT-06 Template VM は status を deleted に変換し、lastWornAt=0 を null に正規化する
- 観点: 画面側で削除済み表示・未着用表示を一貫して扱えるか
- 期待結果:
  - `toTemplate` で `status === "DELETED"` を `deleted` に変換する
  - `toTemplate` で `lastWornAt=0` を `null` に変換する

### TT-07 Template の同梱服VM（一覧/詳細）で clothingItems 配列を変換できる
- 観点: API同梱データを画面用VMへ変換する責務を型で担保できるか
- 期待結果:
  - `toTemplateListItem` が一覧同梱服変換を行う
  - `toTemplate` が詳細同梱服変換を行う
  - 同梱服の `status` から `deleted` を算出する

### TT-08 Template 詳細の同梱服VMで lastWornAt を null 許容に変換する
- 観点: 同梱服詳細の未着用値（0）をUIで扱いやすく正規化できるか
- 期待結果:
  - 同梱服VMの `lastWornAt` が `number | null`
  - 変換関数で `lastWornAt=0` を `null` にする

### TT-09 Template 一覧VMは clothingItems の deleted 判定に status を使う
- 観点: テンプレ一覧サムネで削除済み服を表示するための判定材料を保持できるか
- 期待結果:
  - 一覧同梱服変換で `status` から `deleted` を判定している

## CI適用

- `.github/workflows/ci.yml` に `Template types spec test` を追加し、PR時に自動検証する
