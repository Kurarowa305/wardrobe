# BE-MS0-T03 環境変数定義テスト設計

## 目的
- `apps/api/src/config/env.ts` がバックエンド初期設定に必要な環境変数を安全に取得できることを確認する。
- 不正な値を起動前に検知し、設定不備を早期に発見できることを確認する。

## 対象
- `apps/api/src/config/env.ts`
- `apps/api/.env.example`
- `apps/api/scripts/check-env-spec.mjs`
- `.github/workflows/ci.yml`

## テスト観点
1. 正常系: 必須環境変数を与えた場合、API設定用の値へ正しく変換される。
2. バリデーション: `DDB_ENDPOINT` に不正URLを与えた場合に失敗する。
3. バリデーション: `STORAGE_DRIVER` に許可外の値を与えた場合に失敗する。
4. ドキュメント整合: `.env.example` に必須環境変数が列挙されている。
5. CI整合: 上記テストスクリプトがCIから実行される。

## テストケース
| ID | 観点 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | 正常系 | 必須環境変数をすべて設定して `check-env-spec.mjs` を実行する | `env` に `AWS_REGION` / `DDB_ENDPOINT` / `TABLE_NAME` / `S3_BUCKET` / `IMAGE_PUBLIC_BASE_URL` / `STORAGE_DRIVER` が反映される |
| TC-02 | 異常系 | `DDB_ENDPOINT=not-a-url` で `check-env-spec.mjs` を実行する | Zod検証が失敗し、`DDB_ENDPOINT` を含むエラーが出力される |
| TC-03 | 異常系 | `STORAGE_DRIVER=fs` で `check-env-spec.mjs` を実行する | 列挙値検証が失敗し、`STORAGE_DRIVER` を含むエラーが出力される |
| TC-04 | ドキュメント | `.env.example` を参照する | 必須環境変数がすべて記載されている |
| TC-05 | CI | `.github/workflows/ci.yml` を参照する | `pnpm --filter api test:env` がCIジョブに追加されている |
