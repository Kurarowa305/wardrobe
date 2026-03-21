# Clothing詳細画面テスト設計（MS1-T08）

## 目的

- MS1-T08（服詳細画面）の完了条件を継続的に検証する
- 服詳細の表示（画像＋服名＋着た回数＋最後に着た日）とエラー/削除済み状態表示をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-clothing-detail-screen-spec.mjs`
- 実行コマンド: `pnpm --filter web test:clothing-detail-screen`

## テストケース

### CDS-01 服詳細画面が規定ファイルに存在する
- 観点: 実装配置の統一
- 期待結果: `apps/web/src/components/app/screens/ClothingDetailScreen.tsx` が存在する

### CDS-02 服詳細画面が useClothing を利用して詳細取得する
- 観点: MS1-T05 hooks再利用
- 期待結果:
  - client component として実装される
  - `useClothing(wardrobeId, clothingId)` を利用する

### CDS-03 詳細画面に画像・服名・着た回数・最後に着た日を表示し、画像未設定時は no image を表示する
- 観点: 詳細画面で利用状況を把握できること
- 期待結果:
  - 画像領域に `image` または `COMMON_STRINGS.placeholders.noImage` を表示する
  - `clothingQuery.data.name` を表示する
  - `CLOTHING_STRINGS.detail.labels.wearCount` と `clothingQuery.data.wearCount` を表示する
  - `CLOTHING_STRINGS.detail.labels.lastWornAt` と `formatLastWornAt(clothingQuery.data.lastWornAt)` を表示する

### CDS-04 詳細取得エラー時に 404 とそれ以外で表示を切り分ける
- 観点: 完了条件「詳細取得エラー時の表示（404/500）」
- 期待結果:
  - 404時に `CLOTHING_STRINGS.detail.messages.notFound` を表示する
  - それ以外の失敗時に `CLOTHING_STRINGS.detail.messages.error` を表示する

### CDS-05 削除済み服では「削除済み」表記を表示する
- 観点: 完了条件「削除済みは『削除済み』表記を出す」
- 期待結果:
  - `clothingQuery.data.deleted` が真の場合に `CLOTHING_STRINGS.detail.messages.deleted` を表示する

### CDS-06 服詳細画面向け文言が strings に定義される
- 観点: 文言設計ルール（文言の集約）
- 期待結果:
  - `src/features/clothing/strings.ts` に `wearCount` / `lastWornAt` / `loading` / `error` / `notFound` / `deleted` / `neverWorn` を定義する


### CDS-07 静的エクスポート向けに詳細/編集ルートのパスを fixture 全件で生成する
- 観点: `output: "export"` 環境で一覧→詳細（および詳細→編集）遷移時に404を防止する
- 期待結果:
  - `src/app/wardrobes/[wardrobeId]/(stack)/clothings/[clothingId]/page.tsx` が `clothingDetailFixtures` を使って `generateStaticParams` を構成する
  - `src/app/wardrobes/[wardrobeId]/(stack)/clothings/[clothingId]/edit/page.tsx` も同様に `clothingDetailFixtures` を使って `generateStaticParams` を構成する

### CDS-08 追加直後の服ID（cl_mock_XXXX）向け静的パスを事前生成する
- 観点: 服追加後に一覧から詳細へ遷移した際の404再発防止
- 期待結果:
  - 詳細/編集ページで `MOCK_CLOTHING_ID_PREFIX = "cl_mock_"` を定義する
  - 詳細/編集ページで `generateMockStaticClothingIds()` により `cl_mock_0001` 形式のIDレンジを生成する
  - 詳細/編集ページの `generateStaticParams` が fixture ID に加えて mock IDレンジも含めて返す

## CI適用

- `.github/workflows/ci.yml` に `Clothing detail screen spec test` を追加し、PR時に自動検証する
