# web実装_開発環境依存削除テスト設計

## 目的

- backlog の「web実装の開発環境依存削除」の完了条件を継続的に検証する。
- Web 本番ビルド時に AWS 向け API / 画像配信先が注入されること、および MSW が無効化されることを CI で担保する。

## 対象スクリプト

- `apps/web/scripts/check-web-production-config-spec.mjs`
- 実行コマンド: `pnpm --filter web test:web-production-config`

## テストケース

### WP-01 API base URL は production build で必須化される
- 観点: 本番ビルドで `NEXT_PUBLIC_API_BASE_URL` 未設定のまま相対パス通信になる事故を防ぐ
- 期待結果:
  - `src/api/client.ts` に `resolveDefaultApiBaseUrl` が存在する
  - `process.env.NODE_ENV === "production"` のとき未設定をエラーにする

### WP-02 画像配信 base URL は production build で必須化される
- 観点: 本番で画像配信先がローカル既定値にフォールバックする事故を防ぐ
- 期待結果:
  - `src/features/clothing/imageUrl.ts` が `NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL` を参照する
  - `production` かつ未設定時にエラーにする

### WP-03 MSW 起動条件は production で無効化され、NEXT_PUBLIC_ENABLE_MSW を参照する
- 観点: 本番ビルドでモックが有効化される回帰を防ぐ
- 期待結果:
  - `src/mocks/start.ts` が `NEXT_PUBLIC_ENABLE_MSW` を参照する
  - `process.env.NODE_ENV === "production"` では `false` を返す

### WP-04 Terraform apply job が API endpoint / images CDN domain を output として公開する
- 観点: deploy_web job へ AWS 実環境の接続先を受け渡せること
- 期待結果:
  - `.github/workflows/terraform.yml` の apply outputs に `api_endpoint` / `images_cdn_domain` がある
  - `Export Terraform outputs` ステップで両値を `GITHUB_OUTPUT` に書き出す

### WP-05 Terraform deploy_web job の web build が AWS向け公開環境変数を注入し MSW を無効化する
- 観点: 手動設定に依存せず、CI デプロイで常に AWS 向き設定で build されること
- 期待結果:
  - `.github/workflows/terraform.yml` の `Build web` で以下を設定する
  - `NEXT_PUBLIC_API_BASE_URL: ${{ needs.apply.outputs.api_endpoint }}`
  - `NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL: https://${{ needs.apply.outputs.images_cdn_domain }}`
  - `NEXT_PUBLIC_ENABLE_MSW: "false"`

## CI適用

- `.github/workflows/ci.yml` に `Web production config spec test` を追加し、PR時に `pnpm --filter web test:web-production-config` を実行する。
