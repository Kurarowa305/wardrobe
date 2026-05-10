# PWA URL起動ワードローブ引き継ぎテスト設計

## 目的

- iPhone Chrome など、ブラウザとホーム画面Web Appで `localStorage` が共有されない環境でも、標準PWA追加時の起動URLから `wardrobeId` を引き継げることをCIで継続的に担保する
- `manifest.webmanifest` の `start_url` 固定により `/home?wardrobeId=...` の query が落ち、PWA初回起動でワードローブ新規作成画面へ遷移する退行を防止する

## 対象

- `apps/web/public/manifest.webmanifest`
- `apps/web/src/features/routing/queryParams.ts`
- `apps/web/src/app/home/page.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/scripts/check-pwa-start-url-current-page-spec.mjs`
- `apps/web/package.json`
- `.github/workflows/ci.yml`

## テスト観点

### 1. manifest 起動URL

- `manifest.webmanifest` に `start_url` が存在しないこと
- `scope: "/"` が定義され、`/home?wardrobeId=...` 起動後もアプリ範囲内として扱えること

### 2. PWA 基本設定

- `id: "/"`、`display: "standalone"`、`theme_color: "#000000"` が維持されていること
- `192x192` / `512x512` のホーム画面アイコン定義が維持されていること

### 3. URL query からの保存

- `/home?wardrobeId=...` で起動した場合に、既存の `useWardrobeIdFromQuery()` 経由で `writeLastWardrobeId(wardrobeId)` が実行されること

### 4. 既存復帰処理

- `/` 起動時は既存どおり保存済み `wardrobeId` を読んでホームへ復帰すること

### 5. CI組み込み

- `pnpm --filter web test:pwa-start-url-current-page` が `apps/web/package.json` に定義されていること
- `.github/workflows/ci.yml` から当該テストが実行されること

## テストケース

| ケースID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| PSC-01 | manifest 起動URL | `manifest.webmanifest` を確認する | `start_url` が存在しない |
| PSC-02 | manifest scope | `manifest.webmanifest` を確認する | `scope` が `/` で定義されている |
| PSC-03 | PWA 基本設定 | `manifest.webmanifest` を確認する | `id` / `display` / `theme_color` / `192x192` / `512x512` アイコンが維持されている |
| PSC-04 | URL query 保存 | `queryParams.ts` と `home/page.tsx` を確認する | `/home?wardrobeId=...` 起動時に `wardrobeId` を保存する導線がある |
| PSC-05 | 既存復帰処理 | `app/page.tsx` を確認する | 保存済み `wardrobeId` を読んで `ROUTES.home(savedWardrobeId)` へ遷移する |
| PSC-06 | CI組み込み | `package.json` と `ci.yml` を確認する | `test:pwa-start-url-current-page` が package.json と CI の双方に登録されている |

## 実装方針

- Node.js スクリプト `apps/web/scripts/check-pwa-start-url-current-page-spec.mjs` で manifest と既存ルーティング保存導線を静的検証する
- GitHub Actions の CI で `pnpm --filter web test:pwa-start-url-current-page` を継続実行し、PWA起動URL引き継ぎの退行を防止する

## PRサマリーに記載するテストケース

- PSC-01 manifest に `start_url` が存在しない
- PSC-02 manifest に `scope: "/"` が存在する
- PSC-03 manifest の `id` / `display` / `theme_color` / ホーム画面アイコンが維持されている
- PSC-04 `/home?wardrobeId=...` 起動時に query から `wardrobeId` を保存する
- PSC-05 `/` 起動時の保存済み `wardrobeId` 復帰処理を維持する
- PSC-06 `test:pwa-start-url-current-page` の package.json / CI 登録
