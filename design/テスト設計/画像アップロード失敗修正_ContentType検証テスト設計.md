# 画像アップロード失敗修正 Content-Type検証テスト設計

## 目的
- 服追加/編集時の画像アップロードで、非対応形式を presign 呼び出し前に検知し、不正な `contentType` を送らないことを継続検証する。
- 追加した検証スクリプトが package script と CI に接続され、PR 時に自動実行されることを保証する。

## 対象
- `apps/web/src/api/endpoints/image.ts`
- `apps/web/scripts/check-image-content-type-validation-spec.mjs`
- `apps/web/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. 許可形式の限定: `image/jpeg`, `image/png`, `image/webp` のみ許可する。
2. 拡張子フォールバック: `jpg/jpeg/png/webp` から正規の `contentType` を解決できる。
3. 不許可形式の拒否: 対応外形式で `unsupported image type` を送出する。
4. ヘッダー整合: PUT アップロード時に presign request と同一 `Content-Type` を設定する。
5. CI導線: テストスクリプトが `package.json` と CI で実行される。

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| ICT-01 | 許可形式の限定 | `resolveContentType` 実装を検査 | `image/jpeg`, `image/png`, `image/webp` のみ許可する分岐がある |
| ICT-02 | 拡張子フォールバック | `resolveContentType` 実装を検査 | `jpg/jpeg -> image/jpeg`, `png -> image/png`, `webp -> image/webp` を解決できる |
| ICT-03 | 不許可形式の拒否 | `resolveContentType` 実装を検査 | 非対応形式で `unsupported image type` を throw する |
| ICT-04 | ヘッダー整合 | `uploadImageWithPresign` 実装を検査 | PUT 時に `Content-Type: contentType` を送る |
| ICT-05 | CI導線 | `package.json` / `.github/workflows/ci.yml` を検査 | `pnpm --filter web test:image-content-type-validation` が scripts / CI に登録される |

## 実行コマンド
- `pnpm --filter web test:image-content-type-validation`
