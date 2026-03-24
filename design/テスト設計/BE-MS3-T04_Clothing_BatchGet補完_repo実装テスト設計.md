# BE-MS3-T04 Clothing BatchGet 補完 repo 実装テスト設計

## 目的
- Template / History から参照する服情報の補完で、`clothingIds` を BatchGet でまとめて取得できることを確認する。
- DynamoDB BatchGet の実装上限（80件）を超える入力でも、分割取得ロジックで安全に処理できることを確認する。
- 補完後の服配列が `clothingIds` の順序を維持できることを確認する。

## テスト対象
- `apps/api/src/domains/clothing/repo/clothingBatchGetRepo.ts`
- `apps/api/scripts/check-clothing-batch-get-repo-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. `splitClothingIdsForBatchGet` が既定80件で chunk 分割する。
2. `buildClothingBatchGetKeys` が `wardrobeId + clothingIds[]` から base key（`PK/SK`）を構築する。
3. `reorderClothingItemsByIds` が `clothingIds` の入力順を維持しつつ、存在しないIDは除外できる。
4. `createClothingBatchGetRepo().batchGetByIds` が chunk ごとに `batchGetItem` を呼び、`ConsistentRead=true` で発行する。
5. `package.json` と CI に `test:clothing-batch-get-repo` が組み込まれている。

## テストケース
| No. | 観点 | 入力/操作 | 期待結果 |
| --- | --- | --- | --- |
| 1 | 80件分割 | 162件の `clothingIds` を `splitClothingIdsForBatchGet` に渡す | `[80, 80, 2]` の3分割になる |
| 2 | key生成 | `buildClothingBatchGetKeys({ wardrobeId, clothingIds:[cl_001..] })` | `PK=W#<wardrobeId>#CLOTH`, `SK=CLOTH#<clothingId>` 形式の key 配列になる |
| 3 | 順序維持 | 並び替え対象 `clothingIds=[cl_002, cl_001, cl_004]` と item 配列を渡す | 戻り値順が `cl_002 -> cl_001` となり、`cl_004` は除外される |
| 4 | BatchGet発行 | `batchGetByIds` に 162件入力を渡す | `batchGetItem` が3回呼ばれ、各呼び出しの `Keys.length` が `80/80/2`、かつ `ConsistentRead=true` |
| 5 | CI連携 | `package.json` と `.github/workflows/ci.yml` を検査 | `test:clothing-batch-get-repo` が npm script と CI ジョブに含まれる |
