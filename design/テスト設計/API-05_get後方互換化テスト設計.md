# API-05 get 後方互換化テスト設計

## 目的
- API-05（服詳細取得）において、過去データに `status` / `wearCount` / `lastWornAt` が欠落していても、`NOT_FOUND` ではなく後方互換補完で返却できることを担保する。

## 対象
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/clothing/dto/clothingDetailDto.ts`
- `apps/api/scripts/check-clothing-get-backward-compat-spec.mjs`
- CI ジョブ（`.github/workflows/ci.yml`）の API テストステップ

## 前提
- 服のベース項目（`wardrobeId`, `clothingId`, `name`, `genre`, `imageKey`）は存在する。
- 互換補完ポリシーは以下。
  - `status` 欠落時: `ACTIVE` として扱う
  - `wearCount` 欠落時: `0`
  - `lastWornAt` 欠落時: `0`

## テストケース

### API05-BC-01 欠落項目をデフォルト補完して返却できる
- 観点: `status` / `wearCount` / `lastWornAt` 欠落データを API-05 get が返却できるか
- 入力:
  - repo.get が `status` / `wearCount` / `lastWornAt` なしの `Item` を返す
- 期待結果:
  - `status === "ACTIVE"`
  - `wearCount === 0`
  - `lastWornAt === 0`
  - `NOT_FOUND` にならない

### API05-BC-02 status=DELETED は保持しつつ欠落カウンタを補完できる
- 観点: 既存 `status` は優先し、欠落項目のみ補完できるか
- 入力:
  - repo.get が `status: "DELETED"` のみ持つ `Item` を返す
- 期待結果:
  - `status === "DELETED"`
  - `wearCount === 0`
  - `lastWornAt === 0`

### API05-BC-03 実装と CI 配線の退行防止
- 観点: 後方互換ロジックと CI 実行が維持されるか
- 入力:
  - usecase ソース、共通 DTO helper、`apps/api/package.json`、`.github/workflows/ci.yml` を静的検査
- 期待結果:
  - `clothingUsecase.ts` に `extractClothingItemWithBackwardCompatibility` と `toClothingDetailResponseDto` の利用が存在する
  - `clothingDetailDto.ts` に `status` / `wearCount` / `lastWornAt` の補完式が存在する
  - `test:clothing-get-backward-compat` が package script に存在する
  - CI で `pnpm --filter api test:clothing-get-backward-compat` が実行される
