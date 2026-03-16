# Clothing APIクライアントテスト設計（MS1-T03）

## 目的

- MS1-T03（Clothing APIクライアント）の完了条件を継続的に検証する
- fetch wrapper 利用、CRUD+一覧APIの公開、DTO型での入出力をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-api-client-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-api-client`

## テストケース

### CA-01 Clothing APIクライアントが src/api/endpoints/clothing.ts に存在する
- 観点: API通信処理の配置統一
- 期待結果: `apps/web/src/api/endpoints/clothing.ts` が存在する

### CA-02 Clothing APIクライアントは fetch wrapper（apiClient）経由で実装される
- 観点: エラー形式の統一（`apiClient` の正規化処理を利用）
- 期待結果:
  - `apiClient` を import している
  - `get` / `post` / `patch` / `delete` で通信している

### CA-03 MS1-T03で定義された list/get/create/update/delete が公開される
- 観点: タスク完了条件「CRUD＋一覧」の関数提供
- 期待結果:
  - `listClothings`
  - `getClothing`
  - `createClothing`
  - `updateClothing`
  - `deleteClothing`
    が export されている

### CA-04 一覧/詳細取得の戻り値がDTO型（ClothingListResponseDto / ClothingDetailResponseDto）で返る
- 観点: APIレスポンスをDTO型で受ける統一
- 期待結果:
  - 一覧取得が `Promise<ClothingListResponseDto>` を返す
  - 詳細取得が `Promise<ClothingDetailResponseDto>` を返す

### CA-05 一覧APIは order/limit/cursor を query として渡せる
- 観点: API-03（一覧）のページング・並び替え要件への準拠
- 期待結果:
  - `ClothingListParamsDto` に `order` / `limit` / `cursor` が定義される
  - `listClothings` が `query: params` で渡す

### CA-06 作成/更新APIはリクエストDTO（Create/UpdateClothingRequestDto）をbodyで送る
- 観点: API-04/API-06 の入力型安全性
- 期待結果:
  - `CreateClothingRequestDto` / `UpdateClothingRequestDto` が定義される
  - `createClothing` は `post` で body に DTO を渡す
  - `updateClothing` は `patch` で body に DTO を渡す

### CA-07 服APIパスが /wardrobes/{wardrobeId}/clothing(/:clothingId) 形式で統一される
- 観点: API-03〜API-07 のエンドポイント整合
- 期待結果:
  - 一覧/作成: `/wardrobes/${wardrobeId}/clothing`
  - 詳細/更新/削除: `/wardrobes/${wardrobeId}/clothing/${clothingId}`

## CI適用

- `.github/workflows/ci.yml` に `Clothing API client spec test` を追加し、PR時に自動検証する
