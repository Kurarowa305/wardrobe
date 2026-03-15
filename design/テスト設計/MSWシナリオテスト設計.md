# MSWシナリオテスト設計（MS0-T09）

## 目的

- MS0-T09（MSWシナリオ共通化）の完了条件を継続的に検証する
- handler で共通の `delay` / `forceError` シナリオを再現できることをCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-msw-scenarios-spec.mjs`
- 実行コマンド: `pnpm --filter web test:msw-scenarios`

## テストケース

### MS-01 MSWシナリオ共通ユーティリティが存在する
- 観点: シナリオ共通化の配置固定
- 期待結果: `apps/web/src/mocks/handlers/scenario.ts` が存在する

### MS-02 共通ユーティリティが delay / forceError クエリを解釈する
- 観点: 完了条件「`delay=...` / `forceError=...` の再現」の入口担保
- 期待結果:
  - `DELAY_QUERY_PARAM = "delay"` が定義される
  - `FORCE_ERROR_QUERY_PARAM = "forceError"` が定義される
  - `url.searchParams.get(...)` で両パラメータを読み取る

### MS-03 delay パラメータでレスポンス遅延を再現できる
- 観点: 通信遅延シナリオの再現性
- 期待結果: `delayMs > 0` のとき `await delay(delayMs)` を実行する

### MS-04 forceError パラメータで 404 / 500 を強制できる
- 観点: エラー系UI検証に必要な 404/500 シナリオの共通化
- 期待結果:
  - `ForcedErrorStatus = 404 | 500` が定義される
  - `forceError` の値に応じて 404/500 を判定できる
  - `HttpResponse.json(..., { status: forcedStatus })` で強制エラーを返す

### MS-05 health ハンドラが共通シナリオを適用している
- 観点: 既存ハンドラへの適用確認
- 期待結果:
  - `src/mocks/handlers/health.ts` が `applyMockScenario` を import する
  - `http.get("*/health", async ({ request }) => ...)` で `await applyMockScenario(request)` を実行する

## CI適用

- `.github/workflows/ci.yml` に `MSW scenarios spec test` を追加し、PR時に自動検証する
