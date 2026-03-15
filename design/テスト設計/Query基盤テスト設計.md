# Query基盤テスト設計（MS0-T05）

## 目的

- MS0-T05（TanStack Query セットアップ）の完了条件を継続的に検証する
- QueryClient Provider の全体適用、エラーハンドリング下地、開発時キャッシュ確認導線をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-query-foundation-spec.mjs`
- 実行コマンド: `pnpm --filter web test:query-foundation`

## テストケース

### QF-01 web package に TanStack Query 依存が追加されている
- 観点: ライブラリ導入漏れ防止
- 期待結果: `apps/web/package.json` の `dependencies` に `@tanstack/react-query` が存在する

### QF-02 RootLayout が AppProviders で全体をラップしている
- 観点: 全画面で `useQuery` / `useMutation` を利用できる前提があるか
- 期待結果: `src/app/layout.tsx` に `AppProviders` の import とラップ構造が存在する

### QF-03 AppProviders が QueryClientProvider を初期化している
- 観点: QueryClient がクライアント境界で1箇所から提供されるか
- 期待結果: `src/lib/providers/AppProviders.tsx` が `use client` で、`QueryClientProvider` と `createAppQueryClient` を利用している

### QF-04 queryClient で Query/Mutation のエラーハンドリング下地が定義されている
- 観点: API連携時の共通エラーハンドリング方針を追加できる構造か
- 期待結果: `src/lib/queryClient.ts` で `QueryCache` / `MutationCache` の `onError` が実装されている

### QF-05 queryClient の defaultOptions が定義されている
- 観点: 再試行やキャッシュ寿命の基準値が集約されているか
- 期待結果: `defaultOptions` に `staleTime` / `retry` / `refetchOnWindowFocus` などの基本設定がある

### QF-06 開発時にキャッシュ状態を確認できる導線がある
- 観点: 完了条件「Devtools or console」の満たし込み
- 期待結果:
  - `window.__WARDROBE_QUERY_CLIENT__` に QueryClient を公開している
  - `queryCache.subscribe` によるログ出力がある

## CI適用

- `.github/workflows/ci.yml` に `Query foundation spec test` を追加し、PR時に自動検証する
