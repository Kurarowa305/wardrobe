# MS2-T03 presign MSW handler（成功/失敗/遅延）テスト設計

## 目的

画像アップロード前に利用する presign API の MSW handler 実装（成功・失敗・遅延）の仕様を静的検査で担保する。

## 対象

- `apps/web/src/mocks/handlers/image.ts`
- `apps/web/src/mocks/handlers/index.ts`
- `apps/web/scripts/check-image-presign-msw-handler-spec.mjs`

## テスト観点

1. `POST /wardrobes/:wardrobeId/images/presign` handler が存在すること
2. 共通シナリオ（`delay` / `forceError`）を適用して遅延・500を再現できること
3. 入力不正時に 400（`VALIDATION_ERROR`）を返せること
4. 成功時に `imageKey` / `uploadUrl` / `method` / `expiresAt` を返すこと
5. `imageKey` が毎回ユニークっぽく生成されること
6. handlers 集約に組み込まれ、mock worker 起動時に有効化されること

## テストケース

### IPM-01: presign MSW handler が存在する

- チェック内容
  - `src/mocks/handlers/image.ts` の存在確認
- 期待結果
  - ファイルが存在する

### IPM-02: presign handler が POST /wardrobes/:wardrobeId/images/presign を公開する

- チェック内容
  - `http.post("*/wardrobes/:wardrobeId/images/presign"...` の存在
- 期待結果
  - presign endpoint の handler が定義されている

### IPM-03: presign handler が共通シナリオ（delay/forceError）を適用する

- チェック内容
  - `applyMockScenario` を import している
  - handler 内で `await applyMockScenario(request)` を実行している
  - シナリオ応答を優先返却している
- 期待結果
  - `delay` / `forceError=500` を共通方式で再現できる

### IPM-04: 入力不正時に 400 VALIDATION_ERROR を返せる

- チェック内容
  - request body の parse/validate 実装がある
  - 無効リクエスト時に `createErrorResponse(400, "VALIDATION_ERROR", ...)` を返す
  - `extension` 推定失敗でも400を返す
- 期待結果
  - 失敗ケースとして 400 を再現できる

### IPM-05: imageKey がユニーク形式で生成される

- チェック内容
  - `mockImageSequence` の連番管理
  - 連番インクリメント
  - `Date.now()` を含むキー生成
- 期待結果
  - 各リクエストで重複しにくい `imageKey` を生成できる

### IPM-06: 成功レスポンスが必須項目を返す

- チェック内容
  - `HttpResponse.json<GetPresignedUrlResponseDto>(...)` で応答する
  - `imageKey` / `uploadUrl` / `method: "PUT"` / `expiresAt` を含む
- 期待結果
  - MS2-T02 の DTO 契約どおりにレスポンスを返せる

### IPM-07: 受け付ける wardrobeId が fixture とデモ遷移の両方に対応する

- チェック内容
  - `CLOTHING_FIXTURE_WARDROBE_ID` と `DEMO_IDS.wardrobe` を許可する判定
- 期待結果
  - fixture由来URLと画面遷移URLの双方で presign API を利用できる

### IPM-08: handlers 集約に imagePresignHandlers が追加される

- チェック内容
  - `src/mocks/handlers/index.ts` が `imagePresignHandlers` を import する
  - `handlers.push(...imagePresignHandlers)` を実行する
- 期待結果
  - mock worker 起動時に presign handler が有効化される

## 実行方法

```bash
pnpm --filter web test:image-presign-msw-handler
```

## CI適用

- GitHub Actions `CI` ワークフローに `Image presign MSW handler spec test` を追加し、上記スクリプトを実行する。
