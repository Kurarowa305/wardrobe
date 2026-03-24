# BE-MS3-T01 Template entity / dto / schema 定義テスト設計

## 目的
- BE-MS3-T01（Template entity / dto / schema 定義）の完了条件を継続的に検証する。
- template ドメインの request / response schema、内部 Entity、DTO alias が API 設計・DB 設計に沿って欠落なく定義されていることを保証する。

## 対象
- `apps/api/src/domains/template/schema/templateSchema.ts`
- `apps/api/src/domains/template/dto/templateDto.ts`
- `apps/api/src/domains/template/entities/template.ts`
- `apps/api/scripts/check-template-schema-spec.mjs`
- `.github/workflows/ci.yml`

## テスト方針
- 実API起動やDB接続は行わず、Zod schema の parse 結果と entity helper の返却値を検証する。
- API-08 / API-09 / API-10 / API-11 に必要な query・request・response の型整合を優先観点とする。
- DB 設計に記載された template 属性（`status`, `clothingIds`, `wearCount`, `lastWornAt`, `createdAt`, `deletedAt`）を Entity schema で保持できることを確認する。
- 完了条件である `clothingIds` の順序保持と上限20件制約を schema で検証する。
- 追加した検証スクリプトが package script と CI に接続されていることも確認する。

## テストケース

### TS-01 enum・制約値定義
- 観点: template ドメインの基礎定義を共通化できていること
- 期待値:
  - `templateStatusValues` が `ACTIVE`, `DELETED` を保持する
  - `templateListOrderValues` が `asc`, `desc` を保持する
  - `templateNameMaxLength=40`, `templateClothingIdsMax=20`, `templateListLimitMax=30` が定義される

### TS-02 一覧・追加・更新の request/query schema
- 観点: API-08 / API-09 / API-11 の入力条件を型で検証できること
- 期待値:
  - `createTemplateRequestSchema` が `name`, `clothingIds` を受理する
  - `updateTemplateRequestSchema` が部分更新を受理する
  - `templateListParamsSchema` が `order`, `limit`, `cursor` を受理する
  - `clothingIds` の配列順序が保持される

### TS-03 詳細レスポンス schema と内部 Entity schema
- 観点: 完了条件にある template 属性を request/response schema と内部型で扱えること
- 期待値:
  - `templateDetailResponseSchema` が `status`, `wearCount`, `lastWornAt`, `clothingItems` を扱える
  - `templateEntitySchema` が `clothingIds` を含めて parse できる
  - `clothingIds` が 20件を超える入力を拒否する

### TS-04 Entity helper の初期値・論理削除
- 観点: 今後の repository / usecase 実装で再利用できる初期化規約を持てること
- 期待値:
  - `createTemplateEntity` が `status=ACTIVE`, `wearCount=0`, `lastWornAt=0`, `deletedAt=null` を設定する
  - `markTemplateDeleted` が `status=DELETED`, `deletedAt=指定時刻` を設定する

### TS-05 DTO alias とモジュール公開
- 観点: DTO / schema / entity の責務が分割され、後続タスクから import しやすいこと
- 期待値:
  - `templateDto.ts` に request / response / enum alias が定義される
  - schema / entity モジュールに必要な export が存在する

### TS-06 テスト導線のCI組み込み
- 観点: PR要件「テストスクリプトをCIに適用」
- 期待値:
  - `apps/api/package.json` に `test:template-schema` がある
  - `apps/api/package.json` の `test` から `test:template-schema` が実行される
  - `.github/workflows/ci.yml` で `pnpm --filter api test:template-schema` が実行される
