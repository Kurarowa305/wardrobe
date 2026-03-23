# BE-MS0-T02 ディレクトリ骨格作成テスト設計

## 目的

- BE-MS0-T02（ディレクトリ骨格作成）の完了条件を継続的に検証する
- `apps/api` のバックエンド基盤ディレクトリが設計資料どおり維持されることをCIで担保する

## 実行方法

- 実行コマンド: `pnpm --filter api test:directory-structure`
- 補助確認: `pnpm --filter api exec tsc --noEmit`
- 補助確認: `pnpm install --frozen-lockfile`

## テストケース

### BD-01 entry 配下の起動点が存在する
- 観点: 完了条件「`entry/lambda`, `entry/local` が存在する」の担保
- 期待結果: `src/entry/lambda` と `src/entry/local` が存在し、Lambda 用 6 ファイルと local 用 2 ファイルが揃っている

### BD-02 ドメイン骨格が存在する
- 観点: 完了条件「`domains/{wardrobe,clothing,template,history,presign}` と `domains/history/stats_write` が存在する」の担保
- 期待結果: 各ドメインディレクトリが存在し、`history` 配下には handler / usecase / repo / stats_write の初期ファイル群が揃っている

### BD-03 共通基盤とクライアント骨格が存在する
- 観点: 完了条件「`core/{errors,cursor,logging,validation,response}` と `clients/{dynamodb,s3}` が存在する」の担保
- 期待結果: 共通基盤ディレクトリおよび `src/clients/dynamodb.ts`, `src/clients/s3.ts` が存在する

### BD-04 環境変数設定の配置が移設されている
- 観点: 完了条件「`config/env.ts` が存在する」の担保
- 期待結果: `src/config/env.ts` が存在し、`TABLE_NAME`, `IMAGE_PUBLIC_BASE_URL`, `STORAGE_DRIVER` を含む後続タスク向けの環境変数定義の土台がある
