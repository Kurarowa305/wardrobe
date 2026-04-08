# BE-MS3-T05 template一覧配列クエリ許容テスト設計

## 背景
- テンプレート一覧 API (`GET /wardrobes/{wardrobeId}/templates`) で、実行環境やプロキシ設定によりクエリパラメータが配列形式（multi-value）で渡される場合がある。
- 既存実装は単一値の想定が強く、`order` / `limit` / `cursor` が配列で到着した際にバリデーションエラーとなり、一覧取得失敗につながるリスクがある。

## 目的
- handler 層で配列クエリを受け取っても先頭値で正規化し、既存仕様（単一値入力）と同等に一覧取得できることを担保する。

## 対象
- `apps/api/src/domains/template/handlers/listTemplateHandler.ts`
- `apps/api/scripts/check-template-list-handler-spec.mjs`

## テスト観点
1. **正常系（単一値）**
   - `order=desc`, `limit="2"` を与えると `limit` が数値化され、desc 順クエリとして usecase/repo に渡ること。
2. **正常系（配列値）**
   - `order=["asc","desc"]`, `limit=["3","9"]`, `cursor=["<valid>","..."]` を与えると、先頭要素のみ採用されること。
   - その結果、`scanIndexForward=true`・`limit=3`・`exclusiveStartKey` が利用されること。
3. **異常系**
   - `wardrobeId` 空白や `limit=0` は従来どおり `VALIDATION_ERROR` になること。

## 実行方法
- `pnpm --filter api run test:template-list-handler`

## 期待結果
- すべての観点が PASS し、テンプレート一覧 handler の後方互換（単一値）を維持したまま multi-value query を許容できる。
