# 地域と天気とテンプレート推薦のAPI契約と状態管理

対象: [判断 Issue #276](https://github.com/Kurarowa305/wardrobe/issues/276)。2026-10-11着手。状態は**Q1〜Q11人間レビューで合意済み**。本書への記載は機能実装完了を意味しない。

合意の正本: [#276 解決コメント](https://github.com/Kurarowa305/wardrobe/issues/276#issuecomment-6107706587)。

地域設定、当日の天気、おすすめテンプレート、着用記録を、APIとWebが別々に実装できる契約へ分ける。Q1〜Q11の合意により、パス・DTO・保存・再送・更新処理の契約を確定した。

## 確定済みの入力条件

- 製品仕様は [#272の正本](https://github.com/Kurarowa305/wardrobe/issues/272#issuecomment-6049332495)。自動・春・夏・秋・冬の順、最大3件、手動モードの永続化なし。
- [#275](https://github.com/Kurarowa305/wardrobe/issues/275#issuecomment-6061288970): 全候補の強整合取得、構成服の最終着用日の最大値→作成日時→ID、自動retryなし、DB読取5秒、不完全な候補で成功を返さない。更新完了後に始まる取得へ更新を反映するが、取得中の全体スナップショットは保証しない。
- [#277](https://github.com/Kurarowa305/wardrobe/issues/277#issuecomment-6083283061): 記録日はJST今日を初期値に編集可能。未来日も許可。表示入力値と保存値を一致させ、天気・推薦対象日は当日のまま。地域は明示検索→選択→保存、保存前キャンセルは元を維持、失敗時は選択を保持。
- [#288](https://github.com/Kurarowa305/wardrobe/issues/288#issuecomment-6100352125): 丸め前の日最高体感温度15/25°C境界で独自指数1/2/3。体感温度のみ利用不可なら有効な最高実気温でfallback。自動の春秋は春OR秋。内部季節を画面表示しない。
- [#274](https://github.com/Kurarowa305/wardrobe/issues/274#issuecomment-6107414199): Open-Meteo Best Match、日次4項目、JST当日、ABR版固定辞書。同地域・同座標・同日の成功天気を翌00:00まで共有再利用する。外部取得4秒・retryなし・失敗後5分抑止・429 provider gate・共有利用量制限を維持する。

用語は既存の `GLOSSARY.md` に合わせる。「記録日」は服を着た日。「天気・推薦の対象日」はJST当日であり、記録日入力を変更しても変わらない。「同じ保存操作の再送」と「同じ日の別の着用記録」を区別する。

## 既存実装との差分

| 現状 | 契約で解消する点 |
| --- | --- |
| `GET /wardrobes/:wardrobeId` は `{name}` を返す。METAに地域属性はない | 既存データを未設定として扱い、地域取得・変更の契約を追加 |
| `POST /wardrobes/:wardrobeId/histories` は `{date, templateId}` または `{date, clothingIds}`。日付は `yyyymmdd` | 既存経路を利用しながら、ホームの確認・再送契約を追加 |
| テンプレート経由の記録は保存時に構成服を読み直す | 確認画面と保存対象が食い違わない条件を決める |
| 履歴IDは毎回サーバー生成。履歴と統計は同一トランザクション | 結果不明の再送で履歴・統計を二重更新しない仕組みが必要 |
| APIの履歴作成は201と `{historyId}`、Web側戻り型は `void` | 成功応答のIDをWebで利用する差分が必要 |
| 履歴更新成功後はhistory・clothing・templateのwardrobeスコープを無効化 | 新しい推薦を全モードで無効化する契約へ接続 |
| 既存の服推薦は `/recommendations/clothing` | ホームの新しいテンプレート推薦と分離し、互換性を判断 |

参照: `apps/api/src/domains/history/schema/historySchema.ts`、`usecases/createHistoryWithStatsWrite.ts`、`handlers/createHistoryHandler.ts`、`apps/web/src/api/endpoints/history.ts`、`apps/web/src/api/hooks/history.ts`、`apps/web/src/api/queryKeys.ts`。

### トランザクションと共有保存の実装制約

- 履歴作成は既にテンプレート本体への統計Updateを含む。確認版の条件はそのUpdateへ組み込み、同じアイテムへの別ConditionCheckを追加する設計にしない（`apps/api/src/domains/history/stats_write/transact/buildItems.ts:110`）。
- 独自の25項目制限があり、操作キーの条件付きPutも項目数に含まれる。20服対応の#283は、重複抑止を含めたトランザクション数で検証する（`stats_write/transact/guard.ts:3`）。
- 履歴handlerは現在、TransactionCanceledExceptionを一括404に変換する。確認版不一致・操作キー競合・一時失敗を区別する差分が必要（`handlers/createHistoryHandler.ts:39`）。
- テンプレートにrevision属性はまだない。作成・編集・削除と既存データの初期版を定義し、統計だけの更新と区別する。通常編集による古い統計値の書戻しは#278とも整合させる。
- 既存テーブルは共有PK/SKの単一テーブルで、条件付き更新・transactionを利用できる。TTL設定はまだない。新しい天気domainのLambdaを追加する場合、ルーティング・IAM・TTLを含めたインフラ差分が必要（`infra/terraform/app/dynamodb.tf`、`lambda.tf`、`iam.tf`）。
- API GatewayのCORSは既にPUTと任意headerを許可するが、Web共通API clientはPUT未対応。#279でPUTメソッドとendpointを追加する（`apps/web/src/api/client.ts`）。

## 第1ラウンドの合意

2026-10-11、ユーザー回答「2 常に自動モードをデフォルトとし、手動モードの維持は一切不要。他は推奨」に基づく。

### Q1 天気と推薦の取得を分ける

合意: 地域・天気・推薦を別のAPIにし、天気と推薦は同じ共有天気キャッシュを参照する。手動推薦は外部天気取得を待たない。天気失敗でも手動推薦を利用でき、推薦のDB失敗でも天気を表示できる。

確定したパスは以下。具体的DTOはQ6〜Q9を参照する。

| 用途 | API |
| --- | --- |
| 地域検索 | `GET /regions?q=新宿` |
| 地域取得 | `GET /wardrobes/:wardrobeId/region` |
| 地域保存・解除 | `PUT /wardrobes/:wardrobeId/region`、bodyのregionIdがnullなら解除 |
| 当日天気 | `GET /wardrobes/:wardrobeId/weather?date=2026-10-11&regionRevision=2` |
| 当日推薦 | `GET /wardrobes/:wardrobeId/recommendations/templates?mode=auto&date=2026-10-11&regionRevision=2` |

自動推薦が共有キャッシュへアクセスした後に天気APIを呼ぶ場合も、成功キャッシュが有効なら外部通信しない。同時アクセス時の外部通信もサーバー全体で抑止する。

### Q2 画面往復と地域変更時のモード

合意: 常に自動をデフォルトとし、手動モードを保存・復元しない。アプリ単位・ワードローブ別の手動モード保持案は撤回する。

確定: 手動選択は表示中のホームの操作状態だけに持つ。ホーム再入場、ワードローブ切替、地域保存・解除成功、バックグラウンド復帰、再読込、PWA新規起動、JST日付変更で自動にする。記録成功後のホーム更新も自動とする。通常のReact再描画や取得完了で選択を消し、手動モードを操作不能にはしない。確認ダイアログの開閉と地域検索のキャンセルはホーム再入場と扱わない。地域保存失敗も変更成功ではない。

### Q3 確認中の日付跨ぎ

合意: 23:59に確認画面を開き、00:00を跨いでも、表示している記録日をそのまま保持して保存する。背景の天気・推薦は新しい当日へ切り替え、モードを自動へ戻す。送信時に記録日を黙って今日へ置換しない。新しく開いた確認画面の初期値は新しい今日とする。

### Q4 確認後にテンプレートの構成が変わる場合

合意: 確認したテンプレートの内容を表す版を送信し、保存時に変更・削除を検出したら409で止める。最新内容を表示し、日付入力を残して再確認してもらう。統計の更新だけで確認版を変えない。記録と条件検査を同一トランザクションに含め、保存直前の変更も検出する。

### Q5 保存結果不明時の再送

合意: 保存操作ごとに一意のキーを生成し、同じキー・同じ内容の再送には元の履歴IDを返す。キーの記録と履歴・統計を原子的に保存する。送信中の連打を止め、結果不明時にはユーザーの明示操作で同じ内容を再送する。自動再送は行わない。同日でも、新しく確認して記録する操作は新しいキーなので複数記録できる。

キーの保持期間、再読込を跨ぐ未確定操作の復元、同じキーで異なる内容を送った場合の409、履歴削除後の再送はQ6で確定した。保存済み記録を削除した後に同じキーで再作成しないことを設計条件とする。

## 第2ラウンドで確定した契約

2026-10-11、ユーザー回答「全部推奨」によりQ6〜Q11の推奨案を採用。具体例の値は説明用であり、本番の辞書版・座標は固定辞書から生成する。

### Q6 再送キーの保持と未確定操作の復元

合意: サーバーの操作記録はワードローブが存在する限り保持し、TTLを付けない。短期間で消すと、その後の再送で二重記録できてしまうため。ブラウザには結果未確定の操作だけをlocalStorageへ保存し、再読込・PWA再起動後も同じキー・内容で再送できるようにする。モードの保存とは別であり、モードは一切保存しない。

ホーム記録は既存のPOSTへ任意の拡張を加える。ホームではキーと確認版を必須とし、旧クライアントからの従来bodyは引き続き受け付ける。

```http
POST /wardrobes/wd_example/histories
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{"date":"20261011","templateId":"tp_example","expectedTemplateRevision":3}
```

- キーはクライアント生成UUID。大小文字を正規化し、ワードローブ内で一意とする。同日・同templateでも別の保存操作なら新しいキー。
- `expectedTemplateRevision` は0以上の整数で、templateId指定時だけ利用可能。確認版付きリクエストにはキーも要求する。
- 初回成功は201 `{ "historyId": "hs_example" }`、同じキー・同じ内容の成功再送は200で同じbody。キー一致の操作記録を先に確認し、その後にテンプレートの現状を検証する。保存成功後のテンプレート編集が成功再送を妨げない。
- 同じキーで異なる内容は409 `IDEMPOTENCY_KEY_REUSED`。正規化した入力を保存して照合し、date・templateId・確認版またはclothingIdsを含める。
- 操作記録を条件付きPutし、履歴・統計と同じtransactionに含める。競合時は操作記録を強整合で確認し、一致する成功記録なら同じIDを返す。書込の自動再試行はしない。
- 成功した履歴を削除しても操作記録を残す。削除transactionで操作記録を削除済みにし、同キーの再送は409 `HISTORY_ALREADY_DELETED`。履歴を復活させない。
- timeout・ネットワーク切断・不確かな5xxでは入力を編集せず「結果を確認・再送」を提示。同じキーとbodyを送る。未確定操作の解決前にそれを別キーへ置換しない。
- 既知の未保存エラーなら日付を維持して編集可能とする。確認版変更後の再確認は新しい操作として新しいキーを発行する。
- 未確定操作のブラウザ保存ができなければ、その操作の送信を始めず案内する。完了後はブラウザから除去。端末間の未確定操作同期は追加しない。

保存先は `PK=W#<wardrobeId>#HISTORY_OP, SK=<operationId>`。正規化入力、historyId、createdAt、deletedAtを保持する。履歴本体にもoperationIdを任意属性で保存する。従来の履歴には属性がないままでよい。

### Q7 地域の保存と同時変更

合意: 地域は既存METAに保存し、URLを知る人が編集できる既存モデルを維持する。同時に変更された場合は、最後の書込で黙って上書きせず409で最新地域を確認してもらう。

```http
GET /regions?q=新宿
```

```json
{"datasetVersion":"<固定辞書manifestの版>","items":[{"regionId":"abr:lg:131041","label":"東京都 新宿区"}],"hasMore":false}
```

検索はNFKC・かな統一後、完全一致→前方一致→部分一致、同点はコード昇順。最大10件。空・64文字超はAPIでは400、Webでは送信せず入力状態を表示。重複queryパラメータは400。検索は明示操作のみで、検索世代が古い応答を候補に採用しない。

qは必須。trim・NFKC後のUnicodeコードポイント数で長さを検査する。検索APIはq以外のqueryを受け付けない。保存・記録bodyの未知属性、JSON以外のContent-Type、整数フィールドへの文字列・小数・負数を受け付けない。GETの整数queryのみ10進文字列を厳密に整数へ変換する。revisionは安全な整数の範囲に制限する。

```http
PUT /wardrobes/wd_example/region
Content-Type: application/json

{"regionId":"abr:lg:131041","datasetVersion":"<固定辞書manifestの版>","expectedRevision":0}
```

成功200と地域取得GETの共通bodyは `{ "revision": 1, "region": { "regionId": "abr:lg:131041", "label": "東京都 新宿区", "datasetVersion": "<固定辞書manifestの版>" } }`。未設定は `{ "revision": 0, "region": null }`。解除bodyは `{ "regionId": null, "expectedRevision": 1 }` とし、datasetVersionは指定しない。解除成功後もrevisionは増加し、0へ戻さない。

サーバーで辞書再解決し、未知コードは400 `UNKNOWN_REGION`、辞書版違いは409 `REGION_DATASET_CHANGED`、保存版競合は409 `REGION_CHANGED`。コードは `abr:lg:` と6桁数字の文字列。表示名・座標の申告を受け付けない。成功responseを失ったPUTを同じexpectedRevisionで再送しても、再書込せず409→GETで現状を確認する。

METAにはregionRevisionと、regionのsource・lgCode・行政階層・表示名・原座標・sourceSrid・coordinatePolicy・datasetVersion・timezoneを保存する。既存METAの属性欠損はregionRevision=0、region=null。更新はMETA存在条件とrevision一致条件を付け、名前・作成日時を保持する。初回の属性欠損をrevision=0として条件検査する。

### Q8 日付と地域が古い取得要求

合意: 天気・推薦のdateは厳密なISO日付、regionRevisionは0以上の整数として必須にする。入口時点のJST今日と不一致なら409 `TARGET_DATE_CHANGED` と現在のtargetDateを返す。保存地域の版が変わっていれば409 `REGION_CHANGED`。Webはコンテキストを更新し、新しい要求を開始する。旧要求を同じ条件で自動再試行しない。

サーバーは応答前にも対象日と地域版を確認し、変化していれば旧結果を成功として返さない。WebもレスポンスのwardrobeId・regionRevision・targetDateと現在の要求世代を照合する。応答直後に地域が変わる競合もあるため、サーバー検査だけに依存しない。別端末の変更のpush通知は追加せず、再入場・復帰・明示更新で地域を読み直す。

推薦のmodeは `auto|spring|summer|autumn|winter`。欠損はauto、未知値・複数指定・未知queryは400。推薦件数は最大3で固定し、limit・cursorを受け付けない。

### Q9 DTOと欠損と画面状態

合意: 設定・予報・候補の不足は正常な状態を表す200、DB等の処理失敗は既存のエラー形式で区別する。外部天気の失敗は天気DTOのunavailableとし、手動推薦の成功を妨げない。

天気DTO共通項目は `wardrobeId, regionRevision, targetDate, status`。status別の項目は以下で固定する。

| status | 項目と意味 |
| --- | --- |
| `region_required` | region=null。天気を取得しない |
| `available` | provider=`open-meteo`、modelPolicy=`best_match`、timezone=`Asia/Tokyo`、temperatureUnit=`celsius`、fetchedAt・expiresAt（UTC ISO日時）、delivery=`fresh|cache`、下記daily・derivation |
| `unavailable` | reason=`fetch_failed|forecast_missing|invalid_response|cooldown|rate_limited|budget_exhausted|fetch_in_progress`、retryAfter（UTC ISO日時またはnull）。推測温度を返さない |

availableのdailyは `apparentTemperatureMax, temperatureMax, temperatureMin, weatherCode` の4キー。各キーは検証済み数値またはnull。気温は有限数、weatherCodeは#274の既知WMO整数だけを許す。単位・日付・配列の検査は#274/#288を維持する。構造は正常で個別項目のみ欠損ならavailableとし、日付対応破損はunavailable。表示では気温nullを「—」、天気コードnullを「天気不明」にする。気温表示は小数第1位まで四捨五入し、指数判定には丸め前を使う。

derivationは `source=apparent_temperature|temperature_max_fallback|unavailable` と `dressingIndex=1|2|3|null`。fallback時には独自指数を生成せずnullとし、最高実気温での判定と区別する。自動判定の季節名はDTOに含めない。指数が欠損でも最高実気温が有効なら自動推薦できる。

```json
{"wardrobeId":"wd_example","regionRevision":1,"targetDate":"2026-10-11","status":"available","provider":"open-meteo","modelPolicy":"best_match","timezone":"Asia/Tokyo","temperatureUnit":"celsius","fetchedAt":"2026-10-11T01:00:00Z","expiresAt":"2026-10-11T15:00:00Z","delivery":"cache","daily":{"apparentTemperatureMax":20,"temperatureMax":22,"temperatureMin":15,"weatherCode":3},"derivation":{"source":"apparent_temperature","dressingIndex":2}}
```

推薦DTOは `wardrobeId, regionRevision, targetDate, mode, status, basis, items`。basisは `manual|apparent_temperature|temperature_max_fallback|none`。季節名や内部ランキング値を返さない。

| status | itemsと画面 |
| --- | --- |
| `region_required` | autoかつ地域未設定。items=[]、地域設定へ案内 |
| `weather_required` | autoで季節判定に必要な当日情報がない。items=[]、手動選択へ案内。reasonとretryAfterを天気DTOと同じ意味で追加 |
| `empty` | 判定できたが候補0件。items=[]、「おすすめできるテンプレートがありません」 |
| `ready` | itemsは1〜3件。不足分を別季節で埋めない |

region_requiredとweather_requiredのbasisはnone。ready/emptyのbasisは手動ならmanual、自動なら採用した気象値の由来。available天気でも体感・最高実気温が両方欠損ならweather_required、reason=forecast_missing、retryAfter=nullとする。当日成功応答の個別欠損を埋めるために再取得しない。以下は地域未設定でも成功する手動推薦と、設定不足・候補0件を区別する例。

```json
{"wardrobeId":"wd_example","regionRevision":0,"targetDate":"2026-10-11","mode":"summer","status":"ready","basis":"manual","items":[{"templateId":"tp_example","name":"夏の組合せ","tagIds":["season:summer"],"revision":3,"clothingItems":[{"clothingId":"cl_example","imageKey":null,"status":"ACTIVE"}]}]}
```

```json
{"wardrobeId":"wd_example","regionRevision":0,"targetDate":"2026-10-11","mode":"auto","status":"region_required","basis":"none","items":[]}
```

```json
{"wardrobeId":"wd_example","regionRevision":1,"targetDate":"2026-10-11","mode":"winter","status":"empty","basis":"manual","items":[]}
```

itemsは既存TemplateListItemと同じ `templateId, name, tagIds, clothingItems` に整数の `revision` を追加し、clothingItemsには全構成服を含める。Webは最大4画像＋残数で表示する。テンプレート詳細GETにもrevisionを追加し、確認時は推薦カードの取得時revisionを使用する。既存テンプレートのrevision欠損は0、新規作成は1、名前・構成服・タグの内容変更と削除で増加、統計更新では維持。更新/削除の条件付き書込でもrevisionを検査し、同時編集による版・ACTIVE状態の巻戻しを防ぐ。

削除された構成服・テンプレートは確認記録で409 `CONFIRMATION_STALE`。各服のACTIVE条件とテンプレートのACTIVE・revision条件を既存の統計Updateへ組み込む。履歴削除へ同じ条件を一律適用しない。未知wardrobeは404、入力不正は400、推薦の不完全読取・DB期限切れ・未処理キーは503 `SERVICE_UNAVAILABLE`。`details.reason` に機械判定用理由を入れ、既存 `error.code` を増やさない。

```json
{"error":{"code":"CONFLICT","message":"Confirmation is out of date.","details":{"reason":"CONFIRMATION_STALE"}}}
```

### Q10 共有保存と期限と更新処理

合意: 既存DynamoDBに共有天気キャッシュ・取得lease・provider gate・利用量を置く。プロセスのメモリだけで共有済みと扱わない。天気/推薦API全体は入口から10秒、外部取得と同キー取得の待機は合計4秒、DB読取は合計5秒、残り1秒を検証・応答等に割り当てる。残時間を下位処理へ渡し、期限切れでもバックグラウンドで外部送信や推薦読取を続けない。

外部取得が必要なautoは天気を解決してから対象候補を読む。手動は天気を待たない。DB上の処理が遅い場合は、個別の最大予算を使い切る前でも入口からの残時間で中断する。失敗をemptyへ変換しない。

| 保存対象 | キーと扱い |
| --- | --- |
| 成功天気・失敗抑止・lease | PK=`WEATHER#<forecastKey>`、SK=`STATE`。forecastKeyは#274の地域ID・保存座標・JST日・モデル等を含む。expiresAt、cooldownUntil、leaseOwner、leaseUntilを分離。leaseは入口から10秒以内で失効し、成功保存はowner一致かつlease有効条件を要求 |
| provider gate・利用量 | PK=`PROVIDER#OPEN_METEO`、SK=`USAGE`。単一の共有状態を強整合取得し、revision一致の条件付き更新で送信枠を予約。競合・読取失敗・予約失敗なら送信しない |
| 操作記録 | Q6のキー。天気TTLとは独立し、期限を付けない |

利用量は直近の秒61・分61・時25・日32バケットの件数とUTC暦日/月件数を共有状態に保持する。移動窓の端に重なる古いバケットも全件加算するため過小計数せず、境界付近で少し早く停止する場合がある。60/分・600/時・5,000/日・150,000/月について移動窓と暦窓の両方を満たす予約だけ通す。予約時刻を送信開始直前に取り、ゲート確認と予約を同じ条件付き更新で行う。送信しなかった予約も戻さず、失敗・timeoutを含む全試行を数える。80%を記録、100%で停止する。

同キーは1つのownerだけが外部取得する。他要求は残時間内で共有結果の完成を確認する。これは外部呼出や失敗したDB要求の再試行ではなく、進行中の取得結果の待機である。待機期限まで完成しなければfetch_in_progress。lease切れの古いownerは保存できない。新旧の取得が重ならないよう外部4秒期限をlease期限より短くする。

lease取得直後と外部送信直前に残時間を確認し、外部4秒と成功保存の余裕がlease期限内に収まらなければ送信しない。成功・失敗の反映とlease解放はowner一致条件で行う。期限切れownerが後続ownerの結果やcooldownを上書きしない。usageの条件付き更新は、provider gateの期限を短縮したり、他要求の予約件数を巻き戻したりしない。

失敗はキーごと5分抑止。429はprovider全体を `max(5分, 有効なRetry-After)` まで止める。成功キャッシュは当日中そのまま利用し、定期取得・3時間更新は追加しない。TTLの物理削除とは別に論理期限を検査する。共有状態の障害時も有効な当日データが読めれば表示し、それ以外では外部送信を止める。

query key:

```ts
['regions', datasetVersion, normalizedSearch]
['wardrobe', wardrobeId, 'region']
['weather', wardrobeId, regionRevision, targetDate]
['template', wardrobeId, 'recommendation', mode, regionRevision, targetDate]
```

推薦は `['template', wardrobeId, 'recommendation']` のprefixで全モードを無効化する。天気は推薦キャッシュと別で、記録・テンプレート編集だけでは無効化しない。天気のWeb staleTimeは当日期限まで、今回追加する地域・天気・推薦queryのretryは0。既存QueryClientのretry=1を明示的に上書きする。自動のfocus/reconnect/interval再取得は止め、以下のイベントから更新処理を制御する。

| イベント | 処理 |
| --- | --- |
| ホーム入場・再読込・PWA起動・復帰 | autoに設定。地域を読直し、当日の有効天気を再利用。表示中推薦は改めて取得 |
| 手動モード選択 | 選択したmodeの推薦を取得。選択前の応答を現在表示へ採用しない。過去の同mode結果も取得中の確定結果として表示しない |
| 地域保存・解除成功 | autoへ戻し、地域responseを反映。旧コンテキストを破棄し、新しいregionRevisionで天気・推薦を取得 |
| JST日付変更 | autoへ戻し、旧日のqueryを表示対象から除外。新しい対象日で取得。確認中の記録日は保持 |
| 記録成功 | 確認を閉じて成功通知。autoへ戻す。history・clothing・templateと全推薦を無効化し、ホーム推薦を取得 |
| 履歴削除・template作成/編集/削除・構成服更新/削除成功 | 同wardrobeの全推薦を無効化。表示中なら再取得。更新前の応答を採用しない |
| 推薦だけ再取得失敗 | 記録成功を取り消さず、「記録しました。おすすめの更新に失敗しました」と分離 |

無効化前に要求世代を増やし、進行中queryをcancelする。API clientにAbortSignalを渡すだけでなく、完了時も世代を検査する。モード変更・地域変更・日付変更では旧コンテキストをplaceholderとして表示しない。JST翌00:00タイマーに加え、復帰・送信前・応答時にJST日付を確認し、タイマー停止中の跨日も検出する。手動での再取得操作はその時点の選択に対する新しい要求であり、自動retryを追加するものではない。

### Q11 既存APIの互換性と後続実装

合意: 服推薦APIと既存履歴作成bodyは当面維持する。ホームは新しいテンプレート推薦だけを呼び、旧APIの廃止は別Issueで判断する。ホームの安全な記録契約を先行し、従来の記録経路への操作キー導入は後続の実装範囲として明記する。

履歴のdateは引き続きyyyymmdd、天気dateはISO日付とする。履歴も実在日を検証し、過去・未来の制限は設けない。既存のUTCベースの日付初期化をJSTへ揃える。API/Webの日付変換で表示値を変えない。

| 後続 | 契約から必要になる成果物 |
| --- | --- |
| #279 | 地域検索・保存・revision、META拡張、既存未設定・同時変更、辞書固定版 |
| #280 | 天気DTO、共有cache/lease/gate/counter、4秒・10秒期限、TTLとIAM、欠損・指数/fallback |
| #281 | テンプレート推薦とDTO、5秒の全候補取得、手動天気非依存、mode入力検証 |
| #282 | query key、auto初期化、復帰・跨日・地域変更、全経路無効化、古い応答拒否 |
| #283 | 確認版・操作キー・結果不明復元、履歴transaction、20服と追加操作記録、成功/再取得失敗の分離 |
| #278（完了済み） | 統計修正の既存成果を前提に、#283で確認版/ACTIVE条件の追加後も回帰確認する。再オープンしない |
| #284 | 契約fixture、競合・欠損・期限・再送・削除後再送、境界と状態遷移の回帰・結合検証。各IssueのCIと設計・環境・監視・切替手順の最終整合 |

上記の担当範囲は各Issue本文と照合済み。`design/API設計.md`・DB設計・TanStackQuery設計に本契約への参照を追加し、詳細な仕様表の統合は各後続実装で行う。後続実装ではテスト設計・テストスクリプト・CIを更新する。#276の設計判断は完了。[解決記録](https://github.com/Kurarowa305/wardrobe/issues/276#issuecomment-6107706587)をGitHubへ投稿し、#276をクローズ済み。親#271・仕様#272・後続#278〜#284へ引き継ぎ済み。機能実装は後続Issueで行う。
