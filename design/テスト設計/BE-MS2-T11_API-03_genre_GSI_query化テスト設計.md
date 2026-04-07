# BE-MS2-T11 API-03 genre GSI query化テスト設計

## 目的
- API-03（服一覧）が `genre` 指定時に `StatusGenreListByCreatedAt` を使って DB レベルで絞り込みできることを保証する。
- `items=[]` かつ `nextCursor!=null` の空ページ依存を生まない実装方針を継続検証する。

## 対象
- `apps/api/src/domains/clothing/usecases/clothingUsecase.ts`
- `apps/api/src/domains/clothing/repo/clothingRepo.ts`
- `apps/api/src/domains/clothing/handlers/listClothingHandler.ts`
- `apps/api/scripts/check-clothing-list-usecase-spec.mjs`
- `apps/api/scripts/check-clothing-ms2-api03-genre-gsi-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## 前提・方針
- 実DynamoDB接続は行わず、repoスタブと Query 入力の検査で判定する。
- cursor の整合性（`order` / `genre`）は既存 cursor 基盤を利用する。

## テストケース

### CLG-01 genre 未指定では既存の createdAt GSI を使う
- 入力: `params={ order:"desc", limit:50 }`
- 期待結果:
  - `indexName=StatusListByCreatedAt`
  - `scanIndexForward=false`

### CLG-02 genre 指定では status+genre GSI を使う
- 入力: `params={ order:"desc", genre:"tops", limit:50 }`
- 期待結果:
  - `indexName=StatusGenreListByCreatedAt`
  - Query 条件が `statusGenreListPk=W#<wardrobeId>#CLOTH#ACTIVE#GENRE#tops` になる。

### CLG-03 genre 指定時に usecase 後段 filter に依存しない
- 入力: `genre="bottoms"` 指定で repo が bottoms のみを返す
- 期待結果:
  - usecase が追加の in-memory `genre` filter を前提としない。
  - `items` が repo の返却件数に整合する。

### CLG-04 cursor の genre 不一致を INVALID_CURSOR で拒否できる
- 入力: `genre=tops` で発行した cursor を `genre=others` で再利用
- 期待結果: `INVALID_CURSOR` を返す。

### CLG-05 handler/lambda 経路で API-03 応答を返せる
- 入力: `GET /wardrobes/{wardrobeId}/clothing?genre=tops&limit=50`
- 期待結果:
  - 200
  - `items[]`, `nextCursor` を返す
  - local/lambda とも同一仕様で応答する

### CLG-06 package script と CI に組み込まれている
- 期待結果:
  - `apps/api/package.json` に `test:clothing-ms2-api03-genre-gsi` がある。
  - `.github/workflows/ci.yml` に `pnpm --filter api test:clothing-ms2-api03-genre-gsi` がある。

## 実行コマンド
```bash
pnpm --filter api test:clothing-list-usecase
pnpm --filter api test:clothing-ms2-api03-genre-gsi
```

## CI適用
- GitHub Actions `CI` に `API-03 genre GSI query spec test` を追加し、上記コマンドを実行する。
