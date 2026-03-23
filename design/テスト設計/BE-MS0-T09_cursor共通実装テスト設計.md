# BE-MS0-T09 cursor 共通実装テスト設計

## 目的
- 一覧 API 共通で利用する cursor encode/decode の整合性を継続検証する。
- `order` や取得条件が変化した cursor を `INVALID_CURSOR` として正規化できることを確認する。
- `clothing` / `template` / `history` で再利用できる共通 payload 構造を担保する。

## 対象
- `apps/api/src/core/cursor/index.ts`
- `apps/api/scripts/check-cursor-spec.mjs`
- `.github/workflows/ci.yml`
- `apps/api/package.json`

## テスト観点
1. **共通 encode/decode**
   - `resource` / `order` / `criteria` / `position` を含む cursor を base64url で往復できること。
   - `criteria` のキー順が異なっても decode 時に同値判定できること。
2. **整合性チェック**
   - `order` 不一致を `INVALID_CURSOR` に正規化できること。
   - `resource` 不一致を `INVALID_CURSOR` に正規化できること。
   - 取得条件 (`criteria`) 不一致を `INVALID_CURSOR` に正規化できること。
3. **不正 payload 耐性**
   - base64url でない値を `INVALID_CURSOR` に正規化できること。
   - `criteria` や `position` が平坦オブジェクトでない payload を `INVALID_CURSOR` に正規化できること。
4. **CI 組み込み**
   - `apps/api/package.json` に `test:cursor` が追加されていること。
   - `.github/workflows/ci.yml` で `pnpm --filter api test:cursor` が実行されること。

## テストスクリプト
- `pnpm --filter api test:cursor`
  - 正常系: cursor の encode/decode 往復
  - 異常系: order/resource/criteria 不一致の検知
  - 異常系: malformed payload の検知
  - CI / package script への組み込み確認
- 回帰確認
  - `pnpm --filter api test:errors`
  - `pnpm --filter api test:response`
  - `pnpm --filter api exec tsc --noEmit`

## CI適用方針
- `apps/api/package.json` に `test:cursor` を追加する。
- `.github/workflows/ci.yml` に `API cursor spec test` を追加し、既存 API 基盤テストと同列で常時検証する。
