# AWS実環境接続切替テスト設計

## 1. 目的

- `apps/web` が `MSW / fixture / defaultId` に依存せず、AWS実環境APIと実IDで動作する実装になっていることを継続検証する。
- SSR運用前提（`output: "export"` 非依存）へ切り替わっていることをCIで担保する。

## 2. 対象

- `apps/web/next.config.ts`
- `apps/web/src/mocks/start.ts`
- `apps/web/src/api/schemas/wardrobe.ts`
- `apps/web/src/api/endpoints/wardrobe.ts`
- `apps/web/src/components/app/screens/WardrobeCreateScreen.tsx`
- `apps/web/src/app/wardrobes/[wardrobeId]/**/page.tsx`
- `apps/web/scripts/check-aws-runtime-integration-spec.mjs`
- `.github/workflows/ci.yml`

## 3. テストケース

### ARI-01 Next.js 設定が SSR 前提になっている
- 観点: static export 依存の残存防止
- 期待結果:
  - `next.config.ts` に `output: "export"` が存在しない

### ARI-02 MSW 起動判定がフラグ制御に統一されている
- 観点: デプロイ環境でのモック誤起動防止
- 期待結果:
  - `src/mocks/start.ts` が `NEXT_PUBLIC_ENABLE_MSW === "true"` を条件に判定する

### ARI-03 ワードローブ API client が実装されている
- 観点: `defaultId` 依存の撤廃
- 期待結果:
  - `src/api/schemas/wardrobe.ts` が存在する
  - `src/api/endpoints/wardrobe.ts` に `createWardrobe` / `getWardrobe` があり、`/wardrobes` を利用する

### ARI-04 作成画面がAPI返却 wardrobeId で遷移する
- 観点: 仮ID遷移の排除
- 期待結果:
  - `WardrobeCreateScreen.tsx` で `useCreateWardrobeMutation` を使う
  - `mutateAsync` の返却値 `created.wardrobeId` を `ROUTES.home(...)` に渡す
  - `ROUTES.home(DEMO_IDS.wardrobe)` が存在しない

### ARI-05 動的ページに fixture/static params 依存が残っていない
- 観点: runtime実ID遷移時の固定ID混入防止
- 期待結果:
  - `wardrobeId` 配下の動的ページに `generateStaticParams` / fixture import / `DEMO_IDS` / `MOCK_` が存在しない

## 4. 実行方法

- 実行コマンド: `pnpm --filter web test:aws-runtime-integration`
- 実装方式: Node.js による静的検査スクリプト

## 5. CI組み込み

- `.github/workflows/ci.yml` に `AWS runtime integration spec test` を追加する。
- push時に自動実行し、実環境接続方針の退行を検知する。
