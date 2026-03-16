# Clothing一覧画面テスト設計（MS1-T07）

## 目的

- MS1-T07（服一覧画面）の完了条件を継続的に検証する
- 一覧表示・空状態・ローディング・追加読み込み導線をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-list-screen-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-list-screen`

## テストケース

### CLS-01 服一覧画面が規定ファイルに存在する
- 観点: 実装配置の統一
- 期待結果: `apps/web/src/components/app/screens/ClothingsTabScreen.tsx` が存在する

### CLS-02 服一覧画面が useClothingList を利用し、cursorページングで取得する
- 観点: MS1-T05 hooks再利用とページング要件への準拠
- 期待結果:
  - client component として実装される
  - `useClothingList(wardrobeId, { limit, cursor })` を利用する
  - `limit` にページサイズ定数を使う

### CLS-03 一覧画面に「＋ 服を追加」導線がある
- 観点: 服追加画面への主要導線
- 期待結果:
  - `CLOTHING_STRINGS.list.actions.add` を表示する
  - 遷移先が `ROUTES.clothingNew(wardrobeId)` である

### CLS-04 読込中・空状態・読込失敗の表示を持つ
- 観点: 状態別表示要件（空/読込）
- 期待結果:
  - `loading` / `empty` / `error` の各文言が画面で利用される

### CLS-05 服カードが詳細遷移し、画像なし時に no image を表示する
- 観点: 完了条件「服名＋画像サムネ（なければ no image）」「タップで詳細へ」
- 期待結果:
  - 各カードの遷移先が `ROUTES.clothingDetail(wardrobeId, item.clothingId)` である
  - 画像キーなしの場合に `COMMON_STRINGS.placeholders.noImage` を表示する
  - 服名（`item.name`）を表示する

### CLS-06 nextCursor がある場合に「さらに読み込む」で追加取得できる
- 観点: 完了条件「nextCursorがあれば追加読み込みできる」
- 期待結果:
  - `nextCursor` の state を保持する
  - APIレスポンスの `data.nextCursor` を state に反映する
  - 「さらに読み込む」押下で `setCursor(nextCursor)` が実行される

### CLS-07 服一覧画面向け文言が strings に定義される
- 観点: 文言設計ルール（文言の集約）
- 期待結果:
  - `src/features/clothing/strings.ts` に `loadMore` を定義する
  - `loading` / `empty` / `error` を定義する

## CI適用

- `.github/workflows/ci.yml` に `Clothing list screen spec test` を追加し、PR時に自動検証する
