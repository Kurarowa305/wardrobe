# TanStack Query 設計

## ホーム天気と推薦の確定契約

2026-10-11、[#276](https://github.com/Kurarowa305/wardrobe/issues/276)で[query keyと状態遷移](タスク設計/地域天気テンプレート推薦_API契約と状態管理判断.md)を確定した。天気キーはwardrobe・地域revision・JST対象日、推薦キーはさらにmodeを含む。履歴・テンプレート・構成服の更新成功後は同wardrobeの全モード推薦を無効化し、更新前の応答を現在表示へ採用しない。

手動モードを保存・復元せず、ホーム再入場・復帰・地域変更成功・跨日・記録成功後は自動へ戻す。確認中の記録日入力は跨日でも維持する。天気の当日キャッシュは推薦と独立し、記録後も再利用する。新しい地域・天気・推薦queryのretryは0。以下の取得境界で制御する。

### #282 Webの取得境界

`useHome`はホーム表示中の`HomeController`を生成する。`fetchQuery`がサーバーデータを保存し、controllerの公開操作（入場・モード選択・地域保存・明示再取得）が要求世代と表示状態を管理する。ホームは旧履歴・服推薦hookを呼ばない。

| 用途 | query key |
| --- | --- |
| 明示地域検索の成功結果 | `['regions', datasetVersion, normalizedSearch]` |
| 保存地域 | `['wardrobe', wardrobeId, 'region']` |
| 天気 | `['weather', wardrobeId, regionRevision, targetDate]` |
| 推薦 | `['template', wardrobeId, 'recommendation', mode, regionRevision, targetDate]` |

- 取得をイベントで制御し、focus/reconnect/intervalの自動取得とretryを無効にする。地域検索は`features/home/useRegionDialog`が成功responseの辞書版でquery cacheへ保存し、明示検索自体は毎回送信する。地域保存の失敗理由と競合時の読直しも同hookで扱い、ダイアログはUI操作と表示を担う。
- 成功した天気は`expiresAt`とJST対象日を明示検査してcacheから再利用する。queryの暗黙stale判定で再送しない。失敗・未設定は成功天気cacheと混同しない。
- 各要求にAbortSignalを渡し、表示反映前にwardrobe・regionRevision・JST日・mode・要求世代を照合する。モード切替、地域変更、跨日、更新前の結果をplaceholderに使わない。
- JST翌00:00のタイマー、visibility復帰・BFCache復帰、送信前/応答時の日付検査を併用する。React再描画、ダイアログ開閉だけではモードを消さない。離脱時は進行中要求を中断する。
- `REGION_CHANGED`/`TARGET_DATE_CHANGED`の409では地域を読み直し、新コンテキストを取得する。同じ古いコンテキストでの409ループを抑止し、明示再取得を案内する。
- `invalidateRecommendations`はQueryClient/wardrobe単位の購読へ世代変更を通知し、全モードprefixの進行中要求をcancel、無効化、その後表示中controllerへ再取得を通知する。履歴作成/削除、template作成/編集/削除、構成服編集/削除の全既存mutation hookに接続する。天気cacheは無効化しない。
- 記録成功フラグと推薦エラーを分離し、「記録しました。おすすめの更新に失敗しました」を表示可能にする。`useConfirmation`は確定成功後に通知し、`invalidateHistoryQueries(client, wardrobeId, true)`へ接続する。記録成功後はautoに戻り、天気cacheを保持して推薦を読み直す。

### 確認記録の永続化と再送

確認ダイアログの編集中の状態は`ConfirmationController`が管理する。送信前に`wardrobe:pending-record:{wardrobeId}:{operationId}`へUUID・固定body・確認表示を保存し、結果不明なら同一操作を復元する。操作はQuery cacheに保存しない。複数タブの別操作は別キーを持ち、確定したキーだけ削除する。ホーム再入場はautoへ戻すが、未確定記録の入力日は変更しない。成功後の推薦再取得失敗で履歴保存を再送しない。

## 1. 目的

本システムでは、フロントエンドから API を呼び出して取得するデータを効率的に管理するために **TanStack Query** を利用する。

TanStack Query は以下の役割を担う。

* API から取得したデータのキャッシュ管理
* API リクエストの状態管理（loading / error / success）
* データ更新後のキャッシュ整合性維持
* 画面遷移時の不要な再取得の削減

本システムでは **サーバーデータ管理に限定して TanStack Query を利用し、UI 状態管理には使用しない**。

---

# 2. 基本方針

TanStack Query の利用方針は以下とする。

### 2.1 Query と Mutation の役割

| 種別       | 役割                   |
| -------- | -------------------- |
| Query    | サーバーデータの取得           |
| Mutation | サーバーデータの変更（作成・更新・削除） |

以下は Mutation とする。

* ワードローブ作成
* 服追加 / 編集 / 削除
* テンプレート追加 / 編集 / 削除
* 履歴作成 / 削除
* 画像アップロード用 presign URL 発行

画像 presign API は永続データを変更しないが、
一時的な URL を発行する処理のため Mutation として扱う。

---

### 2.2 キャッシュ境界

本システムでは **ワードローブ単位でデータが分離される**。

そのためキャッシュも **wardrobeId を境界として管理**する。

```
Wardrobe
 ├ clothing
 ├ template
 └ history
```

これにより

* ワードローブ切替時のキャッシュ衝突防止
* invalidate 範囲の明確化

が可能になる。

---

### 2.3 更新同期の方針

Mutation 実行後は以下のルールでキャッシュ整合性を維持する。

> **その mutation により変更されるデータを参照しているすべての query を invalidate する**

この方針により

* キャッシュ更新ロジックを単純化
* 楽観更新による不整合を防止
* 将来の機能追加時の影響範囲を明確化

を実現する。

---

# 3. ディレクトリ構成

TanStack Query 関連のコードは以下の構成で管理する。

```
api
 ├ endpoints
 │   ├ clothing.ts
 │   ├ template.ts
 │   ├ history.ts
 │   └ wardrobe.ts
 │
 ├ schemas
 │   └ APIレスポンス型
 │
 ├ queryKeys.ts
 │
 └ hooks
     ├ clothing
     ├ template
     ├ history
     ├ wardrobe
     └ image
```

役割は以下の通り。

| ディレクトリ        | 役割                  |
| ------------- | ------------------- |
| api/endpoints | API通信処理             |
| api/schemas   | レスポンス型定義            |
| api/queryKeys | queryKey定義          |
| api/hooks     | TanStack Query hook |

画面コンポーネントは直接 API を呼ばず、
**features から提供される hook を利用する。**

---

# 4. Query Key 設計

queryKey は以下の構造で統一する。

```
[domain, wardrobeId?, scope, id|params]
```

例

```
["clothing", wardrobeId, "list"]
["clothing", wardrobeId, "detail", clothingId]

["template", wardrobeId, "list"]
["template", wardrobeId, "detail", templateId]

["history", wardrobeId, "list"]
["history", wardrobeId, "detail", historyId]
```

### 設計意図

この構造により

* ドメイン単位 invalidate
* ワードローブ単位 invalidate
* 一覧 / 詳細単位 invalidate

が prefix で制御可能になる。

---

# 5. Query Hook 設計

各ドメインごとに Query Hook を提供する。

## wardrobe

* `useWardrobeDetailQuery`

## clothing

* `useClothingListQuery`
* `useClothingDetailQuery`

## template

* `useTemplateListQuery`
* `useTemplateDetailQuery`

## history

* `useRecentHistoriesQuery`
* `useHistoryListQuery`
* `useHistoryDetailQuery`

## image

* `useCreateImagePresignMutation`

画面コンポーネントはこれらの hook のみを利用する。

---

# 6. Mutation Hook 設計

各ドメインの Mutation は以下とする。

## wardrobe

* `useCreateWardrobeMutation`

## clothing

* `useCreateClothingMutation`
* `useUpdateClothingMutation`
* `useDeleteClothingMutation`

## template

* `useCreateTemplateMutation`
* `useUpdateTemplateMutation`
* `useDeleteTemplateMutation`

## history

* `useCreateHistoryMutation`
* `useDeleteHistoryMutation`

## image

* `useCreateImagePresignMutation`

---

# 7. invalidate 設計

Mutation 実行後は、影響を受けるドメインの Query を invalidate する。

| mutation  | invalidateドメイン                |
| --------- | ----------------------------- |
| ワードローブ作成  | wardrobe                      |
| 服追加       | clothing                      |
| 服編集       | clothing / template / history |
| 服削除       | clothing / template / history |
| テンプレート追加  | template                      |
| テンプレート編集  | template / history            |
| テンプレート削除  | template / history            |
| 履歴作成      | history / clothing / template |
| 履歴削除      | history / clothing / template |
| 画像presign | なし                            |

---

### invalidate 実装例

例：服編集

```ts
queryClient.invalidateQueries({
  queryKey: queryKeys.clothing.byWardrobe(wardrobeId)
})

queryClient.invalidateQueries({
  queryKey: queryKeys.template.byWardrobe(wardrobeId)
})

queryClient.invalidateQueries({
  queryKey: queryKeys.history.byWardrobe(wardrobeId)
})
```

---

# 8. キャッシュポリシー

本システムでは以下のキャッシュポリシーを採用する。

| Query    | staleTime |
| -------- | --------- |
| ワードローブ詳細 | 5分        |
| 服一覧      | 1分        |
| テンプレート一覧 | 1分        |
| 履歴一覧     | 30秒       |
| 履歴詳細     | 30秒       |

また QueryClient の基本設定は以下とする。

```ts
staleTime: 30s
gcTime: 5m
retry: 1
refetchOnMount: true
refetchOnReconnect: true
refetchOnWindowFocus: false
```

---

# 9. Optimistic Update 方針

本システムでは **Optimistic Update は採用しない。**

理由は以下。

* 履歴作成 / 削除は clothing / template の統計情報も更新する
* ロールバック処理が複雑になる
* invalidate による再取得で十分な UX が得られる

そのため Mutation 成功後は

```
mutation成功
↓
invalidate
↓
query再取得
```

で整合性を維持する。

---

# 10. 画面との関係

画面ごとの Query 利用は以下の通り。

| 画面       | 利用Query                          |
| -------- | -------------------------------- |
| ホーム      | WardrobeDetail / Region / Weather / TemplateRecommendations |
| 履歴一覧     | HistoryList                      |
| 履歴詳細     | HistoryDetail                    |
| テンプレート一覧 | TemplateList                     |
| テンプレート詳細 | TemplateDetail                   |
| 服一覧      | ClothingList                     |
| 服詳細      | ClothingDetail                   |
| 記録画面     | TemplateList / ClothingList      |

---

# 11. まとめ

本システムの TanStack Query 設計は次の原則に基づく。

* キャッシュは **wardrobeId 単位**
* queryKey は **domain / wardrobeId / scope / id**
* Mutation 後は **参照波及先をすべて invalidate**
* optimistic update は使用しない
* Query Hook は **domain 単位で提供**

これにより

* キャッシュ整合性の担保
* 実装の単純化
* 将来の機能追加への対応

を実現する。
