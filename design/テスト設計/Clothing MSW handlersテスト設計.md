# Clothing MSW handlersテスト設計

## 目的
- 服一覧の `genre` / `limit` 処理、CRUDハンドラ、登録上限100件制御をCIで担保する
- cursor / nextCursor を廃止した一覧仕様をMSWに反映できているか検証する

## 対象スクリプト
- `apps/web/scripts/check-clothing-msw-handlers-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-msw-handlers`

## テストケース
### CM-01 Clothing handler が存在する
- 期待結果: `apps/web/src/mocks/handlers/clothing.ts` が存在する

### CM-02 GET/POST/PATCH/DELETE の CRUD と一覧取得を公開する
- 期待結果: 一覧/詳細/作成/更新/削除の各handlerが定義される

### CM-03 一覧 handler が genre/limit を受け取り cursor を使わず items を返す
- 期待結果:
  - `genre` と `limit` をクエリから読み取る
  - `cursor` / `nextCursor` を扱わない
  - 最大 `limit` 件の `items` を返す

### CM-04 詳細 handler が存在しない clothingId で 404 を返せる
- 期待結果: `NOT_FOUND` 相当の応答を返す

### CM-05 共通シナリオを適用する
- 期待結果: `applyMockScenario` を各handler冒頭で利用する

### CM-06 handlers 集約に clothingHandlers が追加される
- 期待結果: `src/mocks/handlers/index.ts` から集約される

### CM-07 create/update handler が genre を保存し、登録上限100件を超えない
- 期待結果:
  - create/update で genre を反映する
  - `MAX_CLOTHING_COUNT = 100` を定義する
  - 上限超過時に `CLOTHING_LIMIT_EXCEEDED` を返す

### CM-08 デモ遷移用 wardrobeId を許可する
- 期待結果: `DEMO_IDS.wardrobe` を許可する

## CI適用
- `.github/workflows/ci.yml` の `Clothing MSW handlers spec test` で自動検証する
