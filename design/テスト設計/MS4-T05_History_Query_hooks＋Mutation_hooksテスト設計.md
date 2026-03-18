# MS4-T05 History Query hooks＋Mutation hooksテスト設計

## 目的

- MS4-T05（History Query hooks＋Mutation hooks）の完了条件を継続的に検証する
- 履歴一覧/詳細/最近の履歴の Query hook が API クライアントと QueryKey を正しく利用することを固定化する
- create/delete の Mutation 後に、設計どおりの invalidate（history/clothing/template）が実行されることを CI で担保する

## 対象スクリプト

- `apps/web/scripts/check-history-query-mutation-hooks-spec.mjs`
- 実行コマンド: `pnpm --filter web test:history-query-mutation-hooks`

## テストケース

### HMH-01 History Query / Mutation hooks が src/api/hooks/history.ts に存在する
- 観点: 実装ファイル配置の固定化
- 期待結果: `apps/web/src/api/hooks/history.ts` が存在する

### HMH-02 useHistoryList/useRecentHistories/useHistory が useQuery ラッパとして公開される
- 観点: Query hook 提供方針（TanStack Query 設計）への準拠
- 期待結果:
  - `useHistoryList`
  - `useRecentHistories`
  - `useHistory`
  が `useQuery` を使って実装される

### HMH-03 一覧 hook が queryKeys.history.list(params) と listHistories を利用し VM 変換する
- 観点: QueryKey 整合と DTO→VM 変換の担保
- 期待結果:
  - `queryKeys.history.list(wardrobeId, params)` を queryKey に利用する
  - `listHistories(wardrobeId, params)` を queryFn に利用する
  - `response.items.map(toHistoryListItem)` と `nextCursor` を返却する

### HMH-04 recent hook が desc + limit 指定で useHistoryList を再利用する
- 観点: 最近の履歴表示導線での hook 再利用と既定値統一
- 期待結果:
  - `RECENT_HISTORY_LIMIT = 5` が定義される
  - `useRecentHistories` が `useHistoryList` を再利用する
  - `order: "desc"` と `limit` を渡す

### HMH-05 詳細 hook が queryKeys.history.detail(id) と getHistory を利用し VM 変換する
- 観点: 詳細取得の QueryKey 整合と DTO→VM 変換の担保
- 期待結果:
  - `queryKeys.history.detail(wardrobeId, historyId)` を queryKey に利用する
  - `getHistory(wardrobeId, historyId)` を queryFn に利用する
  - `select: toHistory` で VM 変換する

### HMH-06 useCreateHistoryMutation/useDeleteHistoryMutation が useMutation で公開される
- 観点: Mutation hook 提供方針への準拠
- 期待結果:
  - `useCreateHistoryMutation`
  - `useDeleteHistoryMutation`
  が `useMutation` を使って公開される

### HMH-07 create/delete mutation が history/clothing/template を invalidate する
- 観点: TanStack Query 設計の波及 invalidate への準拠
- 期待結果:
  - create: `createHistory(wardrobeId, body)` を呼ぶ
  - delete: `deleteHistory(wardrobeId, historyId)` を呼ぶ
  - 成功時に以下を invalidate する
    - `queryKeys.history.byWardrobe(wardrobeId)`
    - `queryKeys.clothing.byWardrobe(wardrobeId)`
    - `queryKeys.template.byWardrobe(wardrobeId)`

### HMH-08 delete mutation が history detail も invalidate する
- 観点: 詳細画面から削除した際の戻り/再訪問整合
- 期待結果:
  - `queryKeys.history.detail(wardrobeId, historyId)` を invalidate する
  - detail invalidate とドメイン横断 invalidate を `Promise.all` でまとめる

### HMH-09 履歴一覧 query に staleTime 方針（60秒）が反映される
- 観点: 一覧 query のキャッシュ方針統一
- 期待結果:
  - `HISTORY_LIST_STALE_TIME_MS = 60_000` が定義される
  - 一覧 query に `staleTime: HISTORY_LIST_STALE_TIME_MS` が設定される

## CI適用

- `.github/workflows/ci.yml` に `History Query/Mutation hooks spec test` を追加し、PR 時に自動検証する
