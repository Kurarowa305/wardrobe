# MS4-T04 History MSW handlersテスト設計

## 目的
- MS4-T04（History MSW handlers）の完了条件を継続的に検証する
- 履歴一覧・詳細・作成・削除のモック API が API 設計どおりの条件解釈とエラー再現を提供することを CI で担保する
- 履歴削除が論理削除ではなく物理削除として実装されていることを確認する

## 対象
- `apps/web/src/mocks/handlers/history.ts`
- `apps/web/src/mocks/handlers/index.ts`
- `apps/web/scripts/check-history-msw-handlers-spec.mjs`
- `.github/workflows/ci.yml`

## テスト観点

### HM-01 History MSW handler の配置
- 観点: 履歴モック API の実装ファイルが既定位置に存在するか
- 期待結果: `apps/web/src/mocks/handlers/history.ts` が存在する

### HM-02 History handler が一覧・詳細・作成・削除を公開する
- 観点: MS4-T03 の API クライアントに対応する handler 群が揃っているか
- 期待結果:
  - `GET /wardrobes/:wardrobeId/histories`
  - `GET /wardrobes/:wardrobeId/histories/:historyId`
  - `POST /wardrobes/:wardrobeId/histories`
  - `DELETE /wardrobes/:wardrobeId/histories/:historyId`
  が定義される

### HM-03 一覧 handler が履歴一覧条件とページングを解釈する
- 観点: API-13 の `from` / `to` / `order` / `limit` / `cursor` と `nextCursor` が実装に反映されているか
- 期待結果:
  - 各クエリの取得と検証処理がある
  - `nextCursor` が `offset:` 形式で返却される

### HM-04 一覧 handler がエラー再現を提供する
- 観点: API-13 で定義された 400 系異常系をモックで再現できるか
- 期待結果:
  - `from` 形式不正で `VALIDATION_ERROR`
  - `to` 形式不正で `VALIDATION_ERROR`
  - `from > to` で `VALIDATION_ERROR`
  - `cursor` 不正/範囲外で `INVALID_CURSOR`

### HM-05 詳細・削除 handler が存在しない履歴を 404 とし、削除は物理削除する
- 観点: API-15 / API-16 の NOT_FOUND と物理削除要件を満たすか
- 期待結果:
  - 詳細取得で存在しない `historyId` を 404 にできる
  - 削除で存在しない `historyId` を 404 にできる
  - 削除時は `historyStore` から対象が除外される

### HM-06 作成 handler が template 入力・組み合わせ入力の両方を解決する
- 観点: API-14 の排他的入力と fixture 連携が実装に反映されているか
- 期待結果:
  - `templateId` 指定時は template fixture から `templateName` / `clothingItems` を解決する
  - `clothingIds` 指定時は clothing fixture から `clothingItems` を解決する

### HM-07 共通シナリオ（delay/forceError）を適用する
- 観点: MS0-T09 の再利用で遅延・強制エラーを履歴 API でも再現できるか
- 期待結果: 各 handler の先頭で `applyMockScenario(request)` を評価し、レスポンスを優先返却する

### HM-08 handlers 集約とデモ導線の wardrobeId 対応
- 観点: アプリ全体から履歴 handler を利用できるか
- 期待結果:
  - `DEMO_IDS.wardrobe` が許可される
  - `src/mocks/handlers/index.ts` に `historyHandlers` が追加される

## テストスクリプト
- `pnpm --filter web test:history-msw-handlers`
  - `apps/web/scripts/check-history-msw-handlers-spec.mjs` を実行し、上記 HM-01〜HM-08 を静的検査する

## CI 適用
- `.github/workflows/ci.yml` に `History MSW handlers spec test` ステップを追加する
- push 時に `pnpm --filter web test:history-msw-handlers` を自動実行する
