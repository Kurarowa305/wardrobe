# MS4-T03 History APIクライアントテスト設計

## 目的

- MS4-T03（History APIクライアント）の完了条件を継続的に検証する
- 履歴一覧・詳細・作成・削除の呼び出しが fetch wrapper（`apiClient`）経由で統一されていることを保証する
- API設計で定義された履歴エンドポイントと DTO の組み合わせが実装に反映されていることを確認する

## 対象

- `apps/web/src/api/endpoints/history.ts`
- `apps/web/src/api/schemas/history.ts`
- `apps/web/scripts/check-history-api-client-spec.mjs`
- `.github/workflows/ci.yml`

## テスト観点

1. History APIクライアントの配置
   - `src/api/endpoints/history.ts` が存在する
2. fetch wrapper 利用
   - `apiClient` を import し、`GET` / `POST` / `DELETE` を wrapper 経由で呼び出す
3. 公開関数
   - `listHistories` / `getHistory` / `createHistory` / `deleteHistory` を export する
4. DTO の整合
   - 一覧取得が `HistoryListResponseDto` を返す
   - 詳細取得が `HistoryDetailResponseDto` を返す
   - 作成が `CreateHistoryRequestDto` を body に使う
5. 一覧クエリ条件
   - `from` / `to` / `order` / `limit` / `cursor` を query として渡せる
6. パス構築
   - `/wardrobes/{wardrobeId}/histories`
   - `/wardrobes/{wardrobeId}/histories/{historyId}`
7. CI 組み込み
   - `pnpm --filter web test:history-api-client` が GitHub Actions で実行される

## テストケース

| テストID | 観点 | 確認内容 | 期待結果 |
| --- | --- | --- | --- |
| HA-01 | 配置 | `src/api/endpoints/history.ts` の存在を確認する | ファイルが存在する |
| HA-02 | wrapper 利用 | `apiClient` import と `get/post/delete` 呼び出しを確認する | すべて `apiClient` 経由で実装されている |
| HA-03 | 公開関数 | `list/detail/create/delete` の export を確認する | 必要な4関数が公開されている |
| HA-04 | 戻り値 DTO | 一覧/詳細が対応する DTO を戻り値型に使うことを確認する | DTO 型と `apiClient.get` の型引数が一致する |
| HA-05 | 一覧条件 | `HistoryListParamsDto` と `query: params` を確認する | API設計どおりの query 条件を渡せる |
| HA-06 | 作成 DTO | `CreateHistoryRequestDto` を body に使うことを確認する | 作成APIが DTO をそのまま送信できる |
| HA-07 | パス | collection/detail の path builder を確認する | 履歴APIパスが仕様どおりに構築される |

## 実行方法

```bash
pnpm --filter web test:history-api-client
```

## CI適用方針

- GitHub Actions の `CI` workflow に `History API client spec test` ステップを追加する
- 既存の spec テストと同様に、PR / push のたびに自動実行する

## 備考

- 本テストは静的な spec テストとし、APIクライアントの責務（path・DTO・wrapper 利用）に絞って検証する
- 実通信や MSW との結合確認は後続の MS4-T04 / MS4-T05 のテストで補完する
