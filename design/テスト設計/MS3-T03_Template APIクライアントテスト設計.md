# MS3-T03 Template APIクライアントテスト設計

## 目的

- MS3-T03（Template APIクライアント）の完了条件を継続的に検証する
- fetch wrapper 利用、CRUD+一覧/詳細APIの公開、DTO型での入出力をCIで担保する

## 対象スクリプト

- `apps/web/scripts/check-template-api-client-spec.mjs`
- 実行コマンド: `pnpm --filter web test:template-api-client`

## テストケース

### TA-01 Template APIクライアントが src/api/endpoints/template.ts に存在する
- 観点: API通信処理の配置統一
- 期待結果: `apps/web/src/api/endpoints/template.ts` が存在する

### TA-02 Template APIクライアントは fetch wrapper（apiClient）経由で実装される
- 観点: エラー形式の統一（`apiClient` の正規化処理を利用）
- 期待結果:
  - `apiClient` を import している
  - `get` / `post` / `patch` / `delete` で通信している

### TA-03 MS3-T03で定義された list/get/create/update/delete が公開される
- 観点: タスク完了条件「CRUD＋一覧/詳細」の関数提供
- 期待結果:
  - `listTemplates`
  - `getTemplate`
  - `createTemplate`
  - `updateTemplate`
  - `deleteTemplate`
    が export されている

### TA-04 一覧/詳細取得の戻り値がDTO型（TemplateListResponseDto / TemplateDetailResponseDto）で返る
- 観点: APIレスポンスをDTO型で受ける統一
- 期待結果:
  - 一覧取得が `Promise<TemplateListResponseDto>` を返す
  - 詳細取得が `Promise<TemplateDetailResponseDto>` を返す

### TA-05 一覧APIは order/limit/cursor を query として渡せる
- 観点: API-08（一覧）のページング・並び替え要件への準拠
- 期待結果:
  - `TemplateListParamsDto` に `order` / `limit` / `cursor` が定義される
  - `listTemplates` が `query: params` で渡す

### TA-06 作成/更新APIはリクエストDTO（Create/UpdateTemplateRequestDto）をbodyで送る
- 観点: API-09/API-11 の入力型安全性
- 期待結果:
  - `CreateTemplateRequestDto` / `UpdateTemplateRequestDto` が定義される
  - `createTemplate` は `post` で body に DTO を渡す
  - `updateTemplate` は `patch` で body に DTO を渡す

### TA-07 テンプレAPIパスが /wardrobes/{wardrobeId}/templates(/:templateId) 形式で統一される
- 観点: API-08〜API-12 のエンドポイント整合
- 期待結果:
  - 一覧/作成: `/wardrobes/${wardrobeId}/templates`
  - 詳細/更新/削除: `/wardrobes/${wardrobeId}/templates/${templateId}`

## CI適用

- `.github/workflows/ci.yml` に `Template API client spec test` を追加し、PR時に自動検証する
