# おすすめ服APIテスト設計

## 目的

- API-18（おすすめ服取得）が、季節タグと最終着用日が古い順からトップス/ボトムスを推薦できることをCIで担保する。
- 既存の `StatusListByLastWornAt` GSI と `tagIds` を使い、新規GSIなしで取得できることを確認する。

## 対象

- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/clothing/handlers/getClothingRecommendationsHandler.ts`
- `apps/api/src/entry/local/router.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `infra/terraform/app/apigw_http_api.tf`
- `apps/api/scripts/check-clothing-recommendations-api-spec.mjs`

## テストケース

| ID | 観点 | 確認内容 |
| --- | --- | --- |
| CRA-01 | 季節判定 | JST基準で春夏秋冬の月境界を判定する |
| CRA-02 | Query条件 | `StatusListByLastWornAt` を `status=ACTIVE` / 昇順 / 内部limit 50でQueryする |
| CRA-03 | タグ判定 | 現在季節タグまたは `season:all` に一致する服のみ採用する |
| CRA-04 | ジャンル判定 | `tops` / `bottoms` を各最大2件返し、`others` は返さない |
| CRA-05 | ページング | 1ページで不足した場合、`LastEvaluatedKey` で次ページを取得する |
| CRA-06 | Handler | API-18 handler がレスポンスschemaに沿って返す |
| CRA-07 | ルーティング | local router / Lambda adapter / API Gateway に新パスが登録される |
| CRA-08 | CI | `pnpm --filter api test:clothing-recommendations-api` がCIで実行される |

## 実行コマンド

```sh
pnpm --filter api test:clothing-recommendations-api
```
