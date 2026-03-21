# ScreenCard削除テスト設計

## 1. 目的
- 全画面から `ScreenCard` / `ScreenTextCard` / `ScreenPrimitives.tsx` の依存を除去し、直接描画へ統一した状態を継続的に検証する。
- `ScreenCard` 削除後も、各画面が外側カードなしで画面要件に沿ったレイアウトを維持していることを確認する。

## 2. 対象
- `apps/web/src/components/app/screens/*.tsx`
- `apps/web/scripts/check-screen-card-removal-spec.mjs`
- `.github/workflows/ci.yml`

## 3. テスト方針
- 文字列ベースの静的検証スクリプトで、対象画面から `ScreenCard` 系参照が消えていることを確認する。
- 主要画面は直接描画ラッパーとして `className="grid gap-4"` を持つことを確認し、カード外枠を戻していないことを検証する。
- CI に組み込み、今後の変更で `ScreenCard` が再導入された場合に即座に検知する。

## 4. テストケース

### SCR-01 ScreenPrimitives 実装ファイルが削除されている
- 観点: `ScreenCard` 本体実装を完全に撤去できていること
- 期待結果: `apps/web/src/components/app/screens/ScreenPrimitives.tsx` が存在しない

### SCR-02 全対象画面から ScreenCard 系参照が除去されている
- 観点: 画面側の import / JSX / 文字列依存が残っていないこと
- 期待結果:
  - 対象全画面に `ScreenCard` / `ScreenTextCard` / `ScreenPrimitives` の参照が存在しない
  - 直接描画構成へ移行した状態が維持される

### SCR-03 主要画面が直接描画ラッパーを持つ
- 観点: 外側カードではなく、画面自身の余白・縦積みレイアウトで構成されていること
- 対象画面:
  - `RecordByTemplateScreen.tsx`
  - `TemplateDetailScreen.tsx`
  - `ClothingDetailScreen.tsx`
  - `HistoryDetailScreen.tsx`
- 期待結果: 各画面に `className="grid gap-4"` が存在する

## 5. CI適用
- GitHub Actions `CI` ワークフローで `pnpm --filter web test:screen-card-removal` を実行する。
- `pnpm install --frozen-lockfile` 後に走らせ、依存関係とテストスクリプトの整合を同時に確認する。
