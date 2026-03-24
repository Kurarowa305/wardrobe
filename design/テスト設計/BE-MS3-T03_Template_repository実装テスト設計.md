# BE-MS3-T03 Template repository 実装テスト設計

## 目的
- Template repository が DB設計どおりの base key / GSI属性を扱えることを確認する。
- 一覧取得が ACTIVE のみを対象にした GSI Query を構築できることを確認する。
- 更新・論理削除で `clothingIds` と GSI 用属性を含めた UpdateItem を構築できることを確認する。

## テスト対象
- `apps/api/src/domains/template/repo/templateRepo.ts`
- `apps/api/scripts/check-template-repo-spec.mjs`
- `.github/workflows/ci.yml`

## テスト観点
1. `buildTemplateItem` が entity に base key と `statusListPk` / `createdAtSk` / `wearCountSk` / `lastWornAtSk` を付与する。
2. `buildTemplateListKey` が既定で `ACTIVE` を返し、`DELETED` 指定時は削除済み一覧の PK を返す。
3. `create` が `attribute_not_exists(PK)` 条件付きで Template item を `PutItem` する。
4. `get` が base key に対する `ConsistentRead=true` の `GetItem` を構築する。
5. `list` が `StatusListByCreatedAt` / `StatusListByWearCount` / `StatusListByLastWornAt` のいずれかを用いた Query を構築でき、既定で `ACTIVE` の `statusListPk` を条件に使う。
6. `update` が編集対象フィールドに加えて `clothingIds`、`statusListPk` / `createdAtSk` / `wearCountSk` / `lastWornAtSk` をまとめて更新する。
7. `delete` が `status=DELETED`、`deletedAt=now`、`statusListPk=...#DELETED` を設定する論理削除になっている。
8. `package.json` と CI に repository spec テストが追加されている。

## テストケース
| No. | 観点 | 入力/操作 | 期待結果 |
| --- | --- | --- | --- |
| 1 | item構築 | ACTIVE の Template entity を `buildTemplateItem` に渡す | base key と 3種類の GSI sort key を含む item が返る |
| 2 | 一覧PK | `buildTemplateListKey({ wardrobeId })` / `buildTemplateListKey({ wardrobeId, status: "DELETED" })` | `...#ACTIVE` と `...#DELETED` を返す |
| 3 | create | `create(entity)` | `PutItem` / `ConditionExpression=attribute_not_exists(PK)` |
| 4 | get | `get({ wardrobeId, templateId })` | `GetItem` / `ConsistentRead=true` |
| 5 | list | `list({ indexName: StatusListByWearCount, limit, scanIndexForward, exclusiveStartKey })` | `Query` / `:statusListPk=...#ACTIVE` / limit と開始キーを透過 |
| 6 | update | `clothingIds` と wearCount / lastWornAt を変更して `update` | `UpdateItem` に `clothingIds` と全GSI属性の再計算結果が入る |
| 7 | delete | `delete({ wardrobeId, templateId, deletedAt })` | `status=DELETED` と `deletedAt`、`statusListPk=...#DELETED` を更新する |
| 8 | CI連携 | `package.json` と `.github/workflows/ci.yml` を検査 | `test:template-repo` が npm script と CI に含まれる |
