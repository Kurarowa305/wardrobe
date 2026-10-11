"""#274調査専用。実行時に公開データを取得する。CIからは呼ばない。"""
import datetime
import hashlib
import json
from pathlib import Path
import sys
import urllib.request
import urllib.parse
import csv
import zipfile
import io

SOURCES = [
    ('mt_city_all.csv', 'https://data.address-br.digital.go.jp/mt_city/mt_city_all.csv.zip', 'zip'),
    ('mt_city_pos_all.csv', 'https://data.address-br.digital.go.jp/mt_city_pos/mt_city_pos_all.csv.zip', 'zip'),
    ('mt_pref_all.csv', 'https://data.address-br.digital.go.jp/mt_pref/mt_pref_all.csv.zip', 'zip'),
    ('city-catalog.json', 'https://www.arcgis.com/sharing/rest/content/items/5e130d8117c6426fa1f53a5dbf90cb74?f=json', 'json'),
    ('city-pos-catalog.json', 'https://www.arcgis.com/sharing/rest/content/items/7108b74d9fad4e79997538ec40aa8015?f=json', 'json'),
    ('localgovjp.json', 'https://code4fukui.github.io/localgovjp/localgovjp.json', 'json'),
]

def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python3 scripts/probe-japan-municipality-274.py <new-output-directory>')
    output = Path(sys.argv[1])
    output.mkdir(parents=True, exist_ok=False)
    manifest = {'sources': []}
    for filename, url, kind in SOURCES:
        at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with urllib.request.urlopen(url, timeout=20) as response:
            raw = response.read()
            headers = {key: response.headers.get(key) for key in ['Last-Modified', 'ETag', 'Content-Type']}
            status = response.status
        data = zipfile.ZipFile(io.BytesIO(raw)).read(filename) if kind == 'zip' else raw
        (output / filename).write_bytes(data)
        manifest['sources'].append(dict(file=filename, url=url, requestedAt=at, status=status,
                                       headers=headers, downloadSha256=hashlib.sha256(raw).hexdigest(),
                                       fileSha256=hashlib.sha256(data).hexdigest()))
        (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        print(filename, len(data), flush=True)
    with (output / 'mt_city_pos_all.csv').open(encoding='utf-8-sig', newline='') as source:
        positions = {row['lg_code']: row for row in csv.DictReader(source)}
    date = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat()
    records = []
    for code in ['131041', '133078']:
        row = positions[code]
        url = 'https://api.open-meteo.com/v1/forecast?' + urllib.parse.urlencode(dict(
            latitude=row['rep_lat'], longitude=row['rep_lon'], models='best_match',
            daily='apparent_temperature_max,temperature_2m_max,temperature_2m_min,weather_code',
            timezone='Asia/Tokyo', temperature_unit='celsius', timeformat='iso8601',
            start_date=date, end_date=date))
        record = dict(lgCode=code, sourceSrid=row['rep_srid'], coordinatePolicy='jgd2011-as-wgs84-weather-v1',
                      requestedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), url=url)
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                record.update(status=response.status, response=json.load(response))
        except Exception as error:
            record.update(status=getattr(error, 'code', None), response={'probe_error': str(error)})
        records.append(record)
    (output / 'forecast-from-abr.json').write_text(json.dumps({'records': records}, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    main()
