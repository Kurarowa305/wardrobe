# ワードローブID整合性テスト設計

## 目的

- ワードローブ新規作成後に `wardrobeId=1` へ誤遷移する不具合の再発を防止する
- `POST /wardrobes` 応答の `wardrobeId` 契約と、query パラメータ解決時のID整合性を CI で継続検証する

## 対象スクリプト

- `apps/web/scripts/check-wardrobe-id-integrity-spec.mjs`
- 実行コマンド: `pnpm --filter web test:wardrobe-id-integrity`

## テストケース

### WIG-01 wardrobeId のバリデーション関数が wd_ 形式を判定する
- 観点: `wardrobeId` の契約（`wd_...`）をUI層でも判定できるか
- 期待結果:
  - `src/api/schemas/wardrobe.ts` に `isWardrobeId` が存在する
  - `wd_` 形式の判定パターンを持つ

### WIG-02 ワードローブ作成APIレスポンスをランタイム検証する
- 観点: API契約逸脱（`wardrobeId` 欠落・不正形式）を受け入れないか
- 期待結果:
  - `src/api/endpoints/wardrobe.ts` が `POST /wardrobes` の結果を `unknown` で受ける
  - `parseCreateWardrobeResponseDto` で `wardrobeId` を検証する
  - 不正時に `INVALID_RESPONSE` を投げる

### WIG-03 query パラメータ解決が DEMO_IDS にフォールバックしない
- 観点: `wardrobeId` 欠落時に固定値 `1` へ収束しないか
- 期待結果:
  - `src/features/routing/queryParams.ts` が `DEMO_IDS.*` フォールバックを持たない
  - query 欠落時は空文字として扱う

### WIG-04 必須ID欠落時に /wardrobes/new へリダイレクトするガードhookを持つ
- 観点: `wardrobeId` 欠落状態でタブ画面を描画し続けないか
- 期待結果:
  - `useRedirectToWardrobeNewIfMissing` が存在する
  - ID欠落時に `router.replace(ROUTES.wardrobeNew)` を実行する

### WIG-05 query 解決ページが欠落IDガードを利用する
- 観点: 主要ページすべてで欠落IDガードが適用されるか
- 期待結果:
  - `home/histories/templates/clothings/record` 系および詳細/編集/追加ページで `useRedirectToWardrobeNewIfMissing` を利用する

## CI適用

- `.github/workflows/ci.yml` に `Wardrobe ID integrity spec test` を追加し、push 時に自動検証する

## PRサマリーに記載するテストケース

- WIG-01 wardrobeId バリデーション関数
- WIG-02 作成APIレスポンスのランタイム検証
- WIG-03 query解決での DEMO_IDS フォールバック除去
- WIG-04 欠落IDリダイレクトガードhook
- WIG-05 query解決ページの欠落IDガード適用
