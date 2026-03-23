# BE-MS1-T05 Wardrobe MS1集約テスト設計

## 目的
- BE-MS1（Wardrobe の create/get 一式）が local router・Lambda adapter・CI 導線まで含めて継続的に検証される状態を作る。
- API-01 / API-02 の個別テストだけでは取りこぼしやすい「入口配線」と「集約テスト導線」の破損を早期検知する。

## 対象
- `apps/api/scripts/check-wardrobe-ms1-spec.mjs`
- `apps/api/src/entry/local/router.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/src/entry/lambda/wardrobe_server.ts`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト方針
- local router には wardrobe ドメインのスタブ handler を注入し、`POST /wardrobes` と `GET /wardrobes/{wardrobeId}` が正しい path/body/requestId で配送されることを確認する。
- Lambda adapter には create/get それぞれのスタブ handler を渡し、HTTP method・path parameter・JSON body の受け渡しを検証する。
- wardrobe Lambda entry が `domain="wardrobe"` の handler を公開していることを確認する。
- 追加した集約スクリプトが `apps/api/package.json` の test 系スクリプトと `.github/workflows/ci.yml` に接続されていることを確認する。

## テストケース

### WMS1-01 local router が POST `/wardrobes` を wardrobe ドメインへ配送できる
- 観点: API-01 の入口配線
- 入力: `method=POST`, `url=/wardrobes`, `body={ name: "My Wardrobe" }`
- 期待値:
  - `domain = wardrobe`
  - handler に `pathname=/wardrobes` と body が渡る
  - レスポンスで `wardrobeId` を返せる

### WMS1-02 local router が GET `/wardrobes/{wardrobeId}` を wardrobe ドメインへ配送できる
- 観点: API-02 の入口配線
- 入力: `method=GET`, `url=/wardrobes/wd_local_created`
- 期待値:
  - `domain = wardrobe`
  - `wardrobeId = wd_local_created`
  - handler に path parameter が渡る
  - レスポンスで `name` を返せる

### WMS1-03 Lambda adapter が wardrobe create/get を共通形式で中継できる
- 観点: Lambda 入口配線
- 入力:
  - `POST /wardrobes` の Lambda event
  - `GET /wardrobes/{wardrobeId}` の Lambda event
- 期待値:
  - POST は `wardrobeId` を含む `201`
  - GET は `name` を含む `200`
  - create では JSON body、get では path parameter が handler に渡る

### WMS1-04 wardrobe Lambda entry が wardrobe ドメインの handler を公開している
- 観点: deploy 対象 entry の安定性
- 期待値:
  - `wardrobeLambdaEntry === "wardrobe"`
  - `handler` が関数として export される

### WMS1-05 集約テスト導線が package script と CI に組み込まれている
- 観点: PR要件「テストスクリプトをCIに適用」
- 期待値:
  - `apps/api/package.json` に `test:wardrobe-ms1` がある
  - `apps/api/package.json` の `test` から集約スクリプトが実行される
  - `.github/workflows/ci.yml` で `pnpm --filter api test:wardrobe-ms1` が実行される
