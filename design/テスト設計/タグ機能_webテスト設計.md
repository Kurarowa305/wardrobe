# タグ機能 webテスト設計

## 目的

- web側で服・テンプレートのタグ表示と複数選択UIを扱えることを継続検証する。
- API側の許可IDとweb側の表示カタログがずれないことをCIで検知する。
- 作成/編集画面の送信payloadに `tagIds` が含まれ、詳細画面でタグあり/なしを表示できることを確認する。

## 対象

- `apps/web/src/api/schemas/itemTag.ts`
- `apps/web/src/api/schemas/clothing.ts`
- `apps/web/src/api/schemas/template.ts`
- `apps/web/src/features/tags/itemTags.ts`
- `apps/web/src/components/app/tags/ItemTagSelector.tsx`
- `apps/web/src/components/app/tags/ItemTagChips.tsx`
- `apps/web/src/components/app/screens/ClothingCreateScreen.tsx`
- `apps/web/src/components/app/screens/ClothingEditScreen.tsx`
- `apps/web/src/components/app/screens/ClothingDetailScreen.tsx`
- `apps/web/src/components/app/screens/TemplateForm.tsx`
- `apps/web/src/components/app/screens/TemplateDetailScreen.tsx`
- `apps/web/scripts/check-item-tags-web-spec.mjs`

## テストケース

| ID | 観点 | 確認内容 |
| --- | --- | --- |
| ITW-01 | ファイル構成 | タグDTO、表示カタログ、選択UI、表示チップが存在する |
| ITW-02 | ID整合 | API側許可IDとweb側DTO/表示カタログのIDが一致する |
| ITW-03 | 表示定義 | `夏` / `冬` / `オールシーズン` の表示名と表示順が定義される |
| ITW-04 | DTO | 服・テンプレートの作成/更新/詳細/一覧DTOが `tagIds` を扱う |
| ITW-05 | 送信 | 服・テンプレートの作成/編集画面が選択タグをpayloadへ渡す |
| ITW-06 | 表示 | 服・テンプレート詳細画面がタグチップと「タグなし」を表示する |
| ITW-07 | CI | `pnpm --filter web test:item-tags-web` がCIで実行される |

## 実行コマンド

```sh
pnpm --filter web test:item-tags-web
```
