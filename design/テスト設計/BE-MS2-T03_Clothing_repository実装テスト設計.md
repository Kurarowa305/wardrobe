# BE-MS2-T03 Clothing repository 実装テスト設計

## 目的
- Clothing repository が DB設計どおりの base key / GSI属性を扱えることを確認する。
- 一覧取得が ACTIVE のみを対象にした GSI Query を構築できることを確認する。
- 更新・論理削除で GSI 用属性を含めた UpdateItem を構築できることを確認する。

## テスト対象
- `apps/api/src/domains/clothing/repo/clothingRepo.ts`
- `apps/api/scripts/check-clothing-repo-spec.mjs`
- `.github/workflows/ci.yml`

## テスト観点
1. `buildClothingItem` が entity に base key と `statusListPk` / `createdAtSk` / `wearCountSk` / `lastWornAtSk` を付与する。
2. `buildClothingListKey` が既定で `ACTIVE` を返し、`DELETED` 指定時は削除済み一覧の PK を返す。
3. `create` が `attribute_not_exists(PK)` 条件付きで Clothing item を `PutItem` する。
4. `get` が base key に対する `ConsistentRead=true` の `GetItem` を構築する。
5. `list` が `StatusListByCreatedAt` / `StatusListByWearCount` / `StatusListByLastWornAt` のいずれかを用いた Query を構築でき、既定で `ACTIVE` の `statusListPk` を条件に使う。
6. `update` が編集対象フィールドに加えて `statusListPk` / `createdAtSk` / `wearCountSk` / `lastWornAtSk` をまとめて更新する。
7. `delete` が `status=DELETED`、`deletedAt=now`、`statusListPk=...#DELETED` を設定する論理削除になっている。
8. `package.json` と CI に repository spec テストが追加されている。

## テストケース
| No. | 観点 | 入力/操作 | 期待結果 |
| --- | --- | --- | --- |
| 1 | item構築 | ACTIVE の Clothing entity を `buildClothingItem` に渡す | base key と 3種類の GSI sort key を含む item が返る |
| 2 | 一覧PK | `buildClothingListKey({ wardrobeId })` / `buildClothingListKey({ wardrobeId, status: "DELETED" })` | `...#ACTIVE` と `...#DELETED` を返す |
| 3 | create | `create(entity)` | `PutItem` / `ConditionExpression=attribute_not_exists(PK)` |
| 4 | get | `get({ wardrobeId, clothingId })` | `GetItem` / `ConsistentRead=true` |
| 5 | list | `list({ indexName: StatusListByWearCount, limit, scanIndexForward, exclusiveStartKey })` | `Query` / `:statusListPk=...#ACTIVE` / limit と開始キーを透過 |
| 6 | update | wearCount と lastWornAt を変更して `update` | `UpdateItem` に全GSI属性の再計算結果が入る |
| 7 | delete | `delete({ wardrobeId, clothingId, deletedAt })` | `status=DELETED` と `deletedAt`、`statusListPk=...#DELETED` を更新する |
| 8 | CI連携 | `package.json` と `.github/workflows/ci.yml` を検査 | `test:clothing-repo` が npm script と CI に含まれる |
