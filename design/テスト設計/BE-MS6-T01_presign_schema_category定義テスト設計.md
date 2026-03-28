# BE-MS6-T01 presign schema / category 定義テスト設計

## 目的

- BE-MS6-T01（presign の request/response schema と category 内部型定義）の完了条件を継続検証する
- API-17 実装の前提となる入力バリデーションと内部型の公開状態を CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-presign-schema-spec.mjs`
- 実行コマンド: `pnpm --filter api test:presign-schema`

## テストケース

### PSG-01 request schema が contentType/category/extension を検証できる
- 観点: 完了条件の必須入力検証（`contentType`, `category`, `extension?`）
- 期待結果:
  - `createPresignRequestSchema` が `image/jpeg + clothing + jpg` を受理する
  - `extension` 未指定でも受理する
  - 不正な `contentType`（例: `application/json`）を reject する
  - 不正な `category`（例: `history`）を reject する

### PSG-02 response schema が API-17 のレスポンス形を検証できる
- 観点: 後続 usecase/handler で返却するレスポンス型の整合
- 期待結果:
  - `createPresignResponseSchema` が `imageKey` / `uploadUrl` / `method` / `expiresAt` を受理する
  - `method` は `PUT` 固定として検証される
  - `expiresAt` は ISO 8601 形式で検証される

### PSG-03 category 内部型を定義している
- 観点: category ごとの分岐実装に利用する内部型の担保
- 期待結果:
  - `presignCategoryPrefixMap` に `clothing` / `template` の prefix が定義される
  - `PresignIssueInput` / `PresignIssueResult` が export される

### PSG-04 schema/dto の型公開が維持される
- 観点: 後続タスクから参照する型定義の破壊検知
- 期待結果:
  - `presignSchema.ts` で request/response schema と `PresignCategory` を export している
  - `presignDto.ts` で request/response DTO 型を export している

### PSG-05 package script と CI 導線が維持される
- 観点: PR 上での自動実行導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:presign-schema` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:presign-schema` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:presign-schema` が追加される

## CI適用

- `.github/workflows/ci.yml` に `API presign schema/category spec test` を追加し、push 時に自動検証する
