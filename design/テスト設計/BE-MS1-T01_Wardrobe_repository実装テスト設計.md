# BE-MS1-T01 Wardrobe repository 実装テスト設計

## 目的
- BE-MS1-T01（Wardrobe repository 実装）の完了条件を継続的に検証する。
- ワードローブMETAの DynamoDB キー設計と PutItem / GetItem 組み立てが、DB設計・API前提に沿っていることを保証する。

## 対象
- `apps/api/src/domains/wardrobe/repo/wardrobeRepo.ts`
- `apps/api/scripts/check-wardrobe-repo-spec.mjs`
- `.github/workflows/ci.yml`

## テスト方針
- 実DynamoDB接続は行わず、既存の DynamoDB クライアント抽象が返す command payload を検証する。
- 単一テーブル設計で定義された Wardrobe META キー `PK=W#<wardrobeId>, SK=META` を最優先観点とする。
- 作成処理は重複防止の条件付き PutItem、取得処理は一貫性読み取り付き GetItem を確認する。
- 追加した検証スクリプトが package script と CI に接続されていることも確認する。

## テストケース

### WR-01 METAキー生成
- 観点: DB設計の Wardrobe META キーに一致すること
- 入力: `wardrobeId = "wd_01HZZ8ABCDEF1234567890"`
- 期待値:
  - `PK` が `W#wd_01HZZ8ABCDEF1234567890`
  - `SK` が `META`

### WR-02 METAアイテム生成
- 観点: 作成時に必要な属性が欠けずに格納されること
- 入力: `wardrobeId`, `name`, `createdAt`
- 期待値:
  - キーに加え `wardrobeId`, `name`, `createdAt` を保持する

### WR-03 create が PutItem を組み立てる
- 観点: 完了条件「PutItem でMETA作成」
- 入力: `create({ wardrobeId, name, createdAt })`
- 期待値:
  - `operation` が `PutItem`
  - `TableName` が注入される
  - `Item` が Wardrobe META になる
  - `ConditionExpression` に `attribute_not_exists(PK)` を指定する

### WR-04 get が GetItem を組み立てる
- 観点: 完了条件「GetItem でMETA取得できる」
- 入力: `get({ wardrobeId })`
- 期待値:
  - `operation` が `GetItem`
  - `Key` が Wardrobe META キーになる
  - `ConsistentRead` が `true`

### WR-05 テスト導線のCI組み込み
- 観点: PR要件「テストスクリプトをCIに適用」
- 期待値:
  - `apps/api/package.json` に `test:wardrobe-repo` がある
  - `.github/workflows/ci.yml` で `pnpm --filter api test:wardrobe-repo` が実行される
