# 服ジャンルアイコンSVG修正テスト設計

## 目的
- 服一覧などで利用するジャンルアイコンのうち、トップスが服タブアイコンと同一SVGで描画されることを担保する。
- ボトムスが長ズボンを想起できるSVGへ差し替わっていることを静的検証で継続保証する。
- 既存のその他アイコンが意図せず変更されないことを確認する。

## 対象スクリプト
- `apps/web/scripts/check-clothing-genre-icon-svg-spec.mjs`

## テストケース

### CGI-01 トップスアイコンが服タブアイコンと同一である
- 観点: 指定SVG反映
- 期待結果:
  - `ClothingGenreIcon` の `tops` 分岐が服タブと同じ `path` を持つ
  - 線スタイルとして `strokeLinecap="round"` と `strokeLinejoin="round"` を持つ

### CGI-02 ボトムスアイコンが長ズボンSVGである
- 観点: デザイン要件反映
- 期待結果:
  - `ClothingGenreIcon` の `bottoms` 分岐が指定された長ズボンSVGの2本の `path` を持つ
  - 線スタイルとして `strokeLinecap="round"` と `strokeLinejoin="round"` を持つ

### CGI-03 その他アイコンが既存仕様を維持する
- 観点: 退行防止
- 期待結果:
  - `others` 分岐の `circle` と `path` が維持される

## CI適用
- `apps/web/package.json` に `pnpm --filter web test:clothing-genre-icon-svg` を追加する。
- `.github/workflows/ci.yml` に服ジャンルアイコンSVG検証ステップを追加し、push時に継続実行する。

## PRサマリーに記載するテストケース
- CGI-01 トップスアイコンが服タブアイコンと同一
- CGI-02 ボトムスアイコンが長ズボンSVG
- CGI-03 その他アイコンが既存仕様を維持
