# BE-MS5-T13 更新系統合テスト設計

## 目的

- BE-MS5-T13（更新系統合テスト）の完了条件を継続検証する。
- API-14（履歴作成）と API-16（履歴削除）を連結し、統計更新（wearCount / wearDaily / lastWornAt）が整合することを担保する。

## テスト観点

- create 後に `template` / `clothing` の `wearCount` が増加する。
- create 後に `template` / `clothing` の daily カウンタが対象日で増加する。
- create 後に `lastWornAt` が作成日に更新される。
- delete 後に `template` / `clothing` の `wearCount` がベースラインへ戻る。
- delete 後に create で作成した daily カウンタが削除される（件数 0 到達時）。
- delete 後に `lastWornAt` が直近過去日へ再計算される。
- 疑似 `transactWriteItems` が `ConditionExpression` 内の算術演算を `ValidationException` として拒否し、本番 DynamoDB との乖離を防ぐ。
- package script と CI workflow から当該統合テストを実行できる。

## テストケース

### HMS5INT-01 正常系: template 記録の create/delete で統計整合を維持できる

- 事前に template 統計（`wearCount=2`, `lastWornAt=20260103`）と daily（`20260103`）を配置する。
- API-14 handler で `templateId` 指定の履歴を `20260105` に作成する。
- API-16 handler で同履歴を削除する。
- 期待値:
  - template `wearCount` は `2 -> 3 -> 2`。
  - template daily `DATE#20260105` は create で作成、delete で削除。
  - template `lastWornAt` は `20260103 -> 20260105 -> 20260103`。

### HMS5INT-02 正常系: clothing 記録の create/delete で統計整合を維持できる

- 事前に clothing 統計（`cl_001`, `cl_002`）と過去 daily を配置する。
- API-14 handler で `clothingIds=[cl_001, cl_002]` の履歴を `20260106` に作成する。
- API-16 handler で同履歴を削除する。
- 期待値:
  - clothing `wearCount` は create で増加し、delete でベースラインへ戻る。
  - clothing daily `DATE#20260106` は create で作成、delete で削除。
  - clothing `lastWornAt` は create 日へ更新後、delete で過去日へ再計算される。

### HMS5INT-03 回帰防止: ConditionExpression の文法違反を統合テストで検知できる
- 疑似 `transactWriteItems` は `ConditionExpression` に `+` / `-` の算術演算が含まれる場合、`ValidationException` を throw する。
- 期待値:
  - 現行 create/delete シナリオが `ValidationException` なしで通る。
  - 未来の回帰で `ConditionExpression` に算術演算が再導入された場合、統合テストが失敗する。

### HMS5INT-04 導線: package script と CI で実行できる

- `apps/api/package.json` に `test:history-ms5-write-integration` が定義されている。
- `.github/workflows/ci.yml` に `pnpm --filter api test:history-ms5-write-integration` が含まれる。
