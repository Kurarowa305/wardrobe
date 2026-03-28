# BE-MS6-T02 imageKey 生成ロジックテスト設計

## 目的

- BE-MS6-T02（`imageKey` 生成ロジック）の完了条件を継続検証する
- API-17 の設計どおり `category/wardrobeId/uuid.extension` 形式のキーを安定生成できることを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-presign-image-key-spec.mjs`
- 実行コマンド: `pnpm --filter api test:presign-image-key`

## テストケース

### PIK-01 category ごとに prefix を切って imageKey を生成できる
- 観点: 完了条件「categoryごとに prefix を切れる」を満たすこと
- 期待結果:
  - `category=clothing` のとき `clothing/` で始まる
  - `category=template` のとき `template/` で始まる

### PIK-02 wardrobeId を含めて category/wardrobeId/uuid.extension 形式を生成できる
- 観点: 完了条件「wardrobeId を含められる」を満たすこと
- 期待結果:
  - `buildPresignImageKey` が `category/wardrobeId/uuid.extension` を返す
  - `uuid` 部分は依存注入した generator 値をそのまま使う

### PIK-03 extension 未指定時は contentType から拡張子を推定できる
- 観点: API設計の「extension 未指定時はサーバー側推定」を満たすこと
- 期待結果:
  - `resolvePresignExtension({ contentType: "image/jpeg" })` が `jpg` を返す

### PIK-04 package script と CI 導線が維持される
- 観点: PR 上で自動検証される導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:presign-image-key` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:presign-image-key` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:presign-image-key` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API presign image key builder spec test` を追加し、push 時に自動検証する
