# BE-MS4-T04 History details resolver 実装テスト設計

## 目的
- History の参照データ（template 名称 + clothing 明細）を横断解決する resolver が実装されていることを確認する。
- 履歴内 `clothingIds` の順序が、BatchGet の返却順に依存せず維持されることを確認する。
- resolver 用のテストスクリプトが package script / CI に組み込まれていることを確認する。

## テスト対象
- `apps/api/src/domains/history/usecases/historyDetailsResolver.ts`
- `apps/api/scripts/check-history-details-resolver-spec.mjs`
- `apps/api/package.json`
- `.github/workflows/ci.yml`

## テスト観点
1. `resolveMany` が template 入力の `templateId` から template 名を解決できる。
2. `resolveMany` が削除済み服（`status=DELETED`）を含めて clothing を返却できる。
3. `resolveMany` が履歴ごとの `clothingIds` 順序を維持する。
4. `resolveMany` が履歴群全体で clothingId をユニーク化し、BatchGet を1回で実行する。
5. `resolveMany` が組み合わせ入力（`templateId=null`）で `templateName=null` を返し、未解決 clothingId を除外する。
6. `resolveOne` が `resolveMany` と同じ解決ロジックを単体履歴にも適用する。
7. package script / CI に `test:history-details-resolver` が追加されている。

## テストケース
| No. | 観点 | 入力/操作 | 期待結果 |
| --- | --- | --- | --- |
| 1 | template 名解決 | templateId を持つ history を `resolveMany` に渡す | `templateName` に template 名が入る |
| 2 | 削除済み服返却 | BatchGet モックで `status=DELETED` を含む | 返却 `clothingItems` に `DELETED` が含まれる |
| 3 | 順序保持 | `clothingIds=[cl_02,cl_01]` で BatchGet 返却順を逆にする | 返却順が `cl_02,cl_01` のまま |
| 4 | 一括取得最適化 | 履歴2件に重複 clothingId を含める | `batchGetByIds` 呼び出しが1回、IDはユニーク集合 |
| 5 | combination 入力 | `templateId=null` かつ未知 clothingId を含める | `templateName=null`、未知IDはレスポンスに含まれない |
| 6 | 単体解決 | `resolveOne` を実行 | `resolveMany` と同じ解決結果を返す |
| 7 | CI連携 | `package.json` / `ci.yml` を検査 | 新規テストスクリプトが script と CI に存在 |

## 実行コマンド

```bash
pnpm --filter api test:history-details-resolver
```

## CI適用
- GitHub Actions `CI` ワークフローに `API history details resolver spec test` を追加し、`pnpm --filter api test:history-details-resolver` を実行する。
