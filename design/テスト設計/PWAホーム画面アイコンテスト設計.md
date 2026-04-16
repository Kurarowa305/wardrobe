# PWAホーム画面アイコンテスト設計

## 目的

- Chrome の「ホーム画面に追加」で `manifest.webmanifest` に定義したアイコンが利用される前提を CI で継続的に担保する
- Next.js App Router の `metadata` から `manifest` / `icon` / `apple-touch-icon` が公開されることを静的検証する
- `theme_color` とホーム画面アイコン定義の欠落による PWA 設定漏れの再発を防止する

## 対象

- `apps/web/src/app/layout.tsx`
- `apps/web/public/manifest.webmanifest`
- `apps/web/scripts/check-pwa-home-icon-spec.mjs`
- `apps/web/package.json`
- `.github/workflows/ci.yml`

## テスト観点

### 1. Next.js metadata 公開

- `layout.tsx` の `metadata` に `manifest: "/manifest.webmanifest"` が定義されていること
- `layout.tsx` の `icons` に `icon` / `shortcut` / `apple` が定義されていること
- `layout.tsx` の `appleWebApp` でホーム画面追加時の Apple 系メタ情報が定義されていること

### 2. Viewport / theme color

- `layout.tsx` の `viewport` に `themeColor` が定義されていること
- `manifest.webmanifest` の `theme_color` と整合していること

### 3. manifest アイコン定義

- `manifest.webmanifest` に `192x192` / `512x512` の PNG アイコンが定義されていること
- `start_url` / `display` / `id` がホーム画面起動向けに維持されていること
- 各アイコンが `purpose: "any"` を持ち、ホーム画面アイコンとして利用可能な状態であること

### 4. CI組み込み

- `pnpm --filter web test:pwa-home-icon` が `apps/web/package.json` に定義されていること
- `.github/workflows/ci.yml` から当該テストが実行されること

## テストケース

| ケースID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| PHI-01 | Next.js metadata 公開 | `layout.tsx` を確認する | `manifest` / `icon` / `shortcut` / `apple` / `appleWebApp` が定義されている |
| PHI-02 | Viewport / theme color | `layout.tsx` と `manifest.webmanifest` を確認する | `viewport.themeColor` と `manifest.theme_color` が `#000000` で整合している |
| PHI-03 | manifest アイコン定義 | `manifest.webmanifest` を確認する | `192x192` と `512x512` の PNG アイコン、および `id` / `start_url` / `display` が定義されている |
| PHI-04 | CI組み込み | `package.json` と `ci.yml` を確認する | `test:pwa-home-icon` が npm script と CI に登録されている |

## 実装方針

- Node.js スクリプト `apps/web/scripts/check-pwa-home-icon-spec.mjs` で `layout.tsx` と `manifest.webmanifest` の静的構成を検証する
- GitHub Actions の CI で `pnpm --filter web test:pwa-home-icon` を継続実行し、ホーム画面アイコン設定の退行を防止する

## PRサマリーに記載するテストケース

- PHI-01 `layout.tsx` が `manifest` / `icon` / `shortcut` / `apple` / `appleWebApp` を公開
- PHI-02 `viewport.themeColor` と `manifest.theme_color` の整合
- PHI-03 `manifest.webmanifest` の `192x192` / `512x512` アイコン定義と PWA 起動設定
- PHI-04 `test:pwa-home-icon` の package.json / CI 登録
