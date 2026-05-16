# おすすめ服・統計GSIキー更新テスト設計

## 目的

- 履歴記録後に、服詳細で参照する `lastWornAt` と、おすすめ服 API が `StatusListByLastWornAt` GSI で参照する `lastWornAtSk` が同時に更新されることを担保する。
- 履歴記録後に、統計本体の `wearCount` と `StatusListByWearCount` GSI で参照する `wearCountSk` が同時に更新されることを担保する。
- 記録済みの服が「最終着用日が古い順」の推薦候補に残り続ける回帰を防ぐ。

## 対象

- `apps/api/src/domains/history/stats_write/transact/buildItems.ts`
- `apps/api/src/domains/history/usecases/createHistoryWithStatsWrite.ts`
- `apps/api/scripts/check-history-stats-write-transact-builder-spec.mjs`
- `apps/api/scripts/check-history-ms5-write-integration-spec.mjs`

## テストケース

| ID | 観点 | 確認内容 |
| --- | --- | --- |
| CRG-01 | 履歴作成時の最終着用日GSIキー更新 | create 用 cache 更新 item が `lastWornAtSk = :lastWornAtSk` を含み、template / clothing の ID を含む `LASTWORN#...` キーを設定する |
| CRG-02 | 履歴作成時の着用回数GSIキー更新 | create 用 cache 更新 item が `wearCountSk = :wearCountSk` を含み、現在 `wearCount` + 1 から `WEAR#...` キーを設定する |
| CRG-03 | 履歴削除時の最終着用日GSIキー更新 | delete 用 cache 更新 item が再計算済み `lastWornAt` から `lastWornAtSk` を設定する |
| CRG-04 | 履歴削除時の着用回数GSIキー更新 | delete 用 cache 更新 item が現在 `wearCount` - 1 から `wearCountSk` を設定する |
| CRG-05 | おすすめ服の並び順維持 | おすすめ服 API が利用する `StatusListByLastWornAt` の sort key が履歴記録・削除の統計更新と同期する |
| CRG-06 | 統計GSIの整合維持 | `StatusListByWearCount` の sort key が履歴記録・削除の統計更新と同期する |

## 実行コマンド

```sh
pnpm --filter api test:history-stats-write-transact-builder
pnpm --filter api test:history-ms5-write-integration
```
