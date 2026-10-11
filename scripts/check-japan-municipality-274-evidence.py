"""公開自治体データの固定証拠検証と調査用検索試作。本番実装ではない。"""
import csv
import hashlib
import json
import math
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlparse, parse_qs

BASE = Path(__file__).resolve().parent.parent / 'design/調査データ/japan-municipality-274'

def load_csv(name):
    with (BASE / name).open(encoding='utf-8-sig', newline='') as source:
        return list(csv.DictReader(source))

def normalize(value):
    value = unicodedata.normalize('NFKC', value).lower()
    return ''.join(chr(ord(char) - 0x60) if '\u30a1' <= char <= '\u30f6' else char for char in value)

def short(value):
    # 漢字の行政接尾辞に限る。読みに同じ1文字削除を行うと那覇→な等の誤変換になる。
    return value[:-1] if len(value) > 1 and value[-1] in '都道府県市区町村' else value

def aliases(row):
    result = set()
    for suffix in ['', '_kana']:
        pref, county, city, ward = [row[key + suffix] for key in ['pref', 'county', 'city', 'ward']]
        names = [city + ward, ward] if ward else [city]
        if not suffix:
            names += [short(city) + ward, short(city) + short(ward)] if ward else [short(city)]
        # かなは前方一致で「さっぽろ」等の接尾辞なし入力にも対応する。
        for name in names:
            if name:
                result.update([name, pref + name, pref + county + name])
                if not suffix:
                    result.add(short(pref) + name)
    return {normalize(value) for value in result}

def search(rows, query, limit=10):
    tokens = [normalize(value) for value in re.split(r'[\s,、]+', query.strip()) if value]
    if not tokens or len(query) > 64:
        return {'total': 0, 'items': []}
    scored = []
    for row in rows:
        names = aliases(row)
        if all(any(token in name for name in names) for token in tokens):
            score = sum(min(0 if token == name else 1 if name.startswith(token) else 2
                            for name in names if token in name) for token in tokens)
            scored.append((score, row['lg_code'], row))
    scored.sort(key=lambda item: item[:2])
    return {'total': len(scored), 'items': [dict(code=row['lg_code'], label=row['pref'] + row['county'] + row['city'] + row['ward'])
                                          for _, _, row in scored[:limit]]}

def check():
    for source in json.loads((BASE / 'manifest.json').read_text())['sources']:
        assert source['status'] == 200
        assert hashlib.sha256((BASE / source['file']).read_bytes()).hexdigest() == source['fileSha256']
    cities, positions, prefs = [load_csv(name) for name in ['mt_city_all.csv', 'mt_city_pos_all.csv', 'mt_pref_all.csv']]
    assert len(cities) == len(positions) == 1918
    assert len(prefs) == 47
    codes = {row['lg_code'] for row in cities}
    assert len(codes) == 1918 == len({row['lg_code'] for row in positions})
    assert codes == {row['lg_code'] for row in positions}
    assert {row['pref'] for row in cities} == {row['pref'] for row in prefs}
    assert sum(bool(row['ward']) for row in cities) == 171
    for row in cities:
        assert re.fullmatch(r'\d{6}', row['lg_code'])
        weights = [6, 5, 4, 3, 2]
        digit = (11 - sum(int(n) * w for n, w in zip(row['lg_code'][:5], weights)) % 11) % 10
        assert digit == int(row['lg_code'][-1]), row['lg_code']
        assert row['city'] and row['city_kana'] and row['pref_kana']
        assert not row['ward'] or row['ward_kana']
        assert row['efct_date'] <= '2026-10-11'
        assert not row['ablt_date'] or row['ablt_date'] > '2026-10-11'
    for row in positions:
        assert row['rep_srid'] == 'EPSG:6668'
        lat, lon = float(row['rep_lat']), float(row['rep_lon'])
        assert math.isfinite(lat) and math.isfinite(lon)
        assert 20 < lat < 50 and 120 < lon < 155
    cases = {
        '新宿区': {'131041'}, 'しんじゅく': {'131041'}, 'シンジュク': {'131041'},
        'ｼﾝｼﾞｭｸ': {'131041'}, '檜原村': {'133078'}, 'ひのはら': {'133078'},
        '札幌': {'011002'}, 'さっぽろ': {'011002'}, '那覇': {'472018'}, 'なは': {'472018'},
        '府中市': {'132063', '342084'}, 'ふちゅう': {'132063', '342084'},
        '東京都 府中': {'132063'}, 'とうきょうと ふちゅう': {'132063'},
        '広島県府中市': {'342084'}, '横浜市中区': {'141046'}, '横浜 中区': {'141046'},
        'よこはましなかく': {'141046'}, '浜松市浜名区': {'221392'}, 'はままつしはまなく': {'221392'},
        '津': {'242012'}, '白馬村': {'204854'}, 'びえい': {'014591'},
    }
    output = {}
    for query, expected in cases.items():
        result = search(cities, query)
        assert expected <= {row['code'] for row in result['items']}, (query, result)
        output[query] = result
    assert search(cities, '中区')['total'] > 1
    assert search(cities, '東京')['total'] > 10
    assert len(search(cities, '東京')['items']) == 10
    assert search(cities, '')['total'] == search(cities, '存在しない自治体')['total'] == 0
    assert not search(cities, '浜松市中区')['items']
    assert {row['ward'] for row in cities if row['city'] == '浜松市' and row['ward']} == {'中央区', '浜名区', '天竜区'}
    localgov = json.loads((BASE / 'localgovjp.json').read_text())
    assert len(localgov) == 1916
    abr = {row['lg_code']: row for row in cities}
    other = {row['lgcode']: row for row in localgov}
    assert len(abr.keys() - other.keys()) == 9
    assert len(other.keys() - abr.keys()) == 7
    assert '221317' in other and '221317' not in abr
    assert '221384' in abr and '221384' not in other
    forecasts = json.loads((BASE / 'forecast-from-abr.json').read_text())['records']
    assert {row['lgCode'] for row in forecasts} == {'131041', '133078'}
    position_by_code = {row['lg_code']: row for row in positions}
    for record in forecasts:
        assert record['status'] == 200
        assert record['sourceSrid'] == 'EPSG:6668'
        parsed = urlparse(record['url'])
        assert parsed.scheme == 'https' and parsed.hostname == 'api.open-meteo.com'
        params = parse_qs(parsed.query)
        pos = position_by_code[record['lgCode']]
        assert params['latitude'] == [pos['rep_lat']] and params['longitude'] == [pos['rep_lon']]
        assert params['start_date'] == params['end_date'] == ['2026-10-11']
        assert params['models'] == ['best_match']
        body = record['response']
        assert body['timezone'] == 'Asia/Tokyo' and body['utc_offset_seconds'] == 32400
        assert body['daily']['time'] == ['2026-10-11']
        for field in ['apparent_temperature_max', 'temperature_2m_max', 'temperature_2m_min', 'weather_code']:
            assert len(body['daily'][field]) == 1 and math.isfinite(body['daily'][field][0])
            assert body['daily_units'][field] == ('wmo code' if field == 'weather_code' else '°C')
    saved = json.loads((BASE / 'search-prototype-results.json').read_text())
    assert saved == output
    print('ABR #274 evidence: 1918 joined records, 47 prefectures, kana search, duplicate names, wards, coordinates, source differences OK')
    return output

if __name__ == '__main__':
    check()
