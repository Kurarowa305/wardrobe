# BE-MS3-T08 API-11 usecase/handler 実装 テスト設計

## 目的
- テンプレ編集 API（API-11）が部分更新（`name?`, `clothingIds?`）として動作することを担保する。
- `clothingIds` の順序保持と重複禁止、参照服存在チェック（ACTIVEのみ）を継続的に検証する。
- handler / lambda adapter / package script / CI の配線が揃っていることを担保する。

## 対象
- `apps/api/src/domains/template/usecases/templateUsecase.ts`
- `apps/api/src/domains/template/handlers/updateTemplateHandler.ts`
- `apps/api/src/entry/lambda/adapter.ts`
- `apps/api/scripts/check-template-update-usecase-spec.mjs`
- `apps/api/scripts/check-template-update-handler-spec.mjs`
- `apps/api/scripts/check-template-ms3-api11-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テストケース

### TC-01: update usecase が name / clothingIds を更新し、clothingIds の順序を保持する
- 入力:
  - `wardrobeId=wd_001`, `templateId=tp_001`
  - `name="新テンプレ"`
  - `clothingIds=["cl_003", "cl_001"]`
- 期待:
  - `repo.update` が呼ばれる
  - `repo.update` に渡る `clothingIds` は指定順（`cl_003`, `cl_001`）のまま

### TC-02: update usecase が duplicate `clothingIds` を 409(CONFLICT) にする
- 入力: `clothingIds=["cl_001", "cl_001"]`
- 期待: `CONFLICT`

### TC-03: update usecase が対象テンプレ不存在を 404(NOT_FOUND) にする
- 条件: `repo.get` が空を返す
- 期待: `NOT_FOUND`

### TC-04: update usecase が参照服存在チェック（ACTIVEのみ）を行う
- 条件: `clothingBatchGetRepo` が `status=DELETED` のみ返す
- 期待: `NOT_FOUND`

### TC-05: update handler が 204 No Content を返し、Content-Type を検証する
- 入力:
  - path: `wardrobeId=wd_001`, `templateId=tp_001`
  - headers: `content-type=application/json`
  - body: 更新用payload
- 期待:
  - 204 No Content を返す
  - body 不正時は `VALIDATION_ERROR`
  - Content-Type 不正時は `UNSUPPORTED_MEDIA_TYPE`

### TC-06: API-11 の配線確認（adapter/package/CI）
- 期待:
  - template ドメインで PATCH が `updateTemplateHandler` にルーティングされる
  - `apps/api/package.json` に `test:template-update-usecase` / `test:template-update-handler` / `test:template-ms3-api11` が存在する
  - `.github/workflows/ci.yml` で上記3テストが実行される

## 実行コマンド
- `pnpm --filter api test:template-update-usecase`
- `pnpm --filter api test:template-update-handler`
- `pnpm --filter api test:template-ms3-api11`
