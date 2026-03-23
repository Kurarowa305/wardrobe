# BE-MS2-T01 Clothing entity / dto / schema 定義テスト設計

## 目的
- BE-MS2-T01（Clothing entity / dto / schema 定義）の完了条件を継続的に検証する。
- clothing ドメインの request / response schema、内部 Entity、DTO alias が API 設計・DB 設計に沿って欠落なく定義されていることを保証する。

## 対象
- `apps/api/src/domains/clothing/schema/clothingSchema.ts`
- `apps/api/src/domains/clothing/dto/clothingDto.ts`
- `apps/api/src/domains/clothing/entities/clothing.ts`
- `apps/api/scripts/check-clothing-schema-spec.mjs`
- `.github/workflows/ci.yml`

## テスト方針
- 実API起動やDB接続は行わず、Zod schema の parse 結果と entity helper の返却値を検証する。
- API-03 / API-04 / API-05 に必要な query・request・response の型整合を優先観点とする。
- DB設計に記載された clothing 属性（`status`, `wearCount`, `lastWornAt`, `createdAt`, `deletedAt`）を Entity schema で保持できることを確認する。
- 追加した検証スクリプトが package script と CI に接続されていることも確認する。

## テストケース

### CS-01 enum・制約値定義
- 観点: clothing ドメインの基礎定義を共通化できていること
- 期待値:
  - `clothingStatusValues` が `ACTIVE`, `DELETED` を保持する
  - `clothingGenreValues` が `tops`, `bottoms`, `others` を保持する
  - `clothingListOrderValues` が `asc`, `desc` を保持する
  - `clothingNameMaxLength=40`, `clothingListLimitMax=50` が定義される

### CS-02 一覧・追加・更新の request/query schema
- 観点: API-03 / API-04 の入力条件を型で検証できること
- 期待値:
  - `createClothingRequestSchema` が `name`, `genre`, `imageKey?` を受理する
  - `updateClothingRequestSchema` が部分更新を受理する
  - `clothingListParamsSchema` が `order`, `genre`, `limit`, `cursor` を受理する

### CS-03 詳細レスポンス schema と内部 Entity schema
- 観点: 完了条件にある clothing 属性を request/response schema と内部型で扱えること
- 期待値:
  - `clothingDetailResponseSchema` が `name`, `imageKey`, `status`, `wearCount`, `lastWornAt` を扱える
  - `clothingEntitySchema` が `createdAt`, `deletedAt` を含めて parse できる

### CS-04 Entity helper の初期値・論理削除
- 観点: 今後の repository / usecase 実装で再利用できる初期化規約を持てること
- 期待値:
  - `createClothingEntity` が `status=ACTIVE`, `wearCount=0`, `lastWornAt=0`, `deletedAt=null` を設定する
  - `markClothingDeleted` が `status=DELETED`, `deletedAt=指定時刻` を設定する

### CS-05 DTO alias とモジュール公開
- 観点: DTO / schema / entity の責務が分割され、後続タスクから import しやすいこと
- 期待値:
  - `clothingDto.ts` に request / response / enum alias が定義される
  - schema / entity モジュールに必要な export が存在する

### CS-06 テスト導線のCI組み込み
- 観点: PR要件「テストスクリプトをCIに適用」
- 期待値:
  - `apps/api/package.json` に `test:clothing-schema` がある
  - `apps/api/package.json` の `test` から `test:clothing-schema` が実行される
  - `.github/workflows/ci.yml` で `pnpm --filter api test:clothing-schema` が実行される
