# BE-MS4-T02 History key builder 実装テスト設計

## 目的

- BE-MS4-T02（History key builder 実装）の完了条件を CI で継続検証する。
- DB設計どおりに base table key と `DATE#<date>#<historyId>` キーを生成できることを確認する。

## 対象

- `apps/api/src/domains/history/repo/historyKeys.ts`
- `apps/api/scripts/check-history-key-builder-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点

### HKB-01: base table key を生成できる
- 入力: `wardrobeId=wd_01HZZAAA`, `historyId=hs_01HZZBBB`
- 観点: 完了条件「base key」を満たすこと
- 期待結果:
  - `PK = W#wd_01HZZAAA#HIST`
  - `SK = HIST#hs_01HZZBBB`

### HKB-02: 日付ソートキーを生成できる
- 入力: `date=20260101`, `historyId=hs_01HZZBBB`
- 観点: 完了条件「DATE#<date>#<historyId> 用キー」を満たすこと
- 期待結果:
  - `historyDateSk = DATE#20260101#hs_01HZZBBB`

### HKB-03: repository 更新に必要なキー群をまとめて生成できる
- 入力: `wardrobeId`, `historyId`, `date`
- 観点: base key と date 用キーを1回で組み立てられること
- 期待結果:
  - `PK`, `SK`, `historyDateSk` を返す

### HKB-04: package script と CI に組み込まれている
- 観点: テストスクリプトがローカル集約テストと GitHub Actions `CI` の両方で継続実行されること
- 期待結果:
  - `apps/api/package.json` に `test:history-key-builder` がある
  - `apps/api/package.json` の `test` に上記スクリプトが含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-key-builder` がある

## 実行コマンド

```bash
pnpm --filter api test:history-key-builder
```

## CI 適用

- GitHub Actions `CI` ワークフローに `API history key builder spec test` を追加し、上記コマンドを実行する。
