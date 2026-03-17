# MS3-T04 Template MSW handlersテスト設計

## 目的

- MS3-T04（Template MSW handlers）の完了条件を継続的に検証する
- テンプレ一覧のページング（`limit` / `cursor` / `nextCursor`）とCRUDハンドラの存在をCIで担保する
- テンプレ詳細・作成・更新で `clothingIds` ではなく服同梱データ（`clothingItems`）を返せることを固定化する

## 対象スクリプト

- `apps/web/scripts/check-template-msw-handlers-spec.mjs`
- 実行コマンド: `pnpm --filter web test:template-msw-handlers`

## テストケース

### TM-01 Template MSW handler が src/mocks/handlers/template.ts に存在する
- 観点: 実装ファイル配置の固定化
- 期待結果: `apps/web/src/mocks/handlers/template.ts` が存在する

### TM-02 Template handler が GET/POST/PATCH/DELETE の CRUD と一覧取得を公開する
- 観点: タスク内容「CRUD＋一覧」の担保
- 期待結果:
  - `GET /wardrobes/:wardrobeId/templates`
  - `GET /wardrobes/:wardrobeId/templates/:templateId`
  - `POST /wardrobes/:wardrobeId/templates`
  - `PATCH /wardrobes/:wardrobeId/templates/:templateId`
  - `DELETE /wardrobes/:wardrobeId/templates/:templateId`
  が定義される

### TM-03 一覧 handler が limit/cursor を受け取り nextCursor を返す
- 観点: 完了条件「一覧：limit/cursorを受け、nextCursor を返せる」の担保
- 期待結果:
  - `limit` をクエリから読み取る
  - `cursor` をクエリから読み取る
  - `nextCursor` をレスポンスに含める

### TM-04 詳細 handler が存在しない templateId で 404 を返せる
- 観点: 完了条件「詳細：存在しないIDで404を返せる」の担保
- 期待結果:
  - `templateId` で検索し、未存在時に404応答を返す

### TM-05 Template handler が clothingIds を clothingItems に解決して返却する
- 観点: 完了条件「`clothingIds` ではなく服データ配列を返す」の担保
- 期待結果:
  - `clothingDetailFixtureById` を用いて `clothingIds` から `clothingItems` を解決する
  - 詳細レスポンスが `clothingItems` を返す
  - 更新時に `clothingItems` が再構築される

### TM-06 Template handler が共通シナリオ（delay/forceError）を適用する
- 観点: MS0-T09で作成したシナリオ共通化との整合
- 期待結果:
  - `applyMockScenario` をimportする
  - 各handlerで `await applyMockScenario(request)` を実行し、シナリオ応答を優先返却できる

### TM-07 handlers 集約に templateHandlers が追加される
- 観点: mock worker 起動時に template handler が有効になることの担保
- 期待結果:
  - `src/mocks/handlers/index.ts` が `templateHandlers` をimportする
  - `handlers` 配列に `templateHandlers` を追加する

### TM-08 Template handler がデモ遷移用 wardrobeId（DEMO_IDS.wardrobe）を許可する
- 観点: 画面遷移で利用する `wardrobeId`（`/wardrobes/1/...`）とMSW判定条件の整合
- 期待結果:
  - `src/mocks/handlers/template.ts` が `DEMO_IDS` をimportする
  - `isSupportedWardrobeId` が fixture用IDに加えて `DEMO_IDS.wardrobe` も許可する

## CI適用

- `.github/workflows/ci.yml` に `Template MSW handlers spec test` を追加し、PR時に自動検証する
