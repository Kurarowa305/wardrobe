# タグ機能 APIテスト設計

## 目的

- 服・テンプレートに `tagIds` を配列として保持できることを継続検証する。
- API側のタグ許可IDを正本とし、不正タグや重複タグを拒否できることを確認する。
- 既存データに `tagIds` が存在しない場合も、後方互換として空配列で扱えることを確認する。

## 対象

- `apps/api/src/domains/tags/itemTagSchema.ts`
- `apps/api/src/domains/clothing/schema/clothingSchema.ts`
- `apps/api/src/domains/clothing/entities/clothing.ts`
- `apps/api/src/domains/clothing/dto/clothingDetailDto.ts`
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/template/schema/templateSchema.ts`
- `apps/api/src/domains/template/entities/template.ts`
- `apps/api/src/domains/template/usecases/templateUsecase.ts`
- `apps/api/scripts/check-item-tags-api-spec.mjs`

## テストケース

| ID | 観点 | 確認内容 |
| --- | --- | --- |
| ITA-01 | タグID正本 | API側の許可IDが `season:summer` / `season:winter` / `season:all` で定義されている |
| ITA-02 | schema検証 | 服・テンプレートの作成/更新schemaが `tagIds` を受理する |
| ITA-03 | 不正入力 | 未定義タグIDと重複タグIDを `VALIDATION_ERROR` 相当で拒否する |
| ITA-04 | 初期値 | 作成時に `tagIds` 未指定なら空配列でEntity化される |
| ITA-05 | 全解除 | 更新時に `tagIds: []` を指定するとタグを全解除できる |
| ITA-06 | 後方互換 | 既存itemに `tagIds` がない場合、詳細DTOは空配列を返す |
| ITA-07 | 永続化 | repository update が `tagIds` をDynamoDB itemへ保存する |
| ITA-08 | CI | `pnpm --filter api test:item-tags-api` がCIで実行される |

## 実行コマンド

```sh
pnpm --filter api test:item-tags-api
```
