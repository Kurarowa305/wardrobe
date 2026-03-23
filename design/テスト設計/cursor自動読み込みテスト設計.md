# cursor自動読み込みテスト設計

## 目的
- cursor ページングを利用する各一覧要素から「さらに読み込む」ボタンを廃止し、一覧末尾到達時に自動で次ページを読み込めることを確認する。
- API 設計書の上限 `limit` を各取得箇所で指定していることを確認する。
- fixture を増量し、cursor ページング対象の各一覧で少なくとも1回は自動読み込みが発生できるデータ量を担保する。
- 服一覧系ではジャンルセクション単位で末尾到達時に自動読み込みすることを確認する。

## 対象
- 履歴一覧タブ
- テンプレート一覧タブ
- 服一覧タブ
- 記録画面（テンプレートで記録）のテンプレート一覧
- 記録画面（服の組み合わせで記録）の服一覧
- テンプレート追加画面の服一覧
- テンプレート編集画面の服一覧

## テスト観点
1. **自動読み込み共通化**
   - `IntersectionObserver` を用いた hook が存在すること。
   - 共通 trigger コンポーネントから hook を利用していること。
2. **一覧末尾での自動読み込み**
   - 履歴一覧・テンプレート一覧・テンプレート記録画面が共通 trigger を描画すること。
   - `nextCursor` がある場合のみ自動読み込みが有効になること。
3. **ジャンル別自動読み込み**
   - 服一覧・服組み合わせ記録・テンプレート追加/編集で、各ジャンルセクションごとに trigger が表示されること。
   - `isFetching` 中は同一ジャンルの追加読み込みを再発火しないこと。
4. **API limit 指定**
   - 履歴一覧は `30`、ホーム直近履歴は専用 hook の `7`、テンプレート系取得は `30`、服系取得は `50` を指定すること。
5. **fixture 件数**
   - 履歴 fixture は 30 件超、テンプレート fixture は 30 件超、服 fixture は各ジャンルで 50 件近い件数を持つこと。
6. **MSW handler 整合**
   - テンプレート一覧 handler が API 設計どおり `limit=1..30` を検証すること。

## テストスクリプト
- `pnpm --filter web test:cursor-auto-load`
  - 自動読み込み hook / trigger の存在
  - cursor ページング対象画面への適用
  - API 上限 limit 指定
  - fixture 増量
- 既存回帰
  - `pnpm --filter web test:home-screen`
  - `pnpm --filter web test:history-list-screen`
  - `pnpm --filter web test:template-list-screen`
  - `pnpm --filter web test:clothing-list-screen`
  - `pnpm --filter web test:template-form-screen`
  - `pnpm --filter web test:record-template-screen`
  - `pnpm --filter web test:record-combination-screen`
  - `pnpm --filter web test:history-fixtures`
  - `pnpm --filter web test:template-fixtures`
  - `pnpm --filter web test:clothing-fixtures`

## CI適用方針
- `apps/web/package.json` に `test:cursor-auto-load` を追加する。
- `.github/workflows/ci.yml` に `pnpm --filter web test:cursor-auto-load` を追加し、既存の一覧系 spec と合わせて常時検証する。
