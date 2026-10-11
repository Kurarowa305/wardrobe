# 方針
* HTTP APIを採用

## 地域と天気とテンプレート推薦の確定契約

2026-10-11、[#276](https://github.com/Kurarowa305/wardrobe/issues/276)で[API契約と状態管理](タスク設計/地域天気テンプレート推薦_API契約と状態管理判断.md)を確定した。地域検索・取得・PUT更新、当日天気、5モードのテンプレート推薦、API-14の確認版・再送キー拡張は同契約に従う。実装は#279〜#283に対応する。#284の結合検証は実Webクライアント・HTTP API・DynamoDB Localを接続する。検証範囲は[結合テスト設計](テスト設計/ホーム改修_結合検証284.md)を参照する。

#282のWebクライアントは地域APIに加え、`GET /wardrobes/:wardrobeId/weather?date=<ISO JST日>&regionRevision=<版>` と `GET /wardrobes/:wardrobeId/recommendations/templates?mode=<5モード>&date=<ISO JST日>&regionRevision=<版>` を利用する。DTO型は`apps/web/src/api/schemas/home.ts`。天気と推薦は別要求でAbortSignalを受け取り、共通APIエラーをそのまま扱い、自動再試行しない。MSWは地域revisionと対象日を照合し、現在の構成服から推薦を計算する開発用fixture。実APIは共有天気サービスと強整合読取を使用し、結合テストで両者の接続を確認する。

既存の服推薦API-18と従来の履歴作成bodyは維持する。新ホームはテンプレート推薦APIを使用する。手動モードの保存・復元は行わず、ホーム再入場等では自動を初期値とする。

# API仕様
| API ID | メソッド   | パス                                               | 概要          | リクエスト                                                        | レスポンス                                                 | 備考                                             |
| ------ | ------ | ------------------------------------------------ | ----------- | ------------------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------- |
| API-01 | POST   | `/wardrobes`                                     | ワードローブ新規作成  | `name`                                                       | `wardrobeId`                                                              |  |
| API-02 | GET    | `/wardrobes/{wardrobeId}`                        | ワードローブ取得    | —                                                            | `name`                                                         |                                    |
| API-03 | GET    | `/wardrobes/{wardrobeId}/clothing`               | 服一覧（登録順）    | `order`(asc/desc), `genre`(tops/bottoms/others), `limit`, `cursor`                         | `items[]`, `nextCursor`                                        | ACTIVEのみ / レスポンス詳細は以下                                       |
| API-04 | POST   | `/wardrobes/{wardrobeId}/clothing`               | 服の追加        | `name`, `genre`, `imageKey?`, `tagIds?[]`                                          | —                                                              |                                    |
| API-05 | GET    | `/wardrobes/{wardrobeId}/clothing/{clothingId}`  | 服詳細取得       | —                                                            | `clothingId`, `name`, `genre`, `imageKey?`, `tagIds[]`, `status`, `wearCount`, `lastWornAt`       | レスポンス詳細は以下                                          |
| API-06 | PATCH  | `/wardrobes/{wardrobeId}/clothing/{clothingId}`  | 服の編集        | `name?`, `genre?`, `imageKey?`, `tagIds?[]`                                         | —                                                              |                                         |
| API-07 | DELETE | `/wardrobes/{wardrobeId}/clothing/{clothingId}`  | 服の削除（論理）    | —                                                            | —                                                              | 内部で `status=DELETED`                           |
| API-08 | GET    | `/wardrobes/{wardrobeId}/templates`              | テンプレ一覧（登録順） | `order`(asc/desc), `genre`(tops/bottoms/others), `limit`, `cursor`                         | `items[]`, `nextCursor`                                        | ACTIVEのみ / レスポンス詳細は以下                                       |
| API-09 | POST   | `/wardrobes/{wardrobeId}/templates`              | テンプレ追加      | `name`, `clothingIds[]`, `tagIds?[]`                                      | —                                                              |                           |
| API-10 | GET    | `/wardrobes/{wardrobeId}/templates/{templateId}` | テンプレ詳細取得    | —                                                            | `name`, `tagIds[]`, `status`, `wearCount`, `lastWornAt`, `clothingItems[]` |     |
| API-11 | PATCH  | `/wardrobes/{wardrobeId}/templates/{templateId}` | テンプレ編集      | `name?`, `clothingIds?[]`, `tagIds?[]`                                    | —                                                              |                                            |
| API-12 | DELETE | `/wardrobes/{wardrobeId}/templates/{templateId}` | テンプレ削除（論理）  | —                                                            | —                                                              | 内部で `status=DELETED`                               |
| API-13 | GET    | `/wardrobes/{wardrobeId}/histories`              | 履歴一覧（日付順）   | `from`(yyyymmdd), `to`(yyyymmdd), `order`, `limit`, `cursor` | `items[]`, `nextCursor`                                        | 並びは `date` / レスポンス詳細は以下                                   |
| API-14 | POST   | `/wardrobes/{wardrobeId}/histories`              | 履歴作成（今日着た）  | `date`, `templateId?`, `clothingIds?[]`, `expectedTemplateRevision?` / `Idempotency-Key?` | `{historyId}` | 初回201・成功再送200。確認版には操作キー必須 |
| API-15 | GET    | `/wardrobes/{wardrobeId}/histories/{historyId}`  | 履歴詳細取得      | —                                                            | `date`, `templateName?`, `clothingItems[]`                     |     |
| API-16 | DELETE | `/wardrobes/{wardrobeId}/histories/{historyId}`  | 履歴削除（物理）    | —                                                            | —                                                              |                                           |
| API-17 | POST   | `/wardrobes/{wardrobeId}/images/presign` | 画像アップロード用の署名付きURL発行 | `contentType`, `category`, `extension?` | `imageKey`, `uploadUrl`, `expiresAt`, `method` | クライアントがS3へ直接PUTするためのURL |
| API-18 | GET    | `/wardrobes/{wardrobeId}/recommendations/clothing` | おすすめ服取得 | — | `season`, `seasonTagIds`, `items.tops[]`, `items.bottoms[]` | 季節タグと最終着用日が古い順で抽出 |
| REGION-SEARCH | GET | `/regions` | 地域検索 | `q` | `datasetVersion`, `items`, `hasMore` | ABR固定辞書 |
| REGION-GET | GET | `/wardrobes/{wardrobeId}/region` | 保存地域 | — | `revision`, `region` | 未設定0/null |
| REGION-PUT | PUT | `/wardrobes/{wardrobeId}/region` | 地域設定・解除 | `regionId`, `datasetVersion?`, `expectedRevision` | `revision`, `region` | CAS更新 |
| WEATHER | GET | `/wardrobes/{wardrobeId}/weather` | JST当日予報 | `date`, `regionRevision` | 下記「当日天気API」参照 | 翌00:00まで再利用 |
| TEMPLATE-RECOMMENDATIONS | GET | `/wardrobes/{wardrobeId}/recommendations/templates` | おすすめテンプレート | `date`, `regionRevision`, `mode?` | `status`, `basis`, `items`ほか | 最大3件、retryなし |



---

# タグID

服・テンプレートの `tagIds` は以下の固定IDを受け付ける。タグマスタAPIは持たず、API側の許可IDを正本とする。

| tagId | 表示名 |
| --- | --- |
| `season:spring` | 春 |
| `season:summer` | 夏 |
| `season:autumn` | 秋 |
| `season:winter` | 冬 |
| `season:all` | オールシーズン |

---

# API-01 ワードローブ新規作成

### POST `/wardrobes`

## Request

| フィールド | 型      | 説明      |
| ----- | ------ | ------- |
| name  | string | ワードローブ名 |

```json
{
  "name": "My Wardrobe"
}
```

## Response

| フィールド      | 型      | 説明            |
| ---------- | ------ | ------------- |
| wardrobeId | string | 発行されたワードローブID |

```json
{
  "wardrobeId": "wd_01HZZ8ABCDEF1234567890"
}
```

## Error
| HTTP | error.code             | 発生条件                                    |
| ---: | ---------------------- | --------------------------------------- |
|  400 | VALIDATION_ERROR       | `name` 未指定 / 空文字 / 最大文字数超過              |
|  415 | UNSUPPORTED_MEDIA_TYPE | `Content-Type` が `application/json` でない |
|  429 | RATE_LIMITED           | 短時間の過剰リクエスト                             |
|  500 | INTERNAL_ERROR         | サーバー内部エラー                               |


---

# API-02 ワードローブ取得

### GET `/wardrobes/{wardrobeId}`

## Response

| フィールド | 型      | 説明      |
| ----- | ------ | ------- |
| name  | string | ワードローブ名 |

```json
{
  "name": "My Wardrobe"
}
```

## Error
| HTTP | error.code     | 発生条件                |
| ---: | -------------- | ------------------- |
|  404 | NOT_FOUND      | `wardrobeId` が存在しない |
|  429 | RATE_LIMITED   | 短時間の過剰リクエスト         |
|  500 | INTERNAL_ERROR | サーバー内部エラー           |


---

# API-03 服一覧（登録順）

### GET `/wardrobes/{wardrobeId}/clothing`

## Request

| フィールド  | 型       | 説明             |
| ------ | ------- | -------------- |
| order  | string  | `asc` / `desc` |
| genre  | string? | `tops` / `bottoms` / `others` |
| limit  | number  | 取得件数 / 上限50件          |
| cursor | string? | ページング時の開始位置(ResponseのnextCursorを渡す)          |

※本APIの cursor は、当該APIにおける並び順および取得条件を前提としたページング位置を示す。
並び順または取得条件を変更した場合、cursor は使用できない。
※ `genre` 指定時は DB の `status+genre` インデックスを使用し、絞り込み後の結果をページングする（サーバー側の後段filterは行わない）。

## Response
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| items | []?  | 服概要 / 返却対象：status=ACTIVE のみ           |
| nextCursor       | string?  | ページング時の次回開始位置             |

### items[]

| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| clothingId | string  | 服ID            |
| name       | string  | 服名             |
| genre      | string  | `tops` / `bottoms` / `others` |
| imageKey   | string? | 画像キー           |
| tagIds     | string[] | タグID配列          |

```json
{
  "items": [
    {
      "clothingId": "cl_01HZZAAA",
      "name": "黒Tシャツ",
      "genre": "tops",
      "imageKey": "clothing/black_t.png",
      "tagIds": ["season:summer"]
    }
  ],
  "nextCursor": "CREATED#1735600000000#cl_01HZZAAA"
}
```

## Error
| HTTP | error.code       | 発生条件                     |
| ---: | ---------------- | ------------------------ |
|  400 | VALIDATION_ERROR | `order` 不正 / `limit` 範囲外 |
|  400 | INVALID_CURSOR   | `cursor` が不正、または並び条件と不一致 |
|  404 | NOT_FOUND        | `wardrobeId` が存在しない      |
|  429 | RATE_LIMITED     | 過剰リクエスト                  |
|  500 | INTERNAL_ERROR   | 内部エラー                    |


---

# API-04 服の追加

### POST `/wardrobes/{wardrobeId}/clothing`

## Request

| フィールド    | 型       | 説明   |
| -------- | ------- | ---- |
| name     | string  | 服名 / 上限40字   |
| genre    | string  | `tops` / `bottoms` / `others` |
| imageKey | string? | 画像キー |
| tagIds   | string[]? | タグID配列 |

```json
{
  "name": "白シャツ",
  "imageKey": "clothing/white_shirt.png",
  "tagIds": ["season:all"]
}
```

## Error
| HTTP | error.code             | 発生条件                              |
| ---: | ---------------------- | --------------------------------- |
|  400 | VALIDATION_ERROR       | `name` 未指定 / 長すぎる / `imageKey` 不正 |
|  404 | NOT_FOUND              | `wardrobeId` が存在しない               |
|  413 | PAYLOAD_TOO_LARGE      | リクエストサイズ超過                        |
|  415 | UNSUPPORTED_MEDIA_TYPE | Content-Type 不正                   |
|  500 | INTERNAL_ERROR         | 内部エラー                             |


---

# API-05 服詳細取得

### GET `/wardrobes/{wardrobeId}/clothing/{clothingId}`

## Response

| フィールド      | 型       | 説明                   |
| ---------- | ------- | -------------------- |
| clothingId | string  | 服ID                  |
| name       | string  | 服名                   |
| genre      | string  | `tops` / `bottoms` / `others` |
| imageKey   | string? | 画像キー                 |
| tagIds     | string[] | タグID配列                |
| status     | string  | `ACTIVE` / `DELETED`　※削除済みでも取得可能 |
| wearCount  | number  | 着用回数                 |
| lastWornAt | number  | 最終着用日時（未着用は 0）       |

```json
{
  "clothingId": "cl_01HZZAAA",
  "name": "黒Tシャツ",
  "imageKey": "clothing/black_t.png",
  "tagIds": ["season:summer"],
  "status": "ACTIVE",
  "wearCount": 12,
  "lastWornAt": 1735690000123
}
```

## Error
| HTTP | error.code     | 発生条件                                 |
| ---: | -------------- | ------------------------------------ |
|  404 | NOT_FOUND      | `wardrobeId` または `clothingId` が存在しない |
|  500 | INTERNAL_ERROR | 内部エラー                                |


---

# API-06 服の編集

### PATCH `/wardrobes/{wardrobeId}/clothing/{clothingId}`

## Request

| フィールド    | 型       | 説明   |
| -------- | ------- | ---- |
| name     | string? | 服名   |
| genre    | string? | `tops` / `bottoms` / `others` |
| imageKey | string? | 画像キー |
| tagIds   | string[]? | タグID配列 |

```json
{
  "name": "黒Tシャツ（夏用）",
  "genre": "tops",
  "tagIds": ["season:summer"]
}
```

## Error
| HTTP | error.code             | 発生条件                   |
| ---: | ---------------------- | ---------------------- |
|  400 | VALIDATION_ERROR       | `name` / `genre` / `imageKey` 不正 |
|  404 | NOT_FOUND              | 対象の服が存在しない             |
|  415 | UNSUPPORTED_MEDIA_TYPE | Content-Type 不正        |
|  500 | INTERNAL_ERROR         | 内部エラー                  |

---

# API-07 服の削除（論理）

### DELETE `/wardrobes/{wardrobeId}/clothing/{clothingId}`

## Error
| HTTP | error.code     | 発生条件       |
| ---: | -------------- | ---------- |
|  404 | NOT_FOUND      | 対象の服が存在しない |
|  500 | INTERNAL_ERROR | 内部エラー      |


---

# API-08 テンプレ一覧（登録順）

### GET `/wardrobes/{wardrobeId}/templates`

## Request

| フィールド  | 型       | 説明             |
| ------ | ------- | -------------- |
| order  | string  | `asc` / `desc` |
| limit  | number  | 取得件数 / 上限30件           |
| cursor | string? | ページング時の開始位置(ResponseのnextCursorを渡す)             |

※本APIの cursor は、当該APIにおける並び順および取得条件を前提としたページング位置を示す。
並び順または取得条件を変更した場合、cursor は使用できない。

## Response
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| items | []?  | テンプレ概要  / 返却対象：status=ACTIVE のみ          |
| nextCursor       | string?  | ページング時の次回開始位置             |
### items[]

| フィールド         | 型              | 説明             |
| ------------- | -------------- | -------------- |
| templateId    | string         | テンプレID         |
| name          | string         | テンプレ名          |
| tagIds        | string[]       | タグID配列          |
| clothingItems | [] | 構成服（順序付き・全件）   |

### template
| フィールド      | 型      | 説明 |
| ---------- | ------ | ---- |
| templateId | string | テンプレートID |
| name       | string | テンプレート名 |
| wearCount  | number | 着用回数 |
| lastWornAt | number | 最終着用日時（未着用は 0） |

### clothingItems[]
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| clothingId | string  | 服ID            |
| imageKey   | string? | 画像キー           |
| status     | string  | `ACTIVE` / `DELETED`　※服削除済みでも取得可能 |

```json
{
  "items": [
    {
      "templateId": "tp_01HZZBBB",
      "name": "普段着",
      "tagIds": ["season:all"],
      "clothingItems": [
        {
          "clothingId": "cl_01",
          "imageKey": "clothing/black.png",
          "status": "ACTIVE"
        },
        {
          "clothingId": "cl_02",
          "imageKey": null,
          "status": "DELETED"
        }
      ]
    }
  ],
  "nextCursor": null
}
```

## Error
| HTTP | error.code       | 発生条件                 |
| ---: | ---------------- | -------------------- |
|  400 | VALIDATION_ERROR | `order` / `limit` 不正 |
|  400 | INVALID_CURSOR   | `cursor` 不正          |
|  404 | NOT_FOUND        | `wardrobeId` が存在しない  |
|  500 | INTERNAL_ERROR   | 内部エラー                |


---

# API-09 テンプレ追加

### POST `/wardrobes/{wardrobeId}/templates`

## Request

| フィールド       | 型        | 説明          |
| ----------- | -------- | ----------- |
| name        | string   | テンプレ名 / 上限40字       |
| clothingIds | string[] | 構成服ID（順序付き） |
| tagIds      | string[]? | タグID配列 |

```json
{
  "name": "仕事用",
  "clothingIds": ["cl_01", "cl_02"],
  "tagIds": ["season:all"]
}
```

## Error
| HTTP | error.code             | 発生条件                             |
| ---: | ---------------------- | -------------------------------- |
|  400 | VALIDATION_ERROR       | `name` 不正 / `clothingIds` 空・上限超過 |
|  404 | NOT_FOUND              | `wardrobeId` または参照服が存在しない        |
|  409 | CONFLICT               | `clothingIds` に重複がある（禁止する場合）     |
|  413 | PAYLOAD_TOO_LARGE      | リクエストサイズ超過                       |
|  415 | UNSUPPORTED_MEDIA_TYPE | Content-Type 不正                  |
|  500 | INTERNAL_ERROR         | 内部エラー                            |


---

# API-10 テンプレ詳細取得

### GET `/wardrobes/{wardrobeId}/templates/{templateId}`

## Response

| フィールド         | 型              | 説明                   |
| ------------- | -------------- | -------------------- |
| name          | string         | テンプレ名                |
| tagIds        | string[]       | タグID配列                |
| status        | string         | `ACTIVE` / `DELETED`　※服削除済みでも取得可能 |
| wearCount     | number         | 着用回数                 |
| lastWornAt    | number         | 最終着用                 |
| clothingItems | [] | 構成服（順序付き）            |

### template
| フィールド      | 型      | 説明 |
| ---------- | ------ | ---- |
| templateId | string | テンプレートID |
| name       | string | テンプレート名 |
| wearCount  | number | 着用回数 |
| lastWornAt | number | 最終着用日時（未着用は 0） |

### clothingItems[]
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| clothingId | string  | 服ID            |
| name       | string  | 服名             |
| genre      | string  | `tops` / `bottoms` / `others` |
| imageKey   | string? | 画像キー           |
| status     | string  | `ACTIVE` / `DELETED`　※服削除済みでも取得可能 |
| wearCount  | number  | 着用回数           |
| lastWornAt | number  | 最終着用日時（未着用は 0） |

```json
{
  "name": "普段着",
  "tagIds": ["season:all"],
  "status": "ACTIVE",
  "wearCount": 8,
  "lastWornAt": 1735600000000,
  "clothingItems": [
    {
      "clothingId": "cl_01",
      "name": "黒Tシャツ",
      "imageKey": "clothing/black.png",
      "status": "ACTIVE",
      "wearCount": 8,
      "lastWornAt": 1735600000000
    }
  ]
}
```

## Error
| HTTP | error.code     | 発生条件         |
| ---: | -------------- | ------------ |
|  404 | NOT_FOUND      | 対象テンプレが存在しない |
|  500 | INTERNAL_ERROR | 内部エラー        |


---

# API-11 テンプレ編集

### PATCH `/wardrobes/{wardrobeId}/templates/{templateId}`

## Request

| フィールド       | 型         | 説明          |
| ----------- | --------- | ----------- |
| name        | string?   | テンプレ名       |
| clothingIds | string[]? | 構成服ID（順序付き） |
| tagIds      | string[]? | タグID配列 |

```json
{
  "name": "普段着（夏）",
  "clothingIds": ["cl_01", "cl_03"],
  "tagIds": ["season:summer"]
}
```

## Error
| HTTP | error.code             | 発生条件                      |
| ---: | ---------------------- | ------------------------- |
|  400 | VALIDATION_ERROR       | `name` / `clothingIds` 不正 |
|  404 | NOT_FOUND              | 対象テンプレまたは参照服が存在しない        |
|  409 | CONFLICT               | `clothingIds` に重複         |
|  415 | UNSUPPORTED_MEDIA_TYPE | Content-Type 不正           |
|  500 | INTERNAL_ERROR         | 内部エラー                     |

---

# API-12 テンプレ削除（論理）

### DELETE `/wardrobes/{wardrobeId}/templates/{templateId}`

## Error
| HTTP | error.code     | 発生条件         |
| ---: | -------------- | ------------ |
|  404 | NOT_FOUND      | 対象テンプレが存在しない |
|  500 | INTERNAL_ERROR | 内部エラー        |

---

# API-13 履歴一覧（日付順）

### GET `/wardrobes/{wardrobeId}/histories`

## Request

| フィールド  | 型       | 説明                     |
| ------ | ------- | ---------------------- |
| from   | string? | `yyyymmdd`（開始）         |
| to     | string? | `yyyymmdd`（終了）         |
| order  | string  | `asc` / `desc`（date基準） |
| limit  | number  | 取得件数 / 上限30件                   |
| cursor | string? | ページング時の開始位置(ResponseのnextCursorを渡す)                    |

※本APIの cursor は、当該APIにおける並び順および取得条件を前提としたページング位置を示す。
並び順または取得条件を変更した場合、cursor は使用できない。

## Response
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| items | []?  | 服概要            |
| nextCursor       | string?  | ページング時の次回開始位置             |

### items[]

| フィールド         | 型              | 説明                               |
| ------------- | -------------- | -------------------------------- |
| historyId     | string         | 履歴ID                             |
| date          | string         | `yyyymmdd`                       |
| name  | string?        | テンプレ入力ならテンプレ名（組み合わせ入力なら null） |
| clothingItems | [] | 着用服（順序付き）                     |

### template
| フィールド      | 型      | 説明 |
| ---------- | ------ | ---- |
| templateId | string | テンプレートID |
| name       | string | テンプレート名 |
| wearCount  | number | 着用回数 |
| lastWornAt | number | 最終着用日時（未着用は 0） |

### clothingItems[]
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| clothingId | string  | 服ID            |
| name       | string  | 服名             |
| genre      | string  | `tops` / `bottoms` / `others` |
| imageKey   | string? | 画像キー           |
| status     | string  | `ACTIVE` / `DELETED` |

```json
{
  "items": [
    {
      "historyId": "hs_01HZZCCC",
      "date": "20260101",
      "name": "普段着",
      "clothingItems": [
        {
          "clothingId": "cl_01",
          "name": "黒Tシャツ",
          "imageKey": "clothing/black.png",
          "status": "ACTIVE",
          "wearCount": 8,
          "lastWornAt": 1735600000000
        },
        {
          "clothingId": "cl_02",
          "name": "デニム",
          "imageKey": null,
          "status": "ACTIVE",
          "wearCount": 8,
          "lastWornAt": 1735600000000
        }
      ]
    }
  ],
  "nextCursor": "DATE#20251225#hs_01"
}
```

## Error
| HTTP | error.code       | 発生条件                           |
| ---: | ---------------- | ------------------------------ |
|  400 | VALIDATION_ERROR | `from/to` 形式不正、範囲逆転、`limit` 不正 |
|  400 | INVALID_CURSOR   | `cursor` 不正                    |
|  404 | NOT_FOUND        | `wardrobeId` が存在しない            |
|  500 | INTERNAL_ERROR   | 内部エラー                          |


---

# API-14 履歴作成（今日着た）

### POST `/wardrobes/{wardrobeId}/histories`

## Request

| フィールド      | 型       | 説明         |
| ---------- | ------- | ---------- |
| date       | string  | `yyyymmdd` |
| templateId | string? | テンプレID     |
| clothingIds | string[]? | 服ID配列（順序付き） |

```json
{
  "date": "20260101",
  "templateId": "tp_01HZZBBB"
}
```

## Error
| HTTP | error.code             | 発生条件                              |
| ---: | ---------------------- | --------------------------------- |
|  400 | VALIDATION_ERROR       | `date` 不正 / `clothingIds` 空・上限超過  |
|  409 | CONFLICT               | `templateId` と `clothingIds` 同時指定 |
|  404 | NOT_FOUND              | 参照テンプレまたは服が存在しない                  |
|  415 | UNSUPPORTED_MEDIA_TYPE | Content-Type 不正                   |
|  500 | INTERNAL_ERROR         | 内部エラー                             |

---

# API-15 履歴詳細取得

### GET `/wardrobes/{wardrobeId}/histories/{historyId}`

## Response

| フィールド         | 型              | 説明            |
| ------------- | -------------- | ------------- |
| date          | string         | `yyyymmdd`    |
| templateName  | string?        | テンプレ入力ならテンプレ名 |
| template      | object?         | テンプレ入力時のテンプレート詳細 |
| clothingItems | [] | 着用服（順序付き）     |

### template
| フィールド      | 型      | 説明 |
| ---------- | ------ | ---- |
| templateId | string | テンプレートID |
| name       | string | テンプレート名 |
| wearCount  | number | 着用回数 |
| lastWornAt | number | 最終着用日時（未着用は 0） |

### clothingItems[]
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| clothingId | string  | 服ID            |
| name       | string  | 服名             |
| genre      | string  | `tops` / `bottoms` / `others` |
| imageKey   | string? | 画像キー           |
| status     | string  | `ACTIVE` / `DELETED` |
| wearCount  | number  | 着用回数           |
| lastWornAt | number  | 最終着用日時（未着用は 0） |

```json
{
  "date": "20260101",
  "templateName": "普段着",
  "template": {
    "templateId": "tp_01",
    "name": "普段着",
    "wearCount": 12,
    "lastWornAt": 1735600000000
  },
  "clothingItems": [
    {
      "clothingId": "cl_01",
      "name": "黒Tシャツ",
      "imageKey": "clothing/black.png",
      "status": "ACTIVE",
      "wearCount": 8,
      "lastWornAt": 1735600000000
    }
  ]
}
```

## Error
| HTTP | error.code     | 発生条件       |
| ---: | -------------- | ---------- |
|  404 | NOT_FOUND      | 対象履歴が存在しない |
|  500 | INTERNAL_ERROR | 内部エラー      |

---

# API-16 履歴削除（物理）

### DELETE `/wardrobes/{wardrobeId}/histories/{historyId}`

## Error
| HTTP | error.code     | 発生条件       |
| ---: | -------------- | ---------- |
|  404 | NOT_FOUND      | 対象履歴が存在しない |
|  500 | INTERNAL_ERROR | 内部エラー      |

---

# API-17 画像アップロードURL発行

### POST `/wardrobes/{wardrobeId}/images/presign`

## Request

| フィールド     | 型      | 説明 |
|-----------|--------|----|
| contentType | string | アップロードする画像の Content-Type（例: `image/jpeg`, `image/png`, `image/webp`） |
| category    | string | 画像の用途（`clothing` / `template`） |
| extension   | string? | ファイル拡張子（例: `jpg`, `png`, `webp`）。指定がない場合はサーバー側で `contentType` から推定 |

```json
{
  "contentType": "image/jpeg",
  "category": "clothing",
  "extension": "jpg"
}
```

## Response
| フィールド     | 型      | 説明                              |
| --------- | ------ | ------------------------------- |
| imageKey  | string | 登録・更新APIに渡す画像キー（S3オブジェクトキー）     |
| uploadUrl | string | S3へのアップロードに使用する署名付きURL（`PUT` 用） |
| method    | string | アップロードHTTPメソッド（固定で `PUT`）       |
| expiresAt | string | 署名付きURLの有効期限（ISO 8601）          |

```json
{
  "imageKey": "clothing/wd_01HZZ8ABCDEF1234567890/01J0K2M3N4P5Q6R7S8T9U0V1W2.jpg",
  "uploadUrl": "https://s3.ap-northeast-1.amazonaws.com/....(presigned url)....",
  "method": "PUT",
  "expiresAt": "2026-01-02T06:00:00Z"
}
```
※クライアントのアップロード手順
- uploadUrl に対して PUT でアップロードする
- Content-Type ヘッダーは Request.contentType と同一 を指定する
- アップロード成功後、服/テンプレートの登録・更新APIへ imageKey を渡して保存する

## Error
| HTTP | error.code             | 発生条件                                              |
| ---: | ---------------------- | ------------------------------------------------- |
|  400 | VALIDATION_ERROR       | `contentType` 不正 / `category` 不正 / `extension` 不正 |
|  404 | NOT_FOUND              | `wardrobeId` が存在しない                               |
|  415 | UNSUPPORTED_MEDIA_TYPE | `Content-Type` が `application/json` でない           |
|  429 | RATE_LIMITED           | 短時間の過剰リクエスト                                       |
|  500 | INTERNAL_ERROR         | サーバー内部エラー                                         |

---

# API-18 おすすめ服取得

### GET `/wardrobes/{wardrobeId}/recommendations/clothing`

現在季節に対応するタグ、または `season:all` を持つ `ACTIVE` の服から、最終着用日が古い順にトップス2件、ボトムス2件を返す。

季節判定は JST 基準で行う。

| 季節 | 月 |
| --- | --- |
| 春 | 3〜5月 |
| 夏 | 6〜8月 |
| 秋 | 9〜11月 |
| 冬 | 12〜2月 |

## Response

| フィールド | 型 | 説明 |
| --- | --- | --- |
| season | string | `spring` / `summer` / `autumn` / `winter` |
| seasonTagIds | string[] | 推薦対象にした季節タグ。現在季節タグ + `season:all` |
| items.tops | object[] | おすすめトップス。最大2件 |
| items.bottoms | object[] | おすすめボトムス。最大2件 |

### items.tops[] / items.bottoms[]

| フィールド | 型 | 説明 |
| --- | --- | --- |
| clothingId | string | 服ID |
| name | string | 服名 |
| genre | string | `tops` / `bottoms` |
| imageKey | string? | 画像キー |
| tagIds | string[] | タグID配列 |
| wearCount | number | 着用回数 |
| lastWornAt | number | 最終着用日時（未着用は 0） |

```json
{
  "season": "spring",
  "seasonTagIds": ["season:spring", "season:all"],
  "items": {
    "tops": [
      {
        "clothingId": "cl_01HZZAAA",
        "name": "白シャツ",
        "genre": "tops",
        "imageKey": null,
        "tagIds": ["season:spring"],
        "wearCount": 3,
        "lastWornAt": 1735600000000
      }
    ],
    "bottoms": []
  }
}
```

## Error
| HTTP | error.code     | 発生条件                |
| ---: | -------------- | ------------------- |
|  404 | NOT_FOUND      | `wardrobeId` が存在しない |
|  429 | RATE_LIMITED   | 短時間の過剰リクエスト         |
|  500 | INTERNAL_ERROR | サーバー内部エラー           |

---

# エラーレスポンス共通フォーマット

| フィールド           | 型       | 説明                        |
| --------------- | ------- | ------------------------- |
| error           | object  | エラー本体                     |
| error.code      | string  | アプリ向けの固定エラーコード            |
| error.message   | string  | 人間向けの簡潔な説明 |
| error.details   | object? | フィールド単位の詳細（バリデーションなど）     |
| error.requestId | string? | サーバー側トレース用ID（ログ追跡用）       |

**例**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters.",
    "details": { "limit": "must be between 1 and 50" },
    "requestId": "req_01HZ..."
  }
}
```

## エラー仕様一覧

| HTTP | error.code             | エラー名       | 発生条件（代表例）                                                        | 対象API（例）                  | details例                                                            |
| ---: | ---------------------- | ---------- | ---------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
|  400 | VALIDATION_ERROR       | バリデーションエラー | 必須欠落、型不正、文字数超過、配列上限超過、`order`不正、`from/to`形式不正、`limit`範囲外         | 全API                      | `{ "name": "required" }`                                            |
|  400 | INVALID_CURSOR         | カーソル不正     | `cursor` が不正形式／期限切れ／並び替え条件と不一致                                   | 一覧系（API-03/08/13）         | `{ "cursor": "invalid or mismatched order/index" }`                 |
|  404 | NOT_FOUND              | リソースなし     | `wardrobeId` / `clothingId` / `templateId` / `historyId` が存在しない  | 全API                      | `{ "resource": "template" }`                                        |
|  409 | CONFLICT               | 競合/矛盾      | 例えば履歴作成で `templateId` と `clothingIds` を同時指定、編集で入力種別が矛盾、削除済み復元不可等 | API-09/11/14              | `{ "reason": "templateId and clothingIds are mutually exclusive" }` |
|  413 | PAYLOAD_TOO_LARGE      | ペイロード過大    | `clothingIds` が大きすぎる、リクエストボディが上限超過                               | 作成/編集（API-04/09/11/14） | `{ "clothingIds": "too many items" }`                               |
|  415 | UNSUPPORTED_MEDIA_TYPE | 形式非対応      | `Content-Type` が `application/json` でない等                         | POST/PATCH全般              | —                                                                   |
|  429 | RATE_LIMITED           | レート制限      | 短時間に過剰リクエスト                                                      | 全API                      | `{ "retryAfterSec": 2 }`                                            |
|  500 | INTERNAL_ERROR         | サーバー内部エラー  | 想定外例外、依存障害                                                       | 全API                      | —                                                                   |
|  503 | SERVICE_UNAVAILABLE    | 一時利用不可     | DynamoDBスロットリングが継続、メンテ等                                          | 全API                      | `{ "retryAfterSec": 5 }`                                            |
|  999 | UNKNOWN_ERROR    | 不明なエラー     | -                                         | 全API                      | -                                            |

---


## 履歴統計の整合性（#278）

API-14 / API-16 は記録時の全構成服を対象に、履歴・日別件数・着用回数・最終着用日・索引を同一トランザクションで更新する。同日に複数の履歴が残る場合、1件削除しても最終着用日を保持する。最新日の最後の履歴を削除すると前の着用日へ戻り、全件削除で0になる。過去日の追加は最終着用日を後退させない。未来日の扱いも同じ。

統計・日別件数の条件付き書き込み失敗とトランザクション競合は `409 CONFLICT`。API-16で対象日の日別件数が欠落・不正な場合も同じ。失敗したトランザクションの履歴や統計は部分反映しない。再読込後に利用者が再操作でき、アプリケーションによる自動再送は行わない。認証・容量等の失敗を一律に競合へ分類しない。

API-06 / API-11 の通常編集は統計を保持する。内部の `statsVersion` は公開リクエスト・レスポンスに追加しない。

## 当日天気 API（#280）

`GET /wardrobes/:wardrobeId/weather?date=YYYY-MM-DD&regionRevision=非負整数` は wardrobe Lambda が処理する。date/revision は必須で、重複・未知query・実在しない日付・安全整数外は400。入口と応答前にJST当日/地域版を照合し、変更時は409（`TARGET_DATE_CHANGED` / `REGION_CHANGED`）。未知wardrobeは404、共有DB失敗は503。

DTOは[契約Q9](タスク設計/地域天気テンプレート推薦_API契約と状態管理判断.md)に一致し、`region_required` / `available` / `unavailable` を返す。日次個別値は有限数またはnull。指数は丸め前の最高体感温度15/25°C境界、最高実気温fallbackでは指数null。自動季節名は返さない。外部失敗・不正構造はunavailable、前日データは使わない。

入口から10秒（DB読取合計5秒、外部取得・同キー待機合計4秒）。SDK retry=0、外部fetch retry=0、AbortSignalを下位I/Oへ渡す。内部呼出側の推薦も `createWeatherService().resolveForecast(region,date,budget)` と同じ `WeatherBudget` を共有する。当日成功キャッシュを外部呼出より優先する。
## 地域設定 API (#279)

`GET /regions?q=` は固定ABR辞書（1,918件）をNFKC・かな統一で検索し、完全一致→前方一致→部分一致、同点コード順で10件まで返す。空・64コードポイント超・重複query・未知queryは400。DTOは `{datasetVersion,items:[{regionId,label}],hasMore}`。

`GET /wardrobes/:wardrobeId/region` と `PUT /wardrobes/:wardrobeId/region` の成功DTOは `{revision,region:{regionId,label,datasetVersion}|null}`。既存未設定は0/null。PUTは `{regionId,datasetVersion,expectedRevision}`、解除は `{regionId:null,expectedRevision}`。JSONのみ、未知属性・不正整数は拒否。未知コードは400 UNKNOWN_REGION、辞書版変更と保存版競合は409 REGION_DATASET_CHANGED/REGION_CHANGED（details.reason）。PUT結果不明の再送も古い版では409。未知wardrobeは404。

経路は既存wardrobe Lambdaとlocal共通handler。既存wardrobe IAMのGetItem/UpdateItemを使い追加権限・環境変数不要。Web共通clientにPUTとAbortSignal対応endpoint、DTO検証とMSWを追加。画面側の明示検索・応答世代管理は`features/home/useRegionDialog`が担当する。

## ホーム確認記録・再送（#283）

既存 `POST /wardrobes/:wardrobeId/histories` に `Idempotency-Key: UUID` とtemplate bodyの `expectedTemplateRevision`（安全な非負整数）を追加。確認版を送る場合は操作キー必須。既存bodyは互換維持。dateは実在するyyyymmddを検証し、過去・未来の制限は設けない。

初回201 `{historyId}`、同キー同内容の成功再送200で元のID。操作記録を先に強整合確認するため、その後のテンプレート編集は再送を妨げない。異なる内容は409 `IDEMPOTENCY_KEY_REUSED`、保存済み履歴を削除した後は409 `HISTORY_ALREADY_DELETED`。確認版・ACTIVE不一致は409 `CONFIRMATION_STALE`。確認時の構成服が消えた場合も同じ。未処理BatchGetは503。statsVersion競合は既存CONFLICTを保持する。

履歴・全服/テンプレートの日別/統計・操作記録を同一transactionで保存する。確認条件は既存統計Updateへ追加し、同一アイテムのConditionCheckを別に作らない。書込SDKはmaxAttempts=1で自動再送なし。結果不明時は同じ操作キーとbodyで明示再送する。
## テンプレート推薦 API (#281)

`GET /wardrobes/:wardrobeId/recommendations/templates?date=YYYY-MM-DD&regionRevision=0&mode=auto`。modeは省略auto、spring/summer/autumn/winter。厳密な実在日と安全整数、未知/重複queryは400。応答前にもJST日・地域版を検査し409 TARGET_DATE_CHANGED/REGION_CHANGEDを返す。

DTOは契約Q9のwardrobeId/regionRevision/targetDate/mode/status/basis/items。region_required、weather_required（reason/retryAfter）、empty、readyを区別。自動は共有天気解決後に候補取得、手動は天気を呼ばない。丸め前15/25度、体感優先・最高実気温fallback、春秋ORと全区分season:all。候補は構成服最終着用日の最大値→createdAt→IDの昇順最大3件。全構成服と確認revisionを返し内部順位/季節を返さない。

入口10秒の共通WeatherBudgetで、META/天気共有状態/全候補のDB読取を合計5秒に収める。SDK maxAttempts=1。ベースQuery全ページ強整合→必要服IDを重複排除し80件/最大4並行BatchGet強整合。候補間の共通服は除去しない。欠落・削除服を含む候補は除外、未処理キー/期限/読取失敗は503。local/Lambdaはtemplate domain、既存IAMのtable Get/Query/BatchGet/Updateを利用する。

テンプレート詳細GETへrevisionを追加。作成1、旧データ0、名前/構成服/タグの内容変更と削除で増加、同内容・統計更新では維持する。同時編集/削除の条件不成立は409 TEMPLATE_CHANGED。

#283 同一操作の競合: 初回の操作照合後に別要求が確定する場合があるため、テンプレート・構成服の事前検証失敗時にも操作を再照合する。既存の成功結果・削除墓標・同キー内容不一致を優先し、成功済み操作を確認版の変化によって新操作へ置き換えない。
