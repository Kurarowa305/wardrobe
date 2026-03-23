# BE-MS0-T09 cursor 共通実装テスト設計

## 目的

- BE-MS0-T09（cursor 共通実装）の完了条件を継続的に検証する
- 一覧API共通で利用する cursor の encode/decode、並び順・取得条件の整合性チェック、`INVALID_CURSOR` 正規化をCIで担保する
- `clothing` / `template` / `history` の各一覧APIが同一のカーソル基盤を再利用できる前提を共有ユーティリティで確認する

## 対象スクリプト

- `apps/api/scripts/check-cursor-spec.mjs`
- 実行コマンド: `pnpm --filter api test:cursor`

## テストケース

### CS-01 cursor を共通フォーマットで encode できる
- 観点: 一覧API横断で使える共通 envelope
- 期待結果: `encodeCursor()` が `version/resource/order/filters/position` を保持した正規化済み cursor を生成する

### CS-02 条件一致時に decode でページング位置を復元できる
- 観点: 一覧APIの次ページ取得
- 期待結果: `decodeCursor()` が現在の `resource` / `order` / `filters` と一致する cursor から `position` を返す

### CS-03 cursor 未指定時は先頭ページ扱いにできる
- 観点: 初回アクセスの共通処理
- 期待結果: `decodeCursor()` に `null` を渡すと `null` を返し、追加の例外を送出しない

### CS-04 order が変わった cursor を INVALID_CURSOR にできる
- 観点: 完了条件の「order が変わったcursorを INVALID_CURSOR にできる」担保
- 期待結果: `decodeCursor()` が `order mismatch` の details を持つ `INVALID_CURSOR` を送出する

### CS-05 resource が異なる cursor を拒否できる
- 観点: `clothing` / `template` / `history` 間の誤利用防止
- 期待結果: 別API向けに生成した cursor を decode すると `resource mismatch` の `INVALID_CURSOR` になる

### CS-06 取得条件が変わった cursor を INVALID_CURSOR にできる
- 観点: 完了条件の「取得条件が変わったcursorを INVALID_CURSOR にできる」担保
- 期待結果: `filters` が不一致の場合に `expectedFilters` / `actualFilters` を持つ `INVALID_CURSOR` を送出する

### CS-07 不正形式の cursor を INVALID_CURSOR に正規化できる
- 観点: 壊れた cursor 文字列への耐性
- 期待結果: base64url や JSON として解釈できない値を `inspectCursor()` に渡すと `INVALID_CURSOR` になる

### CS-08 shared AppError と互換な INVALID_CURSOR を返せる
- 観点: 既存レスポンス基盤との接続性
- 期待結果: cursor 由来のエラーが `AppError` 判定・共通レスポンス整形で再利用できる

## CI適用

- `.github/workflows/ci.yml` に `API cursor spec test` を追加し、PR時に自動検証する
