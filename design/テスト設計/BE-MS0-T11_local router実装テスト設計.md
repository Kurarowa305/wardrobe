# BE-MS0-T11 local router 実装テスト設計

## 目的
- BE-MS0-T11（local router 実装）の完了条件を継続的に検証する
- ローカル Node.js サーバーが設計された API パスを解決し、ドメイン handler へ必要な情報を受け渡せることを保証する

## 対象
- `apps/api/src/entry/local/router.ts`
- `apps/api/src/entry/local/server.ts`
- `apps/api/src/index.ts`
- `apps/api/scripts/check-local-router-spec.mjs`
- `.github/workflows/ci.yml`

## テスト観点
1. ルート解決
   - `/wardrobes/:wardrobeId/clothing` が `clothing` ドメインとして解決される
   - `/wardrobes/:wardrobeId/histories/:historyId` が `history` ドメインとして解決される
   - 未定義パス、未対応メソッドはマッチしない
2. request 変換
   - query string を単一値 / 複数値の双方で handler に渡せる
   - JSON body をパースして handler に渡せる
   - `x-request-id` を request context に反映できる
3. HTTP サーバー統合
   - `createLocalServer` 経由で解決済みルートを handler に中継できる
   - 未定義パスで共通エラーレスポンス（404/`NOT_FOUND`）を返せる
4. CI 組み込み
   - `pnpm --filter api test:local-router` が GitHub Actions の CI で実行される

## テストケース
### 1. ルート解決
- コマンド: `pnpm --filter api test:local-router`
- ケース:
  1. `resolveLocalRoute("GET", "/wardrobes/wd_001/clothing")` が `clothing` ドメインと `wardrobeId` を返す
  2. `resolveLocalRoute("DELETE", "/wardrobes/wd_001/histories/hs_001")` が `history` ドメインと `historyId` を返す
  3. `/unknown` と `PUT /wardrobes` が `null` を返す

### 2. request 変換
- コマンド: `pnpm --filter api test:local-router`
- ケース:
  1. `POST /wardrobes/wd_002/images/presign?category=clothing&tag=a&tag=b` で query/body/requestId が handler に渡る

### 3. HTTP サーバー統合
- コマンド: `pnpm --filter api test:local-router`
- ケース:
  1. `GET /wardrobes/wd_003` が handler の JSON レスポンスを返す
  2. `GET /unsupported/path` が `404` と `NOT_FOUND` を返す

### 4. CI 組み込み
- コマンド: `pnpm --filter api test:local-router`
- ケース:
  1. `.github/workflows/ci.yml` に `API local router spec test` ステップが存在する
  2. `apps/api/package.json` に `test:local-router` スクリプトが存在する
