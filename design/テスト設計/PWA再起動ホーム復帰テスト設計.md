# PWA再起動ホーム復帰テスト設計

## 目的

- PWA再起動時および通常ブラウザで `/` を開いた時に、最後に利用したワードローブのホームへ復帰できることをCIで継続的に担保する
- `wardrobeId` 永続化、起動時の存在確認、404時フォールバックの退行を防止する

## 対象

- `apps/web/src/features/routing/lastWardrobeStorage.ts`
- `apps/web/src/features/routing/queryParams.ts`
- `apps/web/src/components/app/screens/WardrobeCreateScreen.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/scripts/check-pwa-startup-home-restore-spec.mjs`
- `apps/web/package.json`
- `.github/workflows/ci.yml`

## テスト観点

### 1. wardrobeId 永続化

- query解決hookが有効な `wardrobeId` を取得した時点で `localStorage` へ保存すること
- ワードローブ作成成功時に返却された `wardrobeId` を保存してからホームへ遷移すること

### 2. ルート起動時の復帰

- ルートページが保存済み `wardrobeId` を読めること
- 保存済み `wardrobeId` がある場合は `getWardrobe` で存在確認後に `/home?wardrobeId=...` へ `replace` 遷移すること
- 保存済み `wardrobeId` がない場合は `/wardrobes/new` へ `replace` 遷移すること

### 3. フォールバック

- `getWardrobe(savedWardrobeId)` が 404 の時だけ保存済み `wardrobeId` をクリアし、新規作成画面へフォールバックすること
- 404以外の通信失敗では保存値を維持し、保存済み `wardrobeId` のホームへ遷移して既存画面のエラー表示に委ねること

### 4. CI組み込み

- `pnpm --filter web test:pwa-startup-home-restore` が `apps/web/package.json` に定義されていること
- `.github/workflows/ci.yml` から当該テストが実行されること

## テストケース

| ケースID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| SHR-01 | wardrobeId 永続化 | `queryParams.ts` を確認する | query解決hookが有効な `wardrobeId` を共通hook経由で保存する |
| SHR-02 | 作成直後の保存 | `WardrobeCreateScreen.tsx` を確認する | 作成成功時に返却 `wardrobeId` を保存してからホームへ遷移する |
| SHR-03 | ルート起動時復帰 | `app/page.tsx` を確認する | 保存済み `wardrobeId` を読み、存在確認後に `ROUTES.home(savedWardrobeId)` へ `replace` 遷移する |
| SHR-04 | 保存値欠落フォールバック | `app/page.tsx` を確認する | 保存値なし/不正時に `ROUTES.wardrobeNew` へ `replace` 遷移する |
| SHR-05 | 404時の保存クリア | `app/page.tsx` を確認する | `getWardrobe(savedWardrobeId)` が404の時だけ保存値をクリアして新規作成へ遷移する |
| SHR-06 | CI組み込み | `package.json` と `ci.yml` を確認する | `test:pwa-startup-home-restore` が package.json と CI の双方に登録されている |

## 実装方針

- Node.js スクリプト `apps/web/scripts/check-pwa-startup-home-restore-spec.mjs` で `lastWardrobeStorage.ts`、`queryParams.ts`、`app/page.tsx`、`WardrobeCreateScreen.tsx` の静的構成を検証する
- GitHub Actions の CI で `pnpm --filter web test:pwa-startup-home-restore` を継続実行し、PWA再起動ホーム復帰の退行を防止する

## PRサマリーに記載するテストケース

- SHR-01 query解決hookが有効な `wardrobeId` を保存する
- SHR-02 ワードローブ作成成功時に新規 `wardrobeId` を保存してからホームへ遷移する
- SHR-03 ルートページが保存済み `wardrobeId` を読んでホームへ `replace` 遷移する
- SHR-04 保存値なし/不正時に新規作成画面へフォールバックする
- SHR-05 404時だけ保存値をクリアして新規作成画面へフォールバックする
- SHR-06 `test:pwa-startup-home-restore` の package.json / CI 登録
