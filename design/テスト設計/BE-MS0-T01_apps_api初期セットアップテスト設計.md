# BE-MS0-T01 apps/api 初期セットアップテスト設計

## 目的

- BE-MS0-T01（apps/api 初期セットアップ）の完了条件を継続的に検証する
- `pnpm --filter api dev` の前提となる `tsx` 実行、`.env.local` 読み込み、Node.js 20 向け TypeScript 設定をCIで担保する

## 実行方法

- 実行コマンド: `pnpm --filter api test:bootstrap`
- 補助確認: `pnpm --filter api exec tsc --noEmit`
- 補助確認: `pnpm --filter api exec tsc --outDir dist`

## テストケース

### BA-01 dev script が `tsx watch` を利用している
- 観点: 完了条件「`pnpm --filter api dev` でローカル起動できる」の担保
- 期待結果: `apps/api/package.json` の `scripts.dev` が `tsx watch src/index.ts` である

### BA-02 `.env.local` 読み込みが共通化されている
- 観点: 完了条件「`.env.local` 読み込みができる」の担保
- 期待結果: `apps/api/src/env.ts` で `dotenv.config({ path: envFilePath })` を実行し、起動時の環境変数参照が `env` 経由に集約されている

### BA-03 ローカル起動確認用 HTTP サーバーが存在する
- 観点: 完了条件「ローカル起動できる」の担保
- 期待結果: `apps/api/src/index.ts` が HTTP サーバーを起動し、`GET /health` で `status: "ok"` を返す

### BA-04 Node.js 20 向け TypeScript 設定が定義されている
- 観点: 完了条件「TypeScript / Node.js 20 で起動可能」の担保
- 期待結果: `apps/api/tsconfig.json` で `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `types: ["node"]` が設定されている

### BA-05 起動用環境変数の雛形が共有されている
- 観点: ローカルセットアップの再現性担保
- 期待結果: `apps/api/.env.example` に `AWS_REGION`, `DDB_ENDPOINT`, `S3_BUCKET`, `API_HOST`, `API_PORT` が記載されている
