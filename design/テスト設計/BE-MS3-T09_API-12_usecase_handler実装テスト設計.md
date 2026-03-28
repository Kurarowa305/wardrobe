# BE-MS3-T09 API-12 usecase/handler 実装 テスト設計

## 目的
- テンプレ削除 API（API-12）が論理削除として動作し、一覧から除外される前提（`status=DELETED` への更新）を担保する。
- 削除対象が存在しない/既に削除済みの場合に `NOT_FOUND` となることを継続的に検証する。
- handler / lambda adapter / package script / CI の配線が揃っていることを担保する。

## 対象
- `apps/api/src/domains/template/usecases/templateUsecase.ts`
- `apps/api/src/domains/template/handlers/deleteTemplateHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/scripts/check-template-delete-usecase-spec.mjs`
- `apps/api/scripts/check-template-delete-handler-spec.mjs`
- `apps/api/scripts/check-template-ms3-api12-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テストケース

### TC-01: delete usecase が ACTIVE のテンプレを論理削除する
- 入力: `wardrobeId=wd_001`, `templateId=tp_001`
- 条件: `repo.get` が `status=ACTIVE` のテンプレを返す
- 期待:
  - `repo.get` が対象テンプレ取得で呼ばれる
  - `repo.delete` が `deletedAt` 付きで呼ばれる

### TC-02: delete usecase が対象テンプレ不存在を `NOT_FOUND` にする
- 条件: `repo.get` が空 (`Item: undefined`) を返す
- 期待: `NOT_FOUND`

### TC-03: delete usecase が削除済みテンプレを `NOT_FOUND` にする
- 条件: `repo.get` が `status=DELETED` のテンプレを返す
- 期待: `NOT_FOUND`

### TC-04: delete handler が 204 No Content を返す
- 入力: path に `wardrobeId`, `templateId` を指定
- 期待:
  - 204 No Content を返す
  - path 不正時は `VALIDATION_ERROR`
  - 不存在テンプレ時は `NOT_FOUND`

### TC-05: API-12 の配線確認（adapter/package/CI）
- 期待:
  - template ドメインで DELETE が `deleteTemplateHandler` にルーティングされる
  - `apps/api/package.json` に `test:template-delete-usecase` / `test:template-delete-handler` / `test:template-ms3-api12` が存在する
  - `.github/workflows/ci.yml` で上記3テストが実行される

## 実行コマンド
- `pnpm --filter api test:template-delete-usecase`
- `pnpm --filter api test:template-delete-handler`
- `pnpm --filter api test:template-ms3-api12`
