# BE-MS2-T02 Clothing key builder 実装テスト設計

## 目的
- BE-MS2-T02（Clothing key builder 実装）の完了条件を CI で継続検証する。
- DB設計どおりに base table key / statusListPk / createdAt・wearCount・lastWornAt 用ソートキーを生成できることを確認する。

## 対象
- `apps/api/src/domains/clothing/repo/clothingKeys.ts`
- `apps/api/scripts/check-clothing-key-builder-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点

### CKB-01: base table key を生成できる
- 入力: `wardrobeId=wd_01HZZAAA`, `clothingId=cl_01HZZBBB`
- 観点: 完了条件「base table key」を満たすこと
- 期待結果:
  - `PK = W#wd_01HZZAAA#CLOTH`
  - `SK = CLOTH#cl_01HZZBBB`

### CKB-02: statusListPk を生成できる
- 入力: `wardrobeId=wd_01HZZAAA`, `status=ACTIVE`
- 観点: ACTIVE / DELETED の集合切替に使う `statusListPk` を構築できること
- 期待結果:
  - `statusListPk = W#wd_01HZZAAA#CLOTH#ACTIVE`

### CKB-03: createdAt / lastWornAt 用ソートキーを生成できる
- 入力: `createdAt=1735690000123`, `lastWornAt=1735600000000`, `clothingId=cl_01HZZBBB`
- 観点: Unix ms をそのまま埋め込む GSI ソートキーを構築できること
- 期待結果:
  - `CREATED#1735690000123#cl_01HZZBBB`
  - `LASTWORN#1735600000000#cl_01HZZBBB`

### CKB-04: wearCount 用ソートキーをゼロ埋め生成できる
- 入力: `wearCount=12`, `clothingId=cl_01HZZBBB`
- 観点: DB設計の固定桁ソート要件を満たすこと
- 期待結果:
  - `WEAR#0000000012#cl_01HZZBBB`

### CKB-05: repository 更新に必要なキー群をまとめて生成できる
- 入力: `wardrobeId`, `clothingId`, `status`, `createdAt`, `wearCount`, `lastWornAt`
- 観点: base key と GSI 用属性を 1 回で組み立てられること
- 期待結果:
  - `PK`, `SK`, `statusListPk`, `createdAtSk`, `wearCountSk`, `lastWornAtSk` を返す
  - `status=DELETED` でも `statusListPk` が正しく切り替わる

### CKB-06: package script と CI に組み込まれている
- 観点: テストスクリプトがローカル集約テストと GitHub Actions `CI` の両方で継続実行されること
- 期待結果:
  - `apps/api/package.json` に `test:clothing-key-builder` がある
  - `apps/api/package.json` の `test` に上記スクリプトが含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:clothing-key-builder` がある

## 実行コマンド
```bash
pnpm --filter api test:clothing-key-builder
```

## CI 適用
- GitHub Actions `CI` ワークフローに `API clothing key builder spec test` を追加し、上記コマンドを実行する。
