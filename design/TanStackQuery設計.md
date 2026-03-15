# TanStack Query 設計

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
| ホーム      | WardrobeDetail / RecentHistories |
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