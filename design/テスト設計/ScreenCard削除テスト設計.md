# ScreenCard削除テスト設計

## 目的

- ScreenCard を利用していた各画面が、共通コンポーネントに依存せず直接描画へ移行していることをCIで継続検証する。
- ScreenPrimitives から ScreenCard 実装そのものが削除され、UI基盤テストと整合した状態を維持する。

## 対象

- `apps/web/src/components/app/screens/ScreenPrimitives.tsx`
- `apps/web/src/components/app/screens/ClothingCreateScreen.tsx`
- `apps/web/src/components/app/screens/ClothingEditScreen.tsx`
- `apps/web/src/components/app/screens/RecordByTemplateScreen.tsx`
- `apps/web/src/components/app/screens/TemplateCreateScreen.tsx`
- `apps/web/src/components/app/screens/TemplateEditScreen.tsx`
- `apps/web/src/components/app/screens/ClothingDetailScreen.tsx`
- `apps/web/src/components/app/screens/HistoryDetailScreen.tsx`
- `apps/web/src/components/app/screens/TemplateDetailScreen.tsx`
- `apps/web/scripts/check-screen-card-removal-spec.mjs`
- `.github/workflows/ci.yml`

## テスト観点

### SCR-01 ScreenPrimitives から ScreenCard 実装が削除されている

- 観点: 共通ラッパーとしての ScreenCard が残存せず、ScreenTextCard のみが必要最小限のカード描画を担うこと。
- 期待結果:
  - `ScreenPrimitives.tsx` に `type ScreenCardProps` が存在しない。
  - `ScreenPrimitives.tsx` に `export function ScreenCard` が存在しない。

### SCR-02 ScreenCard 利用画面が直接描画ラッパーへ移行している

- 観点: ScreenCard を利用していた画面が、自前の `div` ラッパーでレイアウトと見た目を維持していること。
- 期待結果:
  - 対象画面に `ScreenCard` の import / JSX 利用が存在しない。
  - 各画面に `rounded-xl border border-slate-200 bg-white p-4 shadow-sm` を含む直接描画ラッパーが存在する。

## テスト手段

- `pnpm --filter web test:screen-card-removal` をCIおよびローカル確認に追加する。
- 既存の `pnpm --filter web test:ui-foundation` と合わせて、UI基盤方針との整合を確認する。
