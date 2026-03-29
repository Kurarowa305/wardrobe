# IDクエリパラメータルーティングテスト設計

## 目的

- バックログ「IDをクエリパラメータへ寄せる」の仕様を継続的に検証する
- `/home?wardrobeId=...` を起点とした固定パス + query ID ルーティングの逸脱を CI で早期検知する

## 対象スクリプト

- `apps/web/scripts/check-query-id-routing-spec.mjs`
- 実行コマンド: `pnpm --filter web test:query-id-routing`

## テストケース

### QIR-01 ROUTES が固定パス + query パラメータ構築ヘルパーで定義される
- 観点: ルーティング仕様の中心を `ROUTES` に集約できているか
- 期待結果:
  - `buildPathWithQuery` が定義される
  - `home/histories/templates/clothings/record` が固定パスで構築される

### QIR-02 詳細/編集導線がIDを query パラメータへ載せる
- 観点: `historyId/templateId/clothingId` の path ID 廃止
- 期待結果:
  - `ROUTES.historyDetail/templateDetail/templateEdit/clothingDetail/clothingEdit` が query ID を付与する

### QIR-03 operation toast 付与時に既存queryを保持したまま toast を追加できる
- 観点: `wardrobeId` を保持したまま成功トースト導線を維持できるか
- 期待結果:
  - `appendOperationToast` が既存の検索パラメータを保持して `toast` を追加する

### QIR-04 query パラメータ解決用の共通hookが存在する
- 観点: ページごとの重複実装を防げているか
- 期待結果:
  - `useWardrobeIdFromQuery`
  - `useHistoryRouteIdsFromQuery`
  - `useTemplateRouteIdsFromQuery`
  - `useClothingRouteIdsFromQuery`
  が `features/routing/queryParams.ts` に定義される

### QIR-05 新しい固定パス page.tsx 群が存在し、旧 wardrobeId 動的ルートは除去される
- 観点: App Router の実体が新URL体系へ移行済みか
- 期待結果:
  - `/home`, `/histories`, `/templates`, `/clothings`, `/record` とその詳細/編集/追加ページが存在する
  - `src/app/wardrobes/[wardrobeId]` が存在しない

### QIR-06 トップレベル4タブページが Suspense + wardrobeId query 解決を行う
- 観点: static export 前提で query 解決を安全に実装できているか
- 期待結果:
  - `home/histories/templates/clothings` 各ページで `Suspense` と `useWardrobeIdFromQuery` を利用する

### QIR-07 詳細ページが wardrobeId + 各IDを query から解決する
- 観点: 詳細/編集ページが query ID 前提で動作するか
- 期待結果:
  - `histories/detail`, `templates/detail`, `templates/edit`, `clothings/detail`, `clothings/edit` で専用hookが利用される

### QIR-08 新規テストスクリプトが package.json と CI に登録される
- 観点: ローカルだけでなく CI でも継続検証できるか
- 期待結果:
  - `apps/web/package.json` に `test:query-id-routing` が登録される
  - `.github/workflows/ci.yml` に `Query ID routing spec test` が追加される

## CI適用

- `.github/workflows/ci.yml` に `Query ID routing spec test` を追加し、push時に自動検証する

## PRサマリーに記載するテストケース

- QIR-01 ROUTES の固定パス + query 構築
- QIR-02 詳細/編集導線の query ID 化
- QIR-03 operation toast 付与時の既存 query 維持
- QIR-04 query 解決共通hookの追加
- QIR-05 固定パスpage移行と旧動的ルート除去
- QIR-06 タブページの Suspense + wardrobeId query 解決
- QIR-07 詳細ページの query ID 解決
- QIR-08 package.json / CI へのテスト登録
