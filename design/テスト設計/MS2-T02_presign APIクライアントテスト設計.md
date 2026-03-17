# MS2-T02 presign APIクライアント＋型テスト設計

## 目的

画像アップロード前に必要な presign API クライアント実装（`getPresignedUrl`）と、その入出力DTO型を静的検査で担保する。

## 対象

- `apps/web/src/api/schemas/image.ts`
- `apps/web/src/api/endpoints/image.ts`
- `apps/web/scripts/check-image-presign-api-client-spec.mjs`

## テスト観点

1. presign API クライアントとスキーマが規定の配置に存在すること
2. `getPresignedUrl` が `apiClient.post` 経由で実装されていること
3. エンドポイントパスが `/wardrobes/{wardrobeId}/images/presign` で統一されること
4. リクエストDTOが `contentType` / `category` / `extension?` を扱えること
5. レスポンスDTOが `imageKey` / `uploadUrl` / `method` / `expiresAt` を扱えること

## テストケース

### IPA-01: presign APIスキーマが存在する

- チェック内容
  - `src/api/schemas/image.ts` の存在確認
- 期待結果
  - ファイルが存在する

### IPA-02: presign APIクライアントが存在する

- チェック内容
  - `src/api/endpoints/image.ts` の存在確認
- 期待結果
  - ファイルが存在する

### IPA-03: presign APIクライアントは getPresignedUrl を公開する

- チェック内容
  - `export function getPresignedUrl(` が存在する
- 期待結果
  - API呼び出し関数が公開されている

### IPA-04: presign APIクライアントは apiClient.post 経由でDTO型付き実装になっている

- チェック内容
  - `apiClient` の import
  - `apiClient.post<GetPresignedUrlResponseDto, GetPresignedUrlRequestDto>(` の存在
- 期待結果
  - fetch wrapper 経由でDTO型を指定したPOST実装になっている

### IPA-05: presign APIパスが統一されている

- チェック内容
  - ``/wardrobes/${wardrobeId}/images/presign`` の組み立て実装
- 期待結果
  - ルーティング仕様どおりのAPIパスが使われる

### IPA-06: presign リクエストDTOが contentType/category/extension? を持つ

- チェック内容
  - `ImageCategoryDto` が `clothing | template`
  - `GetPresignedUrlRequestDto` に `contentType` / `category` / `extension?`
- 期待結果
  - API-17の入力仕様を型で扱える

### IPA-07: presign レスポンスDTOが imageKey/uploadUrl/method/expiresAt を持つ

- チェック内容
  - `PresignedUploadMethodDto` が `PUT` 固定
  - `GetPresignedUrlResponseDto` に `imageKey` / `uploadUrl` / `method` / `expiresAt`
- 期待結果
  - API-17の戻り値（特に `uploadUrl` と `imageKey`）を型で扱える

## 実行方法

```bash
pnpm --filter web test:image-presign-api-client
```

## CI適用

- GitHub Actions `CI` ワークフローに `Image presign API client spec test` を追加し、上記スクリプトを実行する。
