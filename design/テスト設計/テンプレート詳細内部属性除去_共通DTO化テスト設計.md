# テンプレート詳細内部属性除去_共通DTO化テスト設計

## 目的
- テンプレート詳細 API が、BatchGet で取得した服の DynamoDB 内部属性をレスポンスへ混入させないことを継続検証する。
- 服詳細 API の DTO 化ロジックを共通 helper として切り出し、テンプレート詳細でも再利用していることを担保する。
- 旧テンプレートデータで `status` / `wearCount` / `lastWornAt` が欠落しても詳細取得が成立することを確認する。

## 対象
- `apps/api/src/domains/clothing/dto/clothingDetailDto.ts`
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/template/usecases/templateUsecase.ts`
- `apps/api/scripts/check-clothing-get-usecase-spec.mjs`
- `apps/api/scripts/check-template-get-usecase-spec.mjs`
- `apps/api/scripts/check-template-get-handler-spec.mjs`

## テスト観点

### 1. 共通 DTO helper
- 服詳細 usecase が共通 helper を利用して詳細 DTO を組み立てる。
- helper は `PK` / `SK` / `createdAt` などの不要属性を返却 DTO に含めない。
- helper は `status` / `wearCount` / `lastWornAt` 欠落時に服詳細 API と同じ既定値補完を行う。

### 2. テンプレート詳細 usecase
- BatchGet が DynamoDB 実レコード相当の服データを返しても、テンプレート詳細の `clothingItems[]` から内部属性が除去される。
- `clothingIds` の順序は維持される。
- `DELETED` の服は除外されず返る。
- 旧テンプレートデータで `status` / `wearCount` / `lastWornAt` が欠落しても、`ACTIVE` / `0` / `0` で返る。

### 3. テンプレート詳細 handler
- usecase から返る `clothingItems[]` が strict schema を満たし、`200` を返せる。
- 内部属性付きの服データを BatchGet が返しても `unrecognized_keys` による `500` が再発しない。

## テストスクリプト
- `pnpm --filter api test:clothing-get-usecase`
- `pnpm --filter api test:template-get-usecase`
- `pnpm --filter api test:template-get-handler`

## 実行コマンド
- `pnpm --filter api test:clothing-get-usecase`
- `pnpm --filter api test:template-get-usecase`
- `pnpm --filter api test:template-get-handler`
- `pnpm --filter api exec tsc --noEmit`
- `pnpm install --frozen-lockfile`
