# BE-MS5 API-14/API-16 テストケース対応表（PRサマリー用）

## 目的

- BE-MS5-T09 / T10 / T13 のテスト設計文書と、対応する検証スクリプトの対応関係を PR サマリーに転記しやすくする。

## 対応表

| 文書 | テストケースID | テストケース要約 | 対応スクリプト | スクリプト内の対応チェック |
| --- | --- | --- | --- | --- |
| `BE-MS5-T09_API-14_usecase実装テスト設計.md` | HMS5API14-01 | `templateId` と `clothingIds` の同時指定拒否（409） | `check-history-ms5-api14-usecase-spec.mjs` | `API-14 usecase rejects templateId and clothingIds simultaneous input with CONFLICT` |
| 同上 | HMS5API14-02 | `clothingIds` 重複拒否（409） | 同上 | `API-14 usecase rejects duplicate clothingIds with CONFLICT` |
| 同上 | HMS5API14-03 | template入力のトランザクション構築（履歴 + 統計更新） | 同上 | `API-14 template flow builds one transact with history Put + update-based existence guard + stats updates` |
| 同上 | HMS5API14-04 | clothing入力のトランザクション構築（履歴 + 統計更新） | 同上 | `API-14 clothing flow builds one transact with update-based existence guards + unique item operations` |
| 同上 | HMS5API14-05 | template記録時の `history.clothingIds` 保存・clothing統計更新 | 同上 | （本PRでは設計明文化。実装/スクリプト追従は別PRで管理） |
| 同上 | HMS5API14-06 | package script / CI導線 | 同上 | `source exports API-14 usecase and package / CI wiring` |
| `BE-MS5-T10_API-14_handler実装テスト設計.md` | HMS5API14H-01 | 正常系（201 + historyId） | `check-history-ms5-api14-handler-spec.mjs` | `API-14 handler validates request and returns 201 with historyId` |
| 同上 | HMS5API14H-02 | Content-Type不正（415） | 同上 | `API-14 handler rejects non-json content type with UNSUPPORTED_MEDIA_TYPE` |
| 同上 | HMS5API14H-03 | body不正（400） | 同上 | `API-14 handler rejects invalid request body with VALIDATION_ERROR` |
| 同上 | HMS5API14H-04 | clothingIds重複（409） | 同上 | `API-14 handler maps duplicate clothingIds conflict to CONFLICT` |
| 同上 | HMS5API14H-05 | template不在（404） | 同上 | `API-14 handler maps template conditional check failure to NOT_FOUND` |
| 同上 | HMS5API14H-06 | clothing不在（404） | 同上 | `API-14 handler maps clothing conditional check failure to NOT_FOUND` |
| 同上 | HMS5API14H-07 | template不正入力（400） | 同上 | `API-14 handler rejects invalid templateId with VALIDATION_ERROR` |
| 同上 | HMS5API14H-08 | package script / CI導線 | 同上 | `source exports API-14 handler and package / CI wiring` |
| `BE-MS5-T13_更新系統合テスト設計.md` | HMS5INT-01 | template記録 create/delete で統計整合 | `check-history-ms5-write-integration-spec.mjs` | `create/delete 統合で wearCount, wearDaily, lastWornAt の整合を維持できる` |
| 同上 | HMS5INT-02 | clothing記録 create/delete で統計整合 | 同上 | `create/delete 統合で wearCount, wearDaily, lastWornAt の整合を維持できる`（同一シナリオ内で検証） |
| 同上 | HMS5INT-03 | ConditionExpression 文法違反検知 | 同上 | 疑似 `transactWriteItems` の `ValidationException` ガード |
| 同上 | HMS5INT-04 | 同一item複数操作の検知 | 同上 | 疑似 `transactWriteItems` の重複 operation key ガード |
| 同上 | HMS5INT-05 | package script / CI導線 | 同上 | `package script と CI に BE-MS5-T13 テスト導線がある` |
