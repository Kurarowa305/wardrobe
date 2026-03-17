# MS3-T05 Template Query hooks＋Mutation hooksテスト設計

## 目的

- MS3-T05（Template Query hooks＋Mutation hooks）の完了条件を継続的に検証する
- テンプレ一覧/詳細のQuery hookがAPIクライアントとQueryKeyを正しく利用することを固定化する
- create/update/delete のMutation後に、設計どおりのinvalidate（template/history）が実行されることをCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-template-query-mutation-hooks-spec.mjs`
- 実行コマンド: `pnpm --filter web test:template-query-mutation-hooks`

## テストケース

### TMH-01 Template Query / Mutation hooks が src/api/hooks/template.ts に存在する
- 観点: 実装ファイル配置の固定化
- 期待結果: `apps/web/src/api/hooks/template.ts` が存在する

### TMH-02 useTemplateList/useTemplate が useQuery ラッパとして公開される
- 観点: Query hook提供方針（TanStack Query設計）への準拠
- 期待結果:
  - `useTemplateList`
  - `useTemplate`
  が `useQuery` を使って実装される

### TMH-03 一覧 hook が queryKeys.template.list(params) と listTemplates を利用し VM 変換する
- 観点: QueryKey整合と DTO→VM 変換の担保
- 期待結果:
  - `queryKeys.template.list(wardrobeId, params)` をqueryKeyに利用する
  - `listTemplates(wardrobeId, params)` をqueryFnに利用する
  - `response.items.map(toTemplateListItem)` と `nextCursor` を返却する

### TMH-04 詳細 hook が queryKeys.template.detail(id) と getTemplate を利用し VM 変換する
- 観点: 詳細取得のQueryKey整合と DTO→VM 変換の担保
- 期待結果:
  - `queryKeys.template.detail(wardrobeId, templateId)` をqueryKeyに利用する
  - `getTemplate(wardrobeId, templateId)` をqueryFnに利用する
  - `select: toTemplate` でVM変換する

### TMH-05 useCreateTemplateMutation/useUpdateTemplateMutation/useDeleteTemplateMutation が公開される
- 観点: Mutation hook提供方針への準拠
- 期待結果:
  - `useCreateTemplateMutation`
  - `useUpdateTemplateMutation`
  - `useDeleteTemplateMutation`
  が `useMutation` を使って公開される

### TMH-06 create mutation が createTemplate を呼び、成功時に template lists を invalidate する
- 観点: mutate後の一覧再取得要件の担保
- 期待結果:
  - `createTemplate(wardrobeId, body)` をmutationFnに利用する
  - 成功時に `queryKeys.template.lists(wardrobeId)` をinvalidateする

### TMH-07 update/delete mutation が template detail/list と history(byWardrobe) を invalidate する
- 観点: TanStack Query設計の波及invalidate（template/history）への準拠
- 期待結果:
  - update: `updateTemplate(wardrobeId, templateId, body)` を呼ぶ
  - delete: `deleteTemplate(wardrobeId, templateId)` を呼ぶ
  - 成功時に以下をinvalidateする
    - `queryKeys.template.detail(wardrobeId, templateId)`
    - `queryKeys.template.lists(wardrobeId)`
    - `queryKeys.history.byWardrobe(wardrobeId)`

### TMH-08 テンプレ一覧 query に staleTime 方針（60秒）が反映される
- 観点: 一覧queryのキャッシュ方針統一
- 期待結果:
  - `TEMPLATE_LIST_STALE_TIME_MS = 60_000` が定義される
  - 一覧queryに `staleTime: TEMPLATE_LIST_STALE_TIME_MS` が設定される

## CI適用

- `.github/workflows/ci.yml` に `Template Query/Mutation hooks spec test` を追加し、PR時に自動検証する
