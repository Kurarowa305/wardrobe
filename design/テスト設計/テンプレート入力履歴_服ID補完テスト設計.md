# テンプレート入力履歴 服ID補完テスト設計

## 目的

- テンプレート入力で履歴作成した際に、履歴へ `clothingIds` が保存されることを継続検証する
- 履歴一覧/履歴詳細で `clothingItems[]` を構成できる前提データが欠落しないことを CI で担保する

## 対象スクリプト

- `apps/api/scripts/check-history-template-input-clothing-ids-spec.mjs`
- 実行コマンド: `pnpm --filter api test:history-template-input-clothing-ids`

## テストケース

### HTIC-01 template入力時に履歴へ `templateId` と `clothingIds` が保存される
- 観点: template記録時に履歴レコードへテンプレート構成服のスナップショットが残るか
- 期待結果:
  - `history Put` の `templateId` が入力テンプレートIDになる
  - `history Put` の `clothingIds[]` がテンプレートの `clothingIds[]` と一致する

### HTIC-02 template入力時の統計更新に服更新が含まれる
- 観点: template統計だけでなく、服統計（wearCount / lastWornAt）も更新されるか
- 期待結果:
  - トランザクションに `CLOTH#...` 更新がテンプレート構成服分含まれる

### HTIC-03 参照テンプレート未存在時に `NOT_FOUND` を返す
- 観点: 不正な `templateId` 指定時に明確なエラーで失敗できるか
- 期待結果:
  - `NOT_FOUND` を送出する

### HTIC-04 package script / CI / テスト設計導線が維持される
- 観点: PR上で自動検証される導線の担保
- 期待結果:
  - `apps/api/package.json` に `test:history-template-input-clothing-ids` が定義される
  - `apps/api/package.json` の `test` に `pnpm run test:history-template-input-clothing-ids` が含まれる
  - `.github/workflows/ci.yml` に `pnpm --filter api test:history-template-input-clothing-ids` が追加される
  - 本テスト設計に `check-history-template-input-clothing-ids-spec.mjs` が記載される

## CI適用

- `.github/workflows/ci.yml` に `API history template input clothingIds spec test` を追加し、push 時に自動検証する

## PRサマリーに記載するテストケース

- HTIC-01 template入力時に履歴へ `templateId` と `clothingIds` が保存される
- HTIC-02 template入力時の統計更新に服更新が含まれる
- HTIC-03 参照テンプレート未存在時に `NOT_FOUND` を返す
- HTIC-04 package script / CI / テスト設計導線が維持される
