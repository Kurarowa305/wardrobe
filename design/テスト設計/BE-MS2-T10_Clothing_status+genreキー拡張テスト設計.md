# BE-MS2-T10 Clothing status+genre キー拡張テスト設計

## 目的
- Clothing の一覧キーに `status+genre` 軸（`statusGenreListPk`）を追加した実装を継続検証する。
- create/update/delete で `statusGenreListPk` が一貫して更新されることを保証する。

## 対象
- `apps/api/src/domains/clothing/repo/clothingKeys.ts`
- `apps/api/src/domains/clothing/repo/clothingRepo.ts`
- `apps/api/scripts/check-clothing-status-genre-key-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点

### CSG-01 status+genre 一覧PKを生成できる
- 入力: `wardrobeId=wd_001`, `status=ACTIVE`, `genre=tops`
- 期待結果: `W#wd_001#CLOTH#ACTIVE#GENRE#tops` を生成できる。

### CSG-02 buildClothingItem が statusGenreListPk を含む
- 入力: Clothing entity（`status=ACTIVE`, `genre=bottoms`）
- 期待結果: `statusGenreListPk` を含む item が返る。

### CSG-03 update が statusGenreListPk を再計算して更新する
- 入力: `genre` を変更した Clothing entity で `update` を実行
- 期待結果: `UpdateExpression` / `ExpressionAttributeValues` に `statusGenreListPk` 更新が含まれる。

### CSG-04 delete が DELETED 側の statusGenreListPk へ切り替える
- 入力: `delete({ wardrobeId, clothingId, deletedAt })`
- 期待結果: `status=DELETED` と同時に `statusGenreListPk` も `...#DELETED#GENRE#<genre>` に更新される。

### CSG-05 package script と CI に組み込まれている
- 期待結果:
  - `apps/api/package.json` に `test:clothing-status-genre-key` がある。
  - `.github/workflows/ci.yml` に `pnpm --filter api test:clothing-status-genre-key` がある。

## 実行コマンド
```bash
pnpm --filter api test:clothing-status-genre-key
```

## CI適用
- GitHub Actions `CI` に `API clothing status+genre key spec test` を追加し、上記コマンドを実行する。
