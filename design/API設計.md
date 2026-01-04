# 方針
* HTTP APIを採用
# API仕様
| API ID | メソッド   | パス                                               | 概要          | リクエスト                                                        | レスポンス                                                 | 備考                                             |
| ------ | ------ | ------------------------------------------------ | ----------- | ------------------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------- |
| API-01 | POST   | `/wardrobes`                                     | ワードローブ新規作成  | `name`                                                       | `wardrobeId`                                                              |  |
| API-02 | GET    | `/wardrobes/{wardrobeId}`                        | ワードローブ取得    | —                                                            | `name`                                                         |                                    |
| API-03 | GET    | `/wardrobes/{wardrobeId}/clothing`               | 服一覧（登録順）    | `order`(asc/desc), `limit`, `cursor`                         | `items[]`, `nextCursor`                                        | ACTIVEのみ / レスポンス詳細は以下                                       |
| API-04 | POST   | `/wardrobes/{wardrobeId}/clothing`               | 服の追加        | `name`, `imageKey?`                                          | —                                                              |                                    |
| API-05 | GET    | `/wardrobes/{wardrobeId}/clothing/{clothingId}`  | 服詳細取得       | —                                                            | `name`, `imageKey?`, `status`, `wearCount`, `lastWornAt`       | レスポンス詳細は以下                                          |
| API-06 | PATCH  | `/wardrobes/{wardrobeId}/clothing/{clothingId}`  | 服の編集        | `name?`, `imageKey?`                                         | —                                                              |                                         |
| API-07 | DELETE | `/wardrobes/{wardrobeId}/clothing/{clothingId}`  | 服の削除（論理）    | —                                                            | —                                                              | 内部で `status=DELETED`                           |
| API-08 | GET    | `/wardrobes/{wardrobeId}/templates`              | テンプレ一覧（登録順） | `order`(asc/desc), `limit`, `cursor`                         | `items[]`, `nextCursor`                                        | ACTIVEのみ / レスポンス詳細は以下                                       |
| API-09 | POST   | `/wardrobes/{wardrobeId}/templates`              | テンプレ追加      | `name`, `clothingIds[]`                                      | —                                                              |                           |
| API-10 | GET    | `/wardrobes/{wardrobeId}/templates/{templateId}` | テンプレ詳細取得    | —                                                            | `name`, `status`, `wearCount`, `lastWornAt`, `clothingItems[]` |     |
| API-11 | PATCH  | `/wardrobes/{wardrobeId}/templates/{templateId}` | テンプレ編集      | `name?`, `clothingIds?[]`                                    | —                                                              |                                            |
| API-12 | DELETE | `/wardrobes/{wardrobeId}/templates/{templateId}` | テンプレ削除（論理）  | —                                                            | —                                                              | 内部で `status=DELETED`                               |
| API-13 | GET    | `/wardrobes/{wardrobeId}/histories`              | 履歴一覧（日付順）   | `from`(yyyymmdd), `to`(yyyymmdd), `order`, `limit`, `cursor` | `items[]`, `nextCursor`                                        | 並びは `date` / レスポンス詳細は以下                                   |
| API-14 | POST   | `/wardrobes/{wardrobeId}/histories`              | 履歴作成（今日着た）  | `date`, `templateId?`, `clothingIds?[]`                  | —                                                              |                                |
| API-15 | GET    | `/wardrobes/{wardrobeId}/histories/{historyId}`  | 履歴詳細取得      | —                                                            | `date`, `templateName?`, `clothingItems[]`                     |     |
| API-16 | DELETE | `/wardrobes/{wardrobeId}/histories/{historyId}`  | 履歴削除（物理）    | —                                                            | —                                                              |                                           |
| API-17 | POST   | `/wardrobes/{wardrobeId}/images/presign` | 画像アップロード用の署名付きURL発行 | `contentType`, `category`, `extension?` | `imageKey`, `uploadUrl`, `expiresAt`, `method` | クライアントがS3へ直接PUTするためのURL |


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
| limit  | number  | 取得件数 / 上限50件          |
| cursor | string? | ページング時の開始位置(ResponseのnextCursorを渡す)          |

※本APIの cursor は、当該APIにおける並び順および取得条件を前提としたページング位置を示す。
並び順または取得条件を変更した場合、cursor は使用できない。

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
| imageKey   | string? | 画像キー           |

```json
{
  "items": [
    {
      "clothingId": "cl_01HZZAAA",
      "name": "黒Tシャツ",
      "imageKey": "clothing/black_t.png"
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
| imageKey | string? | 画像キー |

```json
{
  "name": "白シャツ",
  "imageKey": "clothing/white_shirt.png"
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
| name       | string  | 服名                   |
| imageKey   | string? | 画像キー                 |
| status     | string  | `ACTIVE` / `DELETED`　※削除済みでも取得可能 |
| wearCount  | number  | 着用回数                 |
| lastWornAt | number  | 最終着用日時（未着用は 0）       |

```json
{
  "name": "黒Tシャツ",
  "imageKey": "clothing/black_t.png",
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
| imageKey | string? | 画像キー |

```json
{
  "name": "黒Tシャツ（夏用）"
}
```

## Error
| HTTP | error.code             | 発生条件                   |
| ---: | ---------------------- | ---------------------- |
|  400 | VALIDATION_ERROR       | `name` / `imageKey` 不正 |
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
| clothingItems | [] | 構成服（順序付き・最大4件）   |

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

```json
{
  "name": "仕事用",
  "clothingIds": ["cl_01", "cl_02"]
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
| status        | string         | `ACTIVE` / `DELETED`　※服削除済みでも取得可能 |
| wearCount     | number         | 着用回数                 |
| lastWornAt    | number         | 最終着用                 |
| clothingItems | [] | 構成服（順序付き）            |

### clothingItems[]
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| clothingId | string  | 服ID            |
| name       | string  | 服名             |
| imageKey   | string? | 画像キー           |
| status     | string  | `ACTIVE` / `DELETED`　※服削除済みでも取得可能 |
| wearCount  | number  | 着用回数           |
| lastWornAt | number  | 最終着用日時（未着用は 0） |

```json
{
  "name": "普段着",
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

```json
{
  "name": "普段着（夏）",
  "clothingIds": ["cl_01", "cl_03"]
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
| clothingItems | [] | 着用服（順序付き・最大4件）                     |

### clothingItems[]
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| clothingId | string  | 服ID            |
| name       | string  | 服名             |
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
| clothingItems | [] | 着用服（順序付き）     |

### clothingItems[]
| フィールド      | 型       | 説明             |
| ---------- | ------- | -------------- |
| clothingId | string  | 服ID            |
| name       | string  | 服名             |
| imageKey   | string? | 画像キー           |
| status     | string  | `ACTIVE` / `DELETED` |
| wearCount  | number  | 着用回数           |
| lastWornAt | number  | 最終着用日時（未着用は 0） |

```json
{
  "date": "20260101",
  "templateName": "普段着",
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

