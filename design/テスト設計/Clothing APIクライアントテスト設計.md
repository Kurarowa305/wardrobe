# Clothing APIクライアントテスト設計

## 目的
- 服APIクライアントが一覧・詳細・作成・更新・削除を正しいDTO/パスで扱うことをCIで担保する
- 服一覧取得から cursor を除去した仕様変更を固定化する

## 対象スクリプト
- `apps/web/scripts/check-clothing-api-client-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-api-client`

## テストケース
### CA-01 Clothing APIクライアントが存在する
- 期待結果: `apps/web/src/api/endpoints/clothing.ts` が存在する

### CA-02 apiClient 経由で実装される
- 期待結果: `get/post/patch/delete` が `apiClient` 経由で定義される

### CA-03 list/get/create/update/delete を公開する
- 期待結果: 各関数が export される

### CA-04 一覧/詳細取得の戻り値が DTO 型で返る
- 期待結果: `Promise<ClothingListResponseDto>` と `Promise<ClothingDetailResponseDto>` を返す

### CA-05 一覧APIは genre/order/limit を query として渡せる
- 期待結果:
  - `ClothingListParamsDto` に `genre` / `order` / `limit` が定義される
  - `cursor` は定義されない
  - `query: params` でAPIへ渡す

### CA-06 作成/更新APIは genre を含む DTO を body で送る
- 期待結果: 作成・更新DTOに genre が含まれる

### CA-07 服APIパスが `/wardrobes/{wardrobeId}/clothing(/:clothingId)` 形式で統一される
- 期待結果: 一覧/詳細パス生成関数が共通利用される

## CI適用
- `.github/workflows/ci.yml` の `Clothing API client spec test` で自動検証する
