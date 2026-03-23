# BE-MS1-T03 API-01 handler 実装テスト設計

## 目的
- BE-MS1-T03（`POST /wardrobes` handler 実装）の完了条件を継続的に検証する。
- `name` バリデーション、`wardrobeId` の返却、Lambda/local 共通 adapter への接続が崩れないことを保証する。

## 対象
- `apps/api/src/domains/wardrobe/handlers/createWardrobeHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/src/entry/lambda/wardrobe_server.ts`
- `apps/api/scripts/check-wardrobe-create-handler-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト方針
- 実DynamoDB接続は行わず、handler に usecase 依存を注入して入力整形とレスポンス整形を検証する。
- バリデーションは `Content-Type` と `name` の 2 系統に分け、HTTPエラーコードまで確認する。
- Lambda entry は `POST /wardrobes` を送って、adapter 経由で handler の 201 レスポンスへ到達することを確認する。
- 追加した検証スクリプトが package script と CI に接続されていることも確認する。

## テストケース

### WCH-01 createWardrobeHandler が 201 と `wardrobeId` を返す
- 観点: 完了条件「`wardrobeId` を返す」
- 入力: `headers[content-type]=application/json`, `body={ name: "  My Wardrobe  " }`
- 期待値:
  - HTTP status が `201`
  - response json に `wardrobeId` が含まれる
  - usecase/repo へ渡る `name` は trim 後の `My Wardrobe`
  - `createdAt` が usecase に渡る

### WCH-02 createWardrobeHandler が空文字 name を `VALIDATION_ERROR` にする
- 観点: 完了条件「`name` バリデーション」
- 入力: `body={ name: "   " }`
- 期待値:
  - `AppError`
  - `code = VALIDATION_ERROR`
  - `status = 400`
  - `requestId` が維持される
  - `details.body.name` にエラー内容が入る

### WCH-03 createWardrobeHandler が非JSON Content-Type を `UNSUPPORTED_MEDIA_TYPE` にする
- 観点: API設計の 415 エラー
- 入力: `headers[content-type]=text/plain`
- 期待値:
  - `AppError`
  - `code = UNSUPPORTED_MEDIA_TYPE`
  - `status = 415`

### WCH-04 wardrobe Lambda entry が `POST /wardrobes` を handler にルーティングできる
- 観点: local/Lambda 共通 adapter 接続
- 入力: Lambda event (`rawPath=/wardrobes`, `method=POST`, `body={ name: "API Wardrobe" }`)
- 期待値:
  - HTTP status が `201`
  - response body に `wardrobeId` が含まれる

### WCH-05 テスト導線のCI組み込み
- 観点: PR要件「テストスクリプトをCIに適用」
- 期待値:
  - `apps/api/package.json` に `test:wardrobe-create-handler` がある
  - `.github/workflows/ci.yml` で `pnpm --filter api test:wardrobe-create-handler` が実行される
