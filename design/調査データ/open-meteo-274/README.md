# Open-Meteo #274 接続証拠

2026-10-11 JST、公開の代表地点で実APIへ接続した結果。個人の設定・位置情報は含まない。

- `responses.json`: 地域検索23回、予報12回、公開地点ID再解決1回。
- `search-additional.json`: 検索13回、府中の検索結果ID再解決1回。
- 合計50試行、HTTP 200は48、TLS handshake timeoutは2。失敗は応答欠損や検索0件とは異なる。
- `requestedAt`はUTCの実取得時刻、`url`は実リクエスト。予報対象日は2026-10-11 JST。
- `response`は受信JSONを数値丸めせず再整形したもの。通信失敗はprobe_errorとして調査用に記録。
- 取得値はモデル予報。ユーザーの実測や予報精度の検証ではない。

出典: [Weather data by Open-Meteo](https://open-meteo.com/)、地域データは [GeoNames](https://www.geonames.org/) via Open-Meteo。[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)、[提供元ライセンス](https://open-meteo.com/en/licence)。wardrobeによる加工は取得メタデータ追加、整形、比較要約。提供元によるwardrobeの推奨・承認を意味しない。

再実行（外部通信を50回行う。CIでは実行しない）:

```sh
node scripts/probe-open-meteo-274.mjs /tmp/open-meteo-274-new.json
```

既存証拠を上書きしない出力先を指定する。予報・検索索引は変化するため、再実行時の値が一致することは期待しない。再実行スクリプトは調査用で本番の再試行・キャッシュ・レート制限を実装したものではない。

ネットワークなしの保存証拠検証:

```sh
node scripts/check-open-meteo-274-evidence.mjs
```
