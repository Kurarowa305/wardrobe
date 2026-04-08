# APIGW detail path param 整合性テスト設計

## 背景
- API 契約では detail API が `clothingId` / `templateId` / `historyId` を path parameter として受け取る。
- しかし API Gateway 側で detail route が `/{proxy+}` だと、Lambda 側の `request.path.<id>` 分岐条件と一致せず detail handler に到達できない。
- この差異を防ぐため、Terraform route 定義と Lambda 経路分岐の双方を自動テストで固定化する。

## 目的
1. API Gateway detail route が `/{proxy+}` ではなく `/{clothingId|templateId|historyId}` で定義されていることを保証する。
2. Lambda adapter が `pathParameters` に id キーが存在する場合に detail handler 分岐へ進み、id キーが欠落した場合は分岐できないことを保証する。
3. 既存の collection route・presign route に回帰がないことを保証する。

## テスト対象
- `infra/terraform/app/apigw_http_api.tf`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/scripts/check-terraform-apigw-ms7-t04-spec.mjs`
- `apps/api/scripts/check-lambda-detail-routing-spec.mjs`

## テスト観点
- 観点1: detail route の path parameter 名一致
- 観点2: detail route に `/{proxy+}` が残っていないこと
- 観点3: `clothing/template/history` の detail 分岐到達
- 観点4: id キー欠落時（proxy 想定イベント）に detail 分岐へ入らないこと
- 観点5: テストスクリプトが package scripts / CI に登録され、継続検証されること

## テストケース一覧

| ケースID | 種別 | 入力/条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-APIGW-01 | Terraform構成 | `apigw_http_api.tf` の clothing detail route | `ANY /wardrobes/{wardrobeId}/clothing/{clothingId}` が存在し `/{proxy+}` が存在しない |
| TC-APIGW-02 | Terraform構成 | template/history detail route | `templateId`/`historyId` で route が定義される |
| TC-APIGW-03 | Terraform構成 | 既存 route 群 | collection・presign route が維持される |
| TC-LMB-01 | Lambda経路 | clothing GET/PATCH/DELETE + `pathParameters.clothingId` あり | default 応答にならず detail handler 側へ分岐する |
| TC-LMB-02 | Lambda経路 | template GET/PATCH/DELETE + `pathParameters.templateId` あり | default 応答にならず detail handler 側へ分岐する |
| TC-LMB-03 | Lambda経路 | history GET/DELETE + `pathParameters.historyId` あり | default 応答にならず detail handler 側へ分岐する |
| TC-LMB-04 | Lambda経路(負) | detail path だが `pathParameters.proxy` のみ（id キー欠落） | default 応答へフォールバックし、detail 分岐しない |
| TC-CI-01 | CI | `.github/workflows/ci.yml` | `pnpm --filter api test:lambda-detail-routing` が実行される |

## 実行コマンド
- `pnpm --filter api test:terraform-apigw-ms7-t04`
- `pnpm --filter api test:lambda-detail-routing`

## 完了条件
- 上記テストケースがローカル・CI ですべて成功する。
- Terraform detail route と Lambda 分岐条件の契約不一致が再発しないことを継続的に検知できる。
