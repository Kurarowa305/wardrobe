# TanStack Query基盤テスト設計（MS0-T05）

## 目的

- MS0-T05（TanStack Query セットアップ）の完了条件を継続的に検証する
- `useQuery` / `useMutation` 利用の前提となる `QueryClientProvider` と開発時のキャッシュ確認手段をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-query-foundation-spec.mjs`
- 実行コマンド: `pnpm --filter web test:query-foundation`

## テストケース

### QF-01 TanStack Query の依存パッケージが導入されている
- 観点: React Query と Devtools の利用準備
- 期待結果: `apps/web/package.json` に `@tanstack/react-query` と `@tanstack/react-query-devtools` が定義されている

### QF-02 QueryClient 作成ヘルパーにエラーハンドリング方針が定義されている
- 観点: Query/Mutation 共通のエラー処理方針の下地
- 期待結果: `src/lib/query/queryClient.ts` に `QueryClient` / `QueryCache` / `MutationCache` と開発時エラーログ出力がある

### QF-03 QueryProvider が QueryClientProvider で children をラップしている
- 観点: 全コンポーネントから Query hooks が利用できる基盤
- 期待結果: `src/components/providers/QueryProvider.tsx` で `QueryClientProvider` に `children` を渡している

### QF-04 開発時に React Query Devtools を表示できる
- 観点: 開発時のキャッシュ可視化
- 期待結果: `src/components/providers/QueryProvider.tsx` で `process.env.NODE_ENV === "development"` 条件下に `ReactQueryDevtools` がある

### QF-05 RootLayout で QueryProvider により全画面をラップしている
- 観点: 画面単位で `useQuery` / `useMutation` を使える構造
- 期待結果: `src/app/layout.tsx` で `QueryProvider` が import され、`children` を含む全体をラップしている

## CI適用

- `.github/workflows/ci.yml` に `Query foundation spec test` を追加し、PR時に自動検証する
