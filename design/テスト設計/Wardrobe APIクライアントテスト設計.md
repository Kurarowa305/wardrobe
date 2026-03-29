# Wardrobe APIクライアントテスト設計

## 1. 目的

- `apps/web` がワードローブ作成を固定ID遷移ではなく API 経由で実行し、返却された実IDで遷移することを継続検証する。
- Wardrobe API の schema / endpoint / hooks が存在し、`WardrobeCreateScreen` から利用されることを保証する。
- 専用テストスクリプトが `apps/web/package.json` と GitHub Actions CI (`.github/workflows/ci.yml`) に接続され、PRごとに自動実行されることを保証する。

## 2. 対象

- 型定義: `apps/web/src/api/schemas/wardrobe.ts`
- API クライアント: `apps/web/src/api/endpoints/wardrobe.ts`
- hooks: `apps/web/src/api/hooks/wardrobe.ts`
- 画面: `apps/web/src/components/app/screens/WardrobeCreateScreen.tsx`
- テストスクリプト: `apps/web/scripts/check-wardrobe-api-client-spec.mjs`
- スクリプト登録: `apps/web/package.json`
- CI 登録: `.github/workflows/ci.yml`

## 3. 前提

- `pnpm install --frozen-lockfile` が成功していること。
- リポジトリルートでテストコマンドを実行できること。

## 4. テスト観点 / テストケース

| ID | 観点 | 入力 / 条件 | 期待結果 |
| --- | --- | --- | --- |
| TC-01 | Wardrobe schema 定義 | `src/api/schemas/wardrobe.ts` を検査 | `CreateWardrobeRequestDto` / `CreateWardrobeResponseDto` / `WardrobeDetailResponseDto` が定義される |
| TC-02 | Wardrobe endpoint 定義 | `src/api/endpoints/wardrobe.ts` を検査 | `POST /wardrobes` と `GET /wardrobes/{wardrobeId}` を `apiClient` 経由で呼び出す |
| TC-03 | Wardrobe hooks 定義 | `src/api/hooks/wardrobe.ts` を検査 | `useWardrobe`(query) と `useCreateWardrobeMutation`(mutation) が公開される |
| TC-04 | 画面遷移の実ID利用 | `WardrobeCreateScreen.tsx` を検査 | 作成時に `mutateAsync` を呼び、返却 `wardrobeId` を `ROUTES.home(...)` に利用する |
| TC-05 | テスト導線（package/CI） | `package.json` / `.github/workflows/ci.yml` を検査 | `test:wardrobe-api-client` が定義され、CIで実行される |

## 5. 実行コマンド

- `pnpm --filter web test:wardrobe-api-client`

## 6. 完了条件

- TC-01〜TC-05 がすべて成功する。
- CI 上で同一コマンドが自動実行され、失敗時にPRをブロックできる。
