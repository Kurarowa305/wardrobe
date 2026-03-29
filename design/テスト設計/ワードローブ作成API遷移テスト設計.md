# ワードローブ作成API遷移テスト設計

## 1. 目的

- ワードローブ作成画面が `POST /wardrobes` を実行し、レスポンスの `wardrobeId` で遷移することを継続検証する
- 固定デモID (`1`) へ遷移してしまう退行をCIで検知する
- 開発時（MSW有効時）にも作成フローが成立するよう、モックハンドラの実装漏れを防ぐ

## 2. 対象

- `apps/web/src/api/endpoints/wardrobe.ts`
- `apps/web/src/api/hooks/wardrobe.ts`
- `apps/web/src/components/app/screens/WardrobeCreateScreen.tsx`
- `apps/web/src/mocks/handlers/wardrobe.ts`
- `apps/web/src/mocks/handlers/index.ts`
- `apps/web/scripts/check-wardrobe-create-api-flow-spec.mjs`
- `apps/web/package.json`
- `.github/workflows/ci.yml`

## 3. テストケース

### WAF-01 ワードローブ作成APIクライアント実装
- 観点: `POST /wardrobes` 呼び出しの入口が存在するか
- 期待結果:
  - `src/api/endpoints/wardrobe.ts` が存在する
  - `createWardrobe` が `apiClient.post` で `/wardrobes` を呼ぶ

### WAF-02 ワードローブ作成Mutation hook実装
- 観点: 画面が統一されたHook経由で作成APIを呼べるか
- 期待結果:
  - `src/api/hooks/wardrobe.ts` が存在する
  - `useCreateWardrobeMutation` が `createWardrobe` を利用する

### WAF-03 作成画面がMutation hookを利用
- 観点: UIイベントから作成APIへ接続されているか
- 期待結果:
  - `WardrobeCreateScreen.tsx` が `useCreateWardrobeMutation` をimport/利用する
  - submit時に `mutateAsync` が呼ばれる

### WAF-04 APIレスポンスのwardrobeIdで遷移
- 観点: 固定ID遷移の再発防止
- 期待結果:
  - `ROUTES.home(created.wardrobeId)` を利用する
  - `DEMO_IDS.wardrobe` を作成成功遷移で利用しない

### WAF-05 MSWにPOST /wardrobesハンドラ実装
- 観点: 開発時のモック環境でも作成フローが成立するか
- 期待結果:
  - `src/mocks/handlers/wardrobe.ts` が存在する
  - `http.post("*/wardrobes", ...)` が201で `wardrobeId` を返す

### WAF-06 MSW handlers集約へ登録
- 観点: 実装したモックハンドラが実際に有効化されるか
- 期待結果:
  - `src/mocks/handlers/index.ts` が `wardrobeHandlers` をimportして `handlers` に追加する

### WAF-07 package.json / CI へのテスト登録
- 観点: ローカルだけでなくCIで継続検証できるか
- 期待結果:
  - `apps/web/package.json` に `test:wardrobe-create-api-flow` が追加される
  - `.github/workflows/ci.yml` に `Wardrobe create API flow spec test` が追加される

## 4. 実行方法

- 実行コマンド: `pnpm --filter web test:wardrobe-create-api-flow`
- 実装方式: Node.js による静的検査スクリプト

## 5. CI組み込み

- `.github/workflows/ci.yml` に `Wardrobe create API flow spec test` を追加する
- push 時に自動実行し、作成API導線の退行を検知する

## 6. PRサマリーに記載するテストケース

- WAF-01 ワードローブ作成APIクライアント実装
- WAF-02 ワードローブ作成Mutation hook実装
- WAF-03 作成画面がMutation hookを利用
- WAF-04 APIレスポンスのwardrobeIdで遷移
- WAF-05 MSWにPOST /wardrobesハンドラ実装
- WAF-06 MSW handlers集約へ登録
- WAF-07 package.json / CI へのテスト登録
