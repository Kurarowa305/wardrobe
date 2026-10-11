# 公開自治体データによる地域検索補完の調査証拠（#274）

2026-10-11 JSTに公開配布ファイルを実取得。個人の所在地・ユーザー保存地域は使用していない。

| ファイル | 内容と提供元 |
| --- | --- |
| mt_city_all.csv | デジタル庁ABR全国市区町村マスター。名称・読み・コード、1,918行 |
| mt_city_pos_all.csv | 同位置参照拡張。代表座標・EPSG:6668、1,918行 |
| mt_pref_all.csv | 同都道府県マスター、47行 |
| manifest.json | 実取得URL・時刻・レスポンスヘッダ・ダウンロード本体と保存ファイルのSHA-256 |
| city-catalog.json / city-pos-catalog.json | 公式カタログの公開メタデータの必要項目を抽出。データURL、提供者、更新日記載、ライセンス等 |
| localgovjp.json | Code for FUKUI localgovjpの比較用スナップショット、1,916行。採用辞書ではない |
| search-prototype-results.json | ABR名称データから調査用検索試作で得た23入力の結果。外部検索APIの応答ではない |
| forecast-from-abr.json | ABR新宿区・檜原村の代表座標をOpen-Meteoへ渡した実接続2件。明示日付指定の日次4項目を取得 |

CSVはZIP内のデータを展開して保存。氏名・住所・IP・個人の座標は含まない。代表座標の原座標系はEPSG:6668（JGD2011）であり、WGS84と完全同一という検証はしていない。予報接続では緯度経度を近似利用する方針案を明記した。HTTP 200は接続の証拠であり、座標・予報の精度検証ではない。

出典: デジタル庁「アドレス・ベース・レジストリ」[全国市区町村マスター](https://dataset.address-br.digital.go.jp/documents/5e130d8117c6426fa1f53a5dbf90cb74/about)、[位置参照拡張](https://dataset.address-br.digital.go.jp/documents/7108b74d9fad4e79997538ec40aa8015/about)、[都道府県マスター](https://dataset.address-br.digital.go.jp/documents/45bcb60e4dc747b58def5493ab829825/about)。[ABR利用規約](https://www.digital.go.jp/policies/base_registry_address_tos)、[PDL1.0](https://www.digital.go.jp/resources/open_data/public_data_license_v1.0)。カタログはCC BY 4.0表記。PDL1.0は[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)互換の利用も認める。

wardrobeによる加工: メタデータの抽出、名称と座標のコード結合の検証、検索キー生成・候補順位付け・比較要約。加工結果を国が作成・承認したデータと表示しない。元CSV自体の名称・読み・座標値は変更していない。

比較データ出典: [Code for FUKUI localgovjp](https://github.com/code4fukui/localgovjp)、同READMEの[CC0](https://creativecommons.org/publicdomain/zero/1.0/)表記に基づく。予報の出典: [Weather data by Open-Meteo](https://open-meteo.com/)、[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。実JSONを整形し、取得メタデータを追加している。

検証（ネットワークなし、Python標準ライブラリのみ）:

```sh
python3 scripts/check-japan-municipality-274-evidence.py
```

再取得（新しいディレクトリを指定。公開データ6件と予報2件へ通信し、既存証拠を上書きしない）:

```sh
python3 scripts/probe-japan-municipality-274.py /tmp/japan-municipality-274-new
```

再取得時には更新・予報日・予報値が変わる。今回の固定証拠用テストへ無検証で差し替えない。カタログは再取得時に全JSONを保存し、今回のスナップショットは必要項目を抽出している。検索試作結果は再取得コマンドでは生成しない。検索関数は検証スクリプト内の調査用実装で、本番アプリへ導入したコードではない。
