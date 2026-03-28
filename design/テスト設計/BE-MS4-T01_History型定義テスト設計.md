# BE-MS4-T01 History型定義テスト設計

## 目的

- BE-MS4-T01（History entity / dto / schema 定義）の完了条件を継続検証する
- API-13 / API-14 / API-15 で利用する History ドメイン型の整合性を CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-schema-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-schema`

## テストケース

### HS-01 history schema / dto / entity ファイルが所定パスに存在する
- 観点: ドメイン構造の配置統一
- 期待結果:
  - `apps/api/src/domains/history/schema/historySchema.ts` が存在する
  - `apps/api/src/domains/history/dto/historyDto.ts` が存在する
  - `apps/api/src/domains/history/entities/history.ts` が存在する

### HS-02 History schema が一覧条件と入力上限を定義する
- 観点: API-13 の一覧要件（期間・並び順・limit・cursor）を型で扱えるか
- 期待結果:
  - `historyListOrderValues` が `asc | desc` を持つ
  - `historyListParamsSchema` が `from` / `to` / `order` / `limit` / `cursor` を持つ
  - `historyListLimitMax` が 30、`historyClothingIdsMax` が 4 として定義される

### HS-03 履歴作成リクエストが templateId と clothingIds の排他入力を表現する
- 観点: API-14 の入力制約を schema で検証できるか
- 期待結果:
  - `createHistoryRequestSchema` が union type である
  - テンプレート入力（`templateId`）と組み合わせ入力（`clothingIds`）の同時指定が失敗する

### HS-04 一覧/詳細レスポンス schema が同梱服フィールド差分を表現する
- 観点: API-13 / API-15 で必要な服同梱データ差分を保持できるか
- 期待結果:
  - 一覧同梱服に `clothingId` / `name` / `genre` / `imageKey` / `status` が含まれる
  - 詳細同梱服に `wearCount` / `lastWornAt` が追加される
  - 一覧レスポンスに `items` / `nextCursor` が含まれる

### HS-05 History entity が内部型の最小要件を満たす
- 観点: BE-MS4-T01 完了条件（`date`, `templateId|null`, `clothingIds`, `createdAt`）を保持できるか
- 期待結果:
  - `historyEntitySchema` が上記4項目を含む
  - `createHistoryEntity` が `HistoryEntity` を生成できる

### HS-06 DTO alias と CI 導線が維持される
- 観点: 型公開面と継続実行導線の担保
- 期待結果:
  - `historyDto.ts` に `HistoryListOrderDto` / `CreateHistoryRequestDto` / `HistoryDetailResponseDto` が定義される
  - `apps/api/package.json` に `test:history-schema` が定義される
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-schema` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API history schema spec test` を追加し、PR時に自動検証する
