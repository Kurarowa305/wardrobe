# 固定地域辞書

デジタル庁「アドレス・ベース・レジストリ」の市区町村マスター、市区町村マスター位置参照、都道府県マスター（2026-10-11取得）をwardrobeが結合・検索用に加工。

- 元データ: https://www.digital.go.jp/policies/base_registry_address
- 利用規約: https://www.digital.go.jp/policies/base_registry_address_tos
- PDL1.0: https://www.digital.go.jp/resources/open_data/public_data_license_v1.0
- 取得カタログのライセンス: CC BY 4.0 https://creativecommons.org/licenses/by/4.0/
- 原本・URL・取得日時・SHA: `design/調査データ/japan-municipality-274/manifest.json`

`python3 scripts/generate-region-dictionary.py` で再現し、`--check` で同一出力を検証する。外部通信は不要。生成TSはtscでLambda配布物に含まれる。固定版は元CSV 3点のSHAから生成する。全国の最新性を保証するものではない。

原座標はEPSG:6668（JGD2011）。天気用途でWGS84近似として使用する方針を保存し、原座標を予報応答の格子座標で上書きしない。辞書更新は今回対象外。
