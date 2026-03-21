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
  - `src/components/app/screens/ScreenPrimitives.tsx`

### UF-02 RootLayout に Toaster が組み込まれている
- 観点: 全画面でトースト表示可能か
- 期待結果: `src/app/layout.tsx` に `Toaster` の import と描画がある

### UF-03 ワードローブ作成画面で Button/Input を利用している
- 観点: 実画面で shadcn/ui コンポーネントが利用されているか
- 期待結果: `WardrobeCreateScreen.tsx` で `Button` と `Input` を import し、JSXで利用している

### UF-04 入力未設定時に destructive トーストでエラー通知する
- 観点: エラー通知がトースト経由で実行されるか
- 期待結果: 空入力判定時に `variant: "destructive"` の toast 呼び出しがある

### UF-05 作成成功時は作成完了クエリ付きでホームへ遷移する
- 観点: 作成完了トースト表示トリガー連携
- 期待結果: `WardrobeCreateScreen.tsx` で `ROUTES.home(DEMO_IDS.wardrobe)` に `?created=1` を付与して遷移する

### UF-06 入力エラー文言が strings に定義されている
- 観点: 文言定義の集約ルール準拠
- 期待結果: `features/wardrobe/strings.ts` に `nameRequired` メッセージが存在する

### UF-07 ToastViewport が画面最下部中央に配置される
- 観点: スマホ表示時のトースト配置崩れ防止
- 期待結果: `src/components/ui/toast.tsx` で `ToastViewport` が `bottom + center` 配置になっている

### UF-08 ホーム画面遷移後に作成完了トーストを表示し、クエリを除去する
- 観点: ワードローブ作成完了フィードバックの一回表示
- 期待結果:
  - `home/page.tsx` は `searchParams` を参照しない（静的レンダリング制約を維持）
  - `HomeTabScreen.tsx` で `window.location.search` の `created` クエリを判定し、トースト表示する
  - 表示後に `window.history.replaceState(..., ROUTES.home(wardrobeId))` でクエリを除去する

### UF-09 スクリーン実装は ScreenCard基盤または画面要件に沿った直接描画で構成される
- 観点: UI基盤の適用方針と画面要件の両立
- 期待結果:
  - `HistoriesTabScreen.tsx` / `ClothingsTabScreen.tsx` / `TemplatesTabScreen.tsx` は `ScreenCard` でラップせず、一覧要素を直接描画する
  - `RecordByCombinationScreen.tsx` はフォーム画面要件に合わせて `ScreenCard` でラップせず、`form` と `fieldset` を直接描画する
  - それ以外の画面では `ScreenCard` または `ScreenTextCard` の利用が確認できる

### UF-10 旧 screen-* クラス依存が除去されている
- 観点: 旧スタイル実装からの完全移行
- 期待結果: `components/app/screens/*.tsx` に `screen-panel` / `screen-link-list` / `screen-link` が残っていない

### UF-11 指定された記録/追加アクションは Button 基盤を利用している
- 観点: 主要アクション導線のUI統一
- 期待結果:
  - `＋ 着た記録`
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
