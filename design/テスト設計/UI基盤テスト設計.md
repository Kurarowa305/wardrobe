# UI基盤テスト設計（MS0-T04）

## 目的

- MS0-T04（shadcn/ui 導入＋トースト基盤）の完了条件を継続的に検証する
- `Button` / `Input` / `Toast` の利用可能状態と、エラー通知導線をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-ui-foundation-spec.mjs`
- 実行コマンド: `pnpm --filter web test:ui-foundation`

## テストケース

### UF-01 shadcn/ui 基盤ファイルが存在する
- 観点: `Button` / `Input` / `Toast` 実装ファイルと `cn` ユーティリティの有無
- 期待結果: 以下が存在する
  - `src/components/ui/button.tsx`
  - `src/components/ui/card.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/toast.tsx`
  - `src/components/ui/toaster.tsx`
  - `src/components/ui/use-toast.ts`
  - `src/lib/utils.ts`

### UF-02 RootLayout に Toaster が組み込まれている
- 観点: 全画面でトースト表示可能か
- 期待結果: `src/app/layout.tsx` に `Toaster` の import と描画がある

### UF-03 ワードローブ作成画面で Button/Input を利用している
- 観点: 実画面で shadcn/ui コンポーネントが利用されているか
- 期待結果: `WardrobeCreateScreen.tsx` で `Button` と `Input` を import し、JSXで利用している

### UF-04 入力未設定時は非活性で送信を防止し、入力エラートーストに依存しない
- 観点: バリデーション方針をUI制御へ統一できているか
- 期待結果:
  - `trimmedName` と `isSubmitDisabled` で送信可否を制御する
  - `variant: "destructive"` と `WARDROBE_STRINGS.create.errors` 参照が存在しない

### UF-05 作成成功時は API返却ID を使って共通トーストクエリ付きでホームへ遷移する
- 観点: 作成完了トースト表示トリガー連携
- 期待結果:
  - `useCreateWardrobeMutation` で作成APIを呼ぶ
  - `appendOperationToast(ROUTES.home(created.wardrobeId), OPERATION_TOAST_IDS.wardrobeCreated)` を利用して遷移する

### UF-06 入力エラー文言が strings に残っていない
- 観点: 文言定義の集約ルール準拠
- 期待結果: `features/wardrobe/strings.ts` に `errors` / `nameRequired` が存在しない

### UF-07 ToastViewport が画面最上部中央に配置される
- 観点: スマホ表示時のトースト配置崩れ防止
- 期待結果: `src/components/ui/toast.tsx` で `ToastViewport` が `top + center` 配置になっている

### UF-08 ホーム画面遷移後に作成完了トーストを表示し、クエリを除去する
- 観点: ワードローブ作成完了フィードバックの一回表示
- 期待結果:
  - `home/page.tsx` は `searchParams` を参照しない（静的レンダリング制約を維持）
  - `HomeTabScreen.tsx` で `window.location.search` の `created` クエリを判定し、トースト表示する
  - 表示後に `window.history.replaceState(..., ROUTES.home(wardrobeId))` でクエリを除去する

### UF-09 スクリーン実装は全画面で ScreenCard を使わない直接描画に統一される
- 観点: UI基盤の適用方針を画面単位の直接描画へ統一できていること
- 期待結果:
  - すべての対象画面で `ScreenCard` / `ScreenTextCard` / `ScreenPrimitives` の参照が存在しない
  - 一覧・詳細・フォーム画面のいずれも外側カードデザインなしで描画される
  - 直接描画へ移行した画面が、それぞれの文言・フォーム・一覧表示要件を継続して満たす

### UF-10 旧 screen-* クラス依存が除去されている
- 観点: 旧スタイル実装からの完全移行
- 期待結果: `components/app/screens/*.tsx` に `screen-panel` / `screen-link-list` / `screen-link` が残っていない

### UF-11 指定された記録/追加アクションは Button 基盤を利用している
- 観点: 主要アクション導線のUI統一
- 期待結果:
  - `＋ 記録する`
  - `テンプレートで記録`
  - `服の組み合わせで記録`
  - `記録`（テンプレートで記録画面 / 服の組み合わせで記録画面）
  - `＋ テンプレートを追加`
  - `追加`（テンプレートの追加画面）
  - `＋ 服を追加`
  - `追加`（服の追加画面）
  が `ScreenLinkButton` ではなく `Button` で描画されている

## CI適用

- `.github/workflows/ci.yml` に `UI foundation spec test` を追加し、PR時に自動検証する
