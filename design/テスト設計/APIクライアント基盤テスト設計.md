# APIクライアント基盤テスト設計（MS0-T06）

## 目的

- MS0-T06（APIクライアント雛形）の完了条件を継続的に検証する
- `apiClient` の共通呼び出し（GET/POST/PATCH/DELETE）、エラー正規化、JSON解析、タイムアウト制御をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-api-client-foundation-spec.mjs`
- 実行コマンド: `pnpm --filter web test:api-client-foundation`

## テストケース

### AF-01 APIクライアント本体が api/client.ts として存在する
- 観点: API呼び出し窓口の配置統一
- 期待結果: `apps/web/src/api/client.ts` が存在する

### AF-02 apiClient が NEXT_PUBLIC_API_BASE_URL と timeout 既定値を持つ
- 観点: baseURL とタイムアウトの共通管理
- 期待結果:
  - `NEXT_PUBLIC_API_BASE_URL` を参照している
  - `DEFAULT_TIMEOUT_MS = 10_000` が定義されている

### AF-03 GET/POST/PATCH/DELETE の統一インターフェースを公開する
- 観点: 呼び出しメソッドの統一
- 期待結果: `apiClient` が `get` / `post` / `patch` / `delete` を公開し、共通 `request` に集約されている

### AF-04 AbortController + setTimeout でタイムアウト制御を実装する
- 観点: ハング防止と中断処理
- 期待結果: `AbortController` / `setTimeout` / `controller.abort()` / `clearTimeout()` が実装されている

### AF-05 レスポンスを text 取得し JSON parse する
- 観点: JSONパース方針の統一
- 期待結果: `response.text()` で受け取り `JSON.parse` で復元する実装がある

### AF-06 非2xxレスポンスを normalizeApiError で AppError に正規化する
- 観点: HTTPエラーの共通例外化
- 期待結果: `response.ok` 判定で `normalizeApiError` を使って例外化している

### AF-07 未知エラーとタイムアウトを共通正規化する
- 観点: 通信異常時の例外型統一
- 期待結果:
  - タイムアウト時に `createTimeoutError` を投げる
  - それ以外は `normalizeUnknownError` で正規化する

### AF-08 AppError 型に code/status/details/requestId が定義される
- 観点: UIで扱う例外情報の標準化
- 期待結果: `AppError` に `code` / `status` / `details` / `requestId` が保持される

### AF-09 サーバーの error envelope から code/message/details/requestId を抽出する
- 観点: API設計で定義された共通エラーフォーマットへの追従
- 期待結果: `payload.error` から各値を抽出し、不足時は status 由来コードにフォールバックする

## CI適用

- `.github/workflows/ci.yml` に `API client foundation spec test` を追加し、PR時に自動検証する
