# Clothing一覧画面テスト設計（MS1-T07）

## 目的

- MS1-T07（服一覧画面）の完了条件を継続的に検証する
- 一覧表示・空状態・ローディング・登録上限100件前提の取得仕様をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-list-screen-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-list-screen`

## テストケース

### CLS-01 服一覧画面が規定ファイルに存在する
- 観点: 実装配置の統一
- 期待結果: `apps/web/src/components/app/screens/ClothingsTabScreen.tsx` が存在する

### CLS-02 服一覧画面が useClothingList を利用し、ジャンル別に上限100件で取得する
- 観点: MS1-T05 hooks再利用と新しい一覧取得要件への準拠
- 期待結果:
  - client component として実装される
  - `useClothingList(wardrobeId, { genre, limit: 100 })` を利用する
  - tops / bottoms / others の3ジャンルを個別取得する

### CLS-03 一覧画面に「＋ 服を追加」導線がある
- 観点: 服追加画面への主要導線
- 期待結果:
  - `CLOTHING_STRINGS.list.actions.add` を表示する
  - 遷移先が `ROUTES.clothingNew(wardrobeId)` である

### CLS-04 読込中・空状態・読込失敗の表示を持つ
- 観点: 状態別表示要件（空/読込）
- 期待結果:
  - `loading` / `empty` / `error` の各文言が画面で利用される

### CLS-05 各ジャンルを見出し付きセクションで表示し、対応アイコンを出す
- 観点: ジャンル別セクションUI要件
- 期待結果:
  - `ClothingGenreSection` を利用する
  - セクション見出しにジャンルアイコンを表示する
  - 展開/折りたたみ状態を持つ

### CLS-06 服一覧画面に「さらに読み込む」および cursor 状態を持たない
- 観点: 追加読み込み廃止と cursor 削除の反映
- 期待結果:
  - `handleLoadMore` を持たない
  - `nextCursor` / `loadMoreLabel` / `cursor` を一覧画面で扱わない

### CLS-07 服一覧画面向け文言が strings に定義される
- 観点: 文言設計ルール（文言の集約）
- 期待結果:
  - `sectionEmpty` を定義する
  - 服の登録上限100件を案内する `limitNotice` を定義する

## CI適用

- `.github/workflows/ci.yml` の `Clothing list screen spec test` で自動検証する
