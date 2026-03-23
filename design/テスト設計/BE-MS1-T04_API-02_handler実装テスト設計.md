# BE-MS1-T04 API-02 handler 実装テスト設計

## 目的
- BE-MS1-T04（`GET /wardrobes/{wardrobeId}` handler 実装）の完了条件を継続的に検証する。
- ワードローブ名の返却、存在しないIDの404、Lambda/local 共通 adapter への接続が崩れないことを保証する。

## 対象
- `apps/api/src/domains/wardrobe/handlers/getWardrobeHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/src/entry/lambda/wardrobe_server.ts`
- `apps/api/scripts/check-wardrobe-get-handler-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト方針
- 実DynamoDB接続は行わず、handler に usecase 依存を注入して path バリデーションとレスポンス整形を検証する。
- 正常系は `name` のみを返す API-02 仕様に合わせて、200 レスポンスのJSON形状を確認する。
- 異常系は空の `wardrobeId` を `VALIDATION_ERROR`、未存在ワードローブを `NOT_FOUND` として検証する。
- Lambda 形式の event を `createLambdaHandler` に渡し、adapter 経由で handler の 200 レスポンスへ到達することを確認する。
- 追加した検証スクリプトが package script と CI に接続されていることも確認する。

## テストケース

### WGH-01 getWardrobeHandler が 200 と `name` を返す
- 観点: 完了条件「`name` を返す」
- 入力: `path={ wardrobeId: "wd_018f05af-f4a8-7c90-9123-abcdef123456" }`
- 期待値:
  - HTTP status が `200`
  - response json が `{ name: "My Wardrobe" }`
  - usecase/repo へ `wardrobeId` がそのまま渡る

### WGH-02 getWardrobeHandler が空の wardrobeId を `VALIDATION_ERROR` にする
- 観点: path パラメータの基本バリデーション
- 入力: `path={ wardrobeId: "   " }`
- 期待値:
  - `AppError`
  - `code = VALIDATION_ERROR`
  - `status = 400`
  - `requestId` が維持される
  - `details.path.wardrobeId` にエラー内容が入る

### WGH-03 getWardrobeHandler が未存在ワードローブを `NOT_FOUND` にする
- 観点: 完了条件「存在しない場合404」
- 入力: `path={ wardrobeId: "wd_missing" }`, repo.get() は空結果を返す
- 期待値:
  - `AppError`
  - `code = NOT_FOUND`
  - `status = 404`
  - `details.resource = wardrobe`
  - `details.wardrobeId = wd_missing`

### WGH-04 wardrobe の Lambda 形式 adapter が `GET /wardrobes/{wardrobeId}` を handler にルーティングできる
- 観点: local/Lambda 共通 adapter 接続
- 入力: Lambda event (`rawPath=/wardrobes/wd_...`, `method=GET`) を `createLambdaHandler` に渡す
- 期待値:
  - HTTP status が `200`
  - response body に `name` が含まれる

### WGH-05 テスト導線のCI組み込み
- 観点: PR要件「テストスクリプトをCIに適用」
- 期待値:
  - `apps/api/package.json` に `test:wardrobe-get-handler` がある
  - `.github/workflows/ci.yml` で `pnpm --filter api test:wardrobe-get-handler` が実行される
