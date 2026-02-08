# DynamoDB テーブル設計資料

## 1. 目的

個人の服（Clothing）を管理し、服の組み合わせをテンプレート（Template）として保存・再利用し、日々の着用履歴（History）を記録する。
一覧画面（服・テンプレート・履歴）を高速に表示し、複数の並び替え条件に対応する。論理削除・復元、削除済み表示、サムネイル表示（no image／削除済みオーバーレイ／+x）を安全に実現する。

---

## 2. 設計方針

### 2.1 単一テーブル設計

* DynamoDB の **単一テーブル設計**を採用する
* 複数エンティティをPK/SKの値プレフィックスで区別する

### 2.2 主キー

* テーブル主キーは **(PK, SK)**
* **(PK, SK) の組み合わせはテーブル内で一意**
* PK/SK は変更不可

### 2.3 一覧取得と参照補完

* 服・テンプレの一覧は **GSI + Query**（並び替えはGSIを統一利用）
* テンプレ／履歴のサムネ表示は `clothingIds` を元に **BatchGet** で服情報（imageKey/status）を取得し、N+1を避ける
    * **BatchGetの上限は80**とする。(実装上の分割単位)

### 2.4 論理削除

* 論理削除は `status`（ACTIVE / DELETED）と `deletedAt`（Unix ms）で表現
* 一覧は ACTIVE のみを取得する
* 削除済み一覧も必要な場合は DELETED 側のキーをQueryする

### 2.5 降順

* 降順は Query の **`ScanIndexForward=false`** を使用

### 2.6 サムネイル仕様（DB側）

* テンプレ／履歴は **含まれる服すべての clothingId を順序付き配列で保持**（`clothingIds`）
    * ただし**上限は20件**とする
* サムネ枚数は **API側定数**（DBに保持しない）
* `+x` は `clothingIds.length - THUMB_N` をAPIで算出
    * **THUMB_Nは4(固定)**

---

## 3. ID設計（生成方法）

* **IDはサーバーでUUIDv7を生成**する
* 対象：`wardrobeId`, `clothingId`, `templateId`, `historyId`

---

## 4. テーブル定義

### 4.1 テーブル名

* `WardrobeTable`

### 4.2 主キー属性

| 種別 | 属性名  | 型               |
| -- | ---- | --------------- |
| PK | `PK` | String          |
| SK | `SK` | String  |

---

## 5. エンティティとキー設計（ベーステーブル）

| エンティティ | PK                     | SK                   | 値の例                           |
| ------ | ---------------------- | -------------------- | ----------------------------- |
| ワードローブ | `W#<wardrobeId>`       | `META`               | `W#wd_01HZZ... / META`        |
| 服      | `W#<wardrobeId>#CLOTH` | `CLOTH#<clothingId>` | `W#wd...#CLOTH / CLOTH#cl...` |
| テンプレート | `W#<wardrobeId>#TPL`   | `TPL#<templateId>`   | `W#wd...#TPL / TPL#tp...`     |
| 履歴     | `W#<wardrobeId>#HIST`  | `HIST#<historyId>`   | `W#wd...#HIST / HIST#hs...`   |
| 服 日付別カウンタ    | `W#<wardrobeId>#COUNT#CLOTH#<clothingId>` | `DATE#<yyyymmdd>` | `W#wd...#COUNT#CLOTH#cl... / DATE#20260102` |
| テンプレ 日付別カウンタ | `W#<wardrobeId>#COUNT#TPL#<templateId>` | `DATE#<yyyymmdd>` | `W#wd...#COUNT#TPL#tp... / DATE#20260102` |


---

## 6. 属性定義

### 6.1 ワードローブ（Wardrobe）

| 属性         | 型      | 説明            |
| ---------- | ------ | ------------- |
| wardrobeId | String | ワードローブID      |
| name       | String | ワードローブ名       |
| createdAt  | Number | 作成日時（Unix ms） |

---

### 6.2 服（Clothing）

| 属性             | 型             | 説明                   |
| -------------- | ------------- | -------------------- |
| clothingId     | String        | 服ID                  |
| name           | String        | 服名 / 上限40字                 |
| status         | String        | ACTIVE / DELETED     |
| imageKey       | String        | 画像キー（任意）             |
| wearCount      | Number        | 着用回数                 |
| lastWornAt     | Number        | 最終着用（未着用は0）          |
| createdAt      | Number        | 登録日時                 |
| deletedAt      | Number / null | 削除日時                 |

#### インデックス用属性

* `W#<wardrobeId>#<type>#<status>`
    * 例 `W#wd_01HZZ...#CLOTH#ACTIVE`
* `CREATED#<createdAt>#<clothingId/templateId>`
    * 例 `CREATED#1735690000123#cl_01HZZ...`
* `WEAR#<wearCount>#<clothingId/templateId>`
    * 例 `WEAR#0000000012#cl_01HZZ...`
* `LASTWORN#<lastWornAt>#<clothingId/templateId>`
    * 例 `LASTWORN#1735690000123#cl_01HZZ...`

> `createdAt` / `lastWornAt` は Unix ms（13桁）を前提。
> `wearCount` は桁が増えると文字列ソートで崩れるため、**ソートキーに使う場合は固定桁（ゼロ埋め）**。
> 実体は `0000000123` のように格納する運用。

---

### 6.3 テンプレ（Template）

| 属性           | 型             | 説明                          |
| ------------ | ------------- | --------------------------- |
| templateId   | String        | テンプレID                      |
| name         | String        | テンプレ名 / 上限40字                      |
| status       | String        | ACTIVE / DELETED            |
| clothingIds  | String[]      | 構成服ID（順序付き・全件） / 上限20件              |
| wearCount    | Number        | 着用回数                        |
| lastWornAt   | Number        | 最終着用（未着用は0）                 |
| createdAt    | Number        | 登録日時                        |
| deletedAt    | Number / null | 削除日時                        |

#### インデックス用属性

* `W#<wardrobeId>#<type>#<status>`
    * 例 `W#wd_01HZZ...#TPL#ACTIVE`
* `CREATED#<createdAt>#<clothingId/templateId>`
    * 例 `CREATED#1735690000123#tp_01HZZ...`
* `WEAR#<wearCount>#<clothingId/templateId>`
    * 例 `WEAR#0000000012#tp_01HZZ...`
* `LASTWORN#<lastWornAt>#<clothingId/templateId>`
    * 例 `LASTWORN#1735690000123#tp_01HZZ...`

---

### 6.4 履歴（History）

| 属性          | 型             | 説明             |
| ----------- | ------------- | -------------- |
| historyId   | String        | 履歴ID           |
| createdAt   | Number        | 記録日時           |
| date        | String        | yyyymmdd       |
| templateId  | String / null | 使用テンプレ         |
| clothingIds | String[]      | 着用服ID（順序付き・全件）/ 上限20件 |

#### インデックス用属性
* `DATE#<date>#<historyId>` 
    * 例 `DATE#20260101#hs_01HZZ...`

---

### 6.5 服 日付別カウンタ（ClothingWearDaily）

| 属性         | 型      | 説明                           |
| ---------- | ------ | ---------------------------- |
| date       | String | `yyyymmdd` |
| count      | Number | その日に着た回数（通常1。稀に複数）           |

---

### 6.6 テンプレ 日付別カウンタ（TemplateWearDaily）

| 属性         | 型      | 説明                           |
| ---------- | ------ | ---------------------------- |
| date       | String | `yyyymmdd` |
| count      | Number | その日に着た回数（通常1。稀に複数）           |

---

## 7. GSI 定義

| GSI名                         | PK             | SK                 | 用途    |
| ---------------------------- | -------------- | ------------------ | ----- |
| `StatusListByCreatedAt`  | `W#<wardrobeId>#<type>#<status>` | `CREATED#<createdAt>#<clothingId/templateId>`  | 登録順   |
| `StatusListByWearCount`  | `W#<wardrobeId>#<type>#<status>` | `WEAR#<wearCount>#<clothingId/templateId>`  | 着た回数順 |
| `StatusListByLastWornAt` | `W#<wardrobeId>#<type>#<status>` | `LASTWORN#<lastWornAt>#<clothingId/templateId>` | 最近着た順 |
| `HistoryByDate` | `W#<wardrobeId>#HIST` | `DATE#<date>#<historyId>` | 履歴一覧 |

* 降順が必要な並び（登録順の新しい順／着た回数の多い順／最近着た順）は `ScanIndexForward=false`

---

## 8. 論理削除仕様

| 状態   | status  | deletedAt |
| ---- | ------- | --------- |
| 未削除  | ACTIVE  | null      |
| 削除済み | DELETED | now(ms)   |

* ACTIVE一覧：`statusListPk=...#ACTIVE`
* DELETED一覧：`statusListPk=...#DELETED`
* 削除／復元時は `status` と `deletedAt` に加えて **`statusListPk` を更新**する（GSIの集合が変わるため）

---

## 9. サムネ取得フロー（テンプレ／履歴）

1. 一覧取得（テンプレはGSI、履歴はベースQuery）
2. `thumbIds = clothingIds.slice(0, THUMB_N)` を算出
    * THUMB_Nは4(固定)
3. 画面内の `thumbIds` を集約して BatchGet
    * BatchGetの上限は80とする(実装上の分割単位)
4. `thumbIds` の順で描画

   * imageKeyなし：`no image`
   * 服がDELETED：削除済みオーバーレイ
   * `+x`：UIで算出

---

## 10. アクセスパターン

| AP    | 画面/操作               | DynamoDB操作                               | 対象                                        | キー／条件（値の形式・例）                                                                                                                                                                                                                                                                                                                                                     | 備考                                        |
| ----- | ------------------- | ---------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| AP-01 | ワードローブ新規作成          | PutItem                                  | Wardrobe                                  | PK=`W#<wardrobeId>` / SK=`META`                                                                                                                                                                                                                                                                                                                                   |                                           |
| AP-02 | ワードローブを開く（URL）      | GetItem                                  | Wardrobe                                  | PK=`W#<wardrobeId>` / SK=`META`                                                                                                                                                                                                                                                                                                                                   | ヘッダー表示                                    |
| AP-03 | ホーム：直近1週間の履歴        | Query（GSI: HistoryByDate）                | History                                   | PK=`W#<wardrobeId>#HIST`、SK=`DATE#<from>..DATE#<to>`                                                                                                                                                                                                                                                                                                              |                                           |
| AP-04 | 服一覧（登録順／回数順／最近順）    | Query（GSI）                               | Clothing                                  | PK=`W#<wardrobeId>#CLOTH#ACTIVE`、SK=軸別                                                                                                                                                                                                                                                                                                                            | `wearCount` / `lastWornAt` を使用            |
| AP-05 | 服詳細表示               | GetItem                                  | Clothing                                  | PK=`W#<wardrobeId>#CLOTH` / SK=`CLOTH#<clothingId>`                                                                                                                                                                                                                                                                                                               |                                           |
| AP-06 | 服の追加                | PutItem                                  | Clothing                                  | PK=`W#<wardrobeId>#CLOTH` / SK=`CLOTH#<clothingId>`                                                                                                                                                                                                                                                                                                               | `status=ACTIVE`                           |
| AP-07 | 服の編集                | UpdateItem                               | Clothing                                  | PK=`W#<wardrobeId>#CLOTH` / SK=`CLOTH#<clothingId>`                                                                                                                                                                                                                                                                                                               | 並び替えに関わる属性更新時はGSI用SKも更新                   |
| AP-08 | 服の削除（論理）            | UpdateItem                               | Clothing                                  | PK=`W#<wardrobeId>#CLOTH` / SK=`CLOTH#<clothingId>`                                                                                                                                                                                                                                                                                                               | `ACTIVE → DELETED`（GSI PK切替）              |
| AP-09 | テンプレ一覧（登録順／回数順／最近順） | Query（GSI） + BatchGetItem                | Template / Clothing                       | Template: PK=`W#<wardrobeId>#TPL#ACTIVE`、SK=軸別 / Clothing: PK=`W#<wardrobeId>#CLOTH`、SK=`CLOTH#<clothingId>`（複数）                                                                                                                                                                                                                                                  | BatchGetItem：サムネ補間                        |
| AP-10 | テンプレ詳細表示            | GetItem                                  | Template                                  | PK=`W#<wardrobeId>#TPL` / SK=`TPL#<templateId>`                                                                                                                                                                                                                                                                                                                   |                                           |
| AP-11 | テンプレの追加             | PutItem                                  | Template                                  | PK=`W#<wardrobeId>#TPL` / SK=`TPL#<templateId>`                                                                                                                                                                                                                                                                                                                   | `status=ACTIVE`                           |
| AP-12 | テンプレの編集             | UpdateItem                               | Template                                  | PK=`W#<wardrobeId>#TPL` / SK=`TPL#<templateId>`                                                                                                                                                                                                                                                                                                                   | `clothingIds` 順序に注意                       |
| AP-13 | テンプレの削除（論理）         | UpdateItem                               | Template                                  | PK=`W#<wardrobeId>#TPL` / SK=`TPL#<templateId>`                                                                                                                                                                                                                                                                                                                   | `ACTIVE → DELETED`                        |
| AP-14 | 履歴一覧                | Query（GSI: HistoryByDate） + BatchGetItem | History / Clothing                        | History: PK=`W#<wardrobeId>#HIST`、SK=`DATE#<from>..` / Clothing: PK=`W#<wardrobeId>#CLOTH`、SK=`CLOTH#<clothingId>`（複数）                                                                                                                                                                                                                                            | ページング / BatchGetItem：サムネ補間                |
| AP-15 | 履歴詳細                | GetItem + BatchGetItem                   | History / Clothing                        | History: PK=`W#<wardrobeId>#HIST` / SK=`HIST#<historyId>` / Clothing: PK=`W#<wardrobeId>#CLOTH`、SK=`CLOTH#<clothingId>`（複数）                                                                                                                                                                                                                                       | BatchGetItem：構成服画像・ラベル                    |
| AP-16 | 履歴の追加（今日着た記録）       | TransactWriteItems                       | History / Clothing / Template / WearDaily | History: PK=`W#<wardrobeId>#HIST` / SK=`HIST#<historyId>`<br>Clothing: PK=`W#<wardrobeId>#CLOTH` / SK=`CLOTH#<clothingId>`（複数）<br>Template: PK=`W#<wardrobeId>#TPL` / SK=`TPL#<templateId>`<br>ClothingWearDaily: PK=`W#<wardrobeId>#COUNT#CLOTH#<clothingId>` / SK=`DATE#<yyyymmdd>`（複数）<br>TemplateWearDaily: PK=`W#<wardrobeId>#COUNT#TPL#<templateId>` / SK=`DATE#<yyyymmdd>` | 履歴作成＋日付別カウンタ加算＋`wearCount` 更新（同一トランザクション） |
| AP-17 | 履歴の削除（物理）           | GetItem → TransactWriteItems             | History / Clothing / Template / WearDaily | History: PK=`W#<wardrobeId>#HIST` / SK=`HIST#<historyId>`<br>Clothing / Template: 同上<br>ClothingWearDaily / TemplateWearDaily: 同上                                                                                                                                                                                                                                         | カウンタ減算（0未満防止）＋必要時 `lastWornAt` 再計算        |
                
---

### AP-16 履歴作成時の統計更新（整合更新）

* **対象**：History作成
* **更新（トランザクション）**

  1. History を Put
  2. （テンプレ入力なら）TemplateWearDaily の `count += 1`
  3. （テンプレ入力なら）Template の `wearCount += 1`, `lastWornAt = max(current, dateToEpochMs(yyyymmdd))`
  4. 対象服ごとに ClothingWearDaily の `count += 1`
  5. 対象服ごとに Clothing の `wearCount += 1`, `lastWornAt = max(current, dateToEpochMs(yyyymmdd))`

※ `lastWornAt` はキャッシュ扱い（正はWearDaily）

### AP-17 履歴削除時の統計更新（整合更新）

* **対象**：History削除
* **手順**

  1. History を Get（date / templateId / clothingIds を取得）
  2. **TransactWrite** で以下を実施

     * History を Delete
     * （テンプレ入力なら）TemplateWearDaily `count -= 1`
        * 0になったらitem削除
     * （テンプレ入力なら）Template `wearCount -= 1`（0未満防止）
     * 対象服ごとに ClothingWearDaily `count -= 1`（0未満防止）
        * 0になったらitem削除
     * 対象服ごとに Clothing `wearCount -= 1`（0未満防止）
     * `lastWornAt` 再計算

        * 削除した `date` が `lastWornAt` と一致する場合、WearDaily を **降順Query**して次点の日付を求め、`lastWornAt` を更新
        * 見つからなければ `lastWornAt = 0`
---

## ADR

### 1. 服 日付別カウンタ／テンプレ 日付別カウンタを導入した理由
将来の統計拡張および履歴削除時の整合性を考慮し、着用回数は履歴とは別に日付別カウンタとして保持する。
服／テンプレに保持する総回数や最新着用日はキャッシュと位置付け、正は日付別カウンタとすることで、安全かつ拡張性の高い設計とする。


#### 詳細：1. 将来の統計要件に耐えられるデータ構造にするため

本アプリでは、着用回数の総数だけでなく、将来的に以下のような統計を扱う可能性がある。

* 期間別の着用回数推移（週別／月別など）
* 最近着ていない服の抽出
* 一定期間内の着用傾向の可視化

これらは履歴データを都度集計する方式ではクエリコストや実装負荷が高くなるため、
**日付単位で集計されたカウンタを保持する設計**を採用した。


#### 詳細：2. 履歴削除時の整合性を担保しやすくするため

本アプリでは履歴の編集は行わず、削除のみをサポートする。

* 総着用回数（wearCount）は加算・減算で対応可能
* 一方、最新着用日（lastWornAt）は削除時に再計算が必要になる

日付別カウンタを保持しておくことで、

* 削除された日付が最新日だった場合でも
* 次に新しい着用日を **Query により確実に再算出できる**

ため、履歴削除時の整合性をシンプルに保つことができる。


#### 詳細：3. 集計ロジックを履歴から分離し、責務を明確にするため

履歴（History）は「事実の記録」、
日付別カウンタは「統計用の派生データ」として役割を分離する。

これにより、

* 履歴は削除・参照に専念できる
* 統計ロジックが履歴クエリに散らばらない
* 将来、統計仕様が変わっても履歴設計に影響を与えにくい

というメリットがある。


#### 詳細：4. wearCount / lastWornAt をキャッシュとして安全に扱うため

服／テンプレ自体に保持する `wearCount` や `lastWornAt` は、

* 一覧表示や並び替えを高速化するための **キャッシュ**
* 正（Source of Truth）は日付別カウンタ

という位置付けとする。

この構成により、

* 通常利用では常に即時参照できる
* 万一ズレが発生しても、日付別カウンタから再計算可能

な安全な設計とできる。


#### 詳細：5. DynamoDB 単一テーブル設計と相性が良いため

日付別カウンタは、

* PK：服／テンプレ単位
* SK：日付（`DATE#yyyymmdd`）

という形で Query が完結するため、GSI を追加せずに

* 期間取得
* 最新日取得

を実現できる。

そのため、
**単一テーブル設計の利点（アクセスパターンが明確・低コスト）を損なわずに統計要件を満たせる**。


