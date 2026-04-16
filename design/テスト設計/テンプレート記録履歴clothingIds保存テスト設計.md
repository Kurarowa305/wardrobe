# テンプレート記録履歴 clothingIds 保存テスト設計

## 目的

- テンプレート記録時に、履歴へテンプレートの `clothingIds` スナップショットが順序保持で保存されることを継続検証する。
- 履歴一覧サムネイル補完と履歴詳細の服情報解決に必要な `clothingIds` が、作成時点で欠落しないことを CI で担保する。

## 対象

- `apps/api/src/domains/history/usecases/createHistoryWithStatsWrite.ts`
- `apps/api/scripts/check-history-template-record-clothing-ids-spec.mjs`

## テスト観点

### 1. テンプレート記録の履歴スナップショット

- `templateId` 指定の履歴作成時に `getTemplate` でテンプレートを取得する。
- 履歴 `Put.Item.clothingIds` にテンプレートの `clothingIds` が元の順序で入る。
- template 向け更新だけでなく、同じ `clothingIds` を使った clothing 向け `wearDaily` / `wearCount` / `lastWornAt` 更新が組まれる。

### 2. 異常系

- 参照テンプレートが取得できない場合、`NOT_FOUND` を返して `transactWriteItems` を実行しない。
- テンプレート取得結果に `clothingIds` が存在しない、または不正な場合、`INTERNAL_ERROR` を返して `transactWriteItems` を実行しない。

### 3. 導線

- `apps/api/package.json` に `test:history-template-record-clothing-ids` が定義される。
- `.github/workflows/ci.yml` に `pnpm --filter api test:history-template-record-clothing-ids` が追加される。

## テストスクリプト

- `apps/api/scripts/check-history-template-record-clothing-ids-spec.mjs`

## 実行コマンド

- `pnpm --filter api test:history-template-record-clothing-ids`

## CI適用

- `.github/workflows/ci.yml` にテンプレート記録履歴 `clothingIds` 保存検証の step を追加し、push 時に自動実行する。
