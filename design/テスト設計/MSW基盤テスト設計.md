# MSW基盤テスト設計（MS0-T08）

## 目的

- MS0-T08（MSW導入）の完了条件を継続的に検証する
- 開発起動時の自動モック有効化と `GET /health` モック応答をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-msw-foundation-spec.mjs`
- 実行コマンド: `pnpm --filter web test:msw-foundation`

## テストケース

### MF-01 web package に MSW 依存が追加されている
- 観点: ライブラリ導入漏れ防止
- 期待結果: `apps/web/package.json` に `msw` が定義されている

### MF-02 Service Worker スクリプトが public に配置されている
- 観点: ブラウザ起動時にMSWを有効化する前提ファイルの存在
- 期待結果: `apps/web/public/mockServiceWorker.js` が存在する

### MF-03 health ハンドラが GET /health をモックで返す
- 観点: 完了条件「`GET /health` がモックで返る」の担保
- 期待結果: `src/mocks/handlers/health.ts` に `http.get("*/health", ...)` と `status: "ok"` が実装されている

### MF-04 handlers 集約が healthHandler を公開している
- 観点: 今後のドメイン別ハンドラ追加に備えた集約点の固定
- 期待結果: `src/mocks/handlers/index.ts` で `healthHandler` が `handlers` 配列に含まれている

### MF-05 browser worker が setupWorker(...handlers) で初期化される
- 観点: ブラウザ向けMSW初期化経路の保証
- 期待結果: `src/mocks/browser.ts` で `setupWorker(...handlers)` を実行している

### MF-06 MSW 起動関数が開発環境またはVercel previewで一度だけ起動する
- 観点: 本番環境への影響回避とプレビュー確認時のモック有効化、多重起動防止
- 期待結果:
  - `src/mocks/start.ts` に `shouldEnableMockServiceWorker` があり、`NODE_ENV=development` または `VERCEL_ENV=preview` を許可する
  - `typeof window === "undefined"` ガードがある
  - `isStarted` フラグで再起動を防止している
  - `worker.start({ onUnhandledRequest: "bypass" })` を呼び出している

### MF-07 AppProviders が起動時に startMockServiceWorker を呼び出す
- 観点: 完了条件「起動時に自動で有効」の担保
- 期待結果: `src/lib/providers/AppProviders.tsx` で `startMockServiceWorker` を `await` 実行している

### MF-08 MSW有効環境では起動完了まで描画を待機する
- 観点: 初回通信がMSW起動前に発火する競合の回避
- 期待結果:
  - `isMockReady` の初期値が `shouldEnableMockServiceWorker()` の結果に追従している
  - `isMockReady` が `false` の間は `return null` で描画待機する

## CI適用

- `.github/workflows/ci.yml` に `MSW foundation spec test` を追加し、PR時に自動検証する
