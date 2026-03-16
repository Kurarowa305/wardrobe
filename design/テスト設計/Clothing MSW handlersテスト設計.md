# Clothing MSW handlersテスト設計（MS1-T04）

## 目的

- MS1-T04（Clothing MSW handlers）の完了条件を継続的に検証する
- 服一覧のページング（`limit` / `cursor` / `nextCursor`）とCRUDハンドラの存在をCIで担保する
- 詳細取得で存在しないIDを指定した際に404を返せることを固定化する

## 対象スクリプト

- `apps/web/scripts/check-clothing-msw-handlers-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-msw-handlers`

## テストケース

### CM-01 Clothing MSW handler が src/mocks/handlers/clothing.ts に存在する
- 観点: 実装ファイル配置の固定化
- 期待結果: `apps/web/src/mocks/handlers/clothing.ts` が存在する

### CM-02 Clothing handler が GET/POST/PATCH/DELETE の CRUD と一覧取得を公開する
- 観点: タスク内容「CRUD＋一覧」の担保
- 期待結果:
  - `GET /wardrobes/:wardrobeId/clothing`
  - `GET /wardrobes/:wardrobeId/clothing/:clothingId`
  - `POST /wardrobes/:wardrobeId/clothing`
  - `PATCH /wardrobes/:wardrobeId/clothing/:clothingId`
  - `DELETE /wardrobes/:wardrobeId/clothing/:clothingId`
  が定義される

### CM-03 一覧 handler が limit/cursor を受け取り nextCursor を返す
- 観点: 完了条件「一覧：limit/cursorを受け、nextCursor を返せる」の担保
- 期待結果:
  - `limit` をクエリから読み取る
  - `cursor` をクエリから読み取る
  - `nextCursor` をレスポンスに含める

### CM-04 詳細 handler が存在しない clothingId で 404 を返せる
- 観点: 完了条件「詳細：存在しないIDで404を返せる」の担保
- 期待結果:
  - `clothingId` で検索し、未存在時に404応答を返す

### CM-05 Clothing handler が共通シナリオ（delay/forceError）を適用する
- 観点: MS0-T09で作成したシナリオ共通化との整合
- 期待結果:
  - `applyMockScenario` をimportする
  - 各handlerで `await applyMockScenario(request)` を実行し、シナリオ応答を優先返却できる

### CM-06 handlers 集約に clothingHandlers が追加される
- 観点: mock worker 起動時に clothing handler が有効になることの担保
- 期待結果:
  - `src/mocks/handlers/index.ts` が `clothingHandlers` をimportする
  - `handlers` 配列に `clothingHandlers` を追加する

## CI適用

- `.github/workflows/ci.yml` に `Clothing MSW handlers spec test` を追加し、PR時に自動検証する
