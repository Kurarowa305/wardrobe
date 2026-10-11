import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const base = new URL('../design/調査データ/open-meteo-274/', import.meta.url);
const records = ['responses.json', 'search-additional.json'].flatMap(file =>
  JSON.parse(readFileSync(new URL(file, base), 'utf8')).records);
assert.equal(records.length, 50);
for (const record of records) {
  const url = new URL(record.url);
  assert.equal(url.protocol, 'https:');
  assert.ok(['api.open-meteo.com', 'geocoding-api.open-meteo.com'].includes(url.hostname));
  assert.equal(url.searchParams.has('apikey'), false);
  assert.ok(Number.isFinite(Date.parse(record.requestedAt)));
  assert.ok(Number.isFinite(record.elapsedMs) && record.elapsedMs >= 0);
  if (record.status !== 200) assert.equal(typeof record.response.probe_error, 'string');
}
const get = (kind, label) => {
  const record = records.find(record => record.kind === kind && record.label === label);
  assert.ok(record, label);
  assert.equal(record.status, 200, label);
  return record;
};
for (const region of ['東京', '札幌', '那覇']) {
  for (const model of ['best_match', 'jma_seamless', 'jma_msm']) {
    const record = get('forecast', `${region}/${model}`);
    const body = record.response;
    assert.equal(new URL(record.url).searchParams.get('models'), model);
    assert.equal(body.timezone, 'Asia/Tokyo');
    assert.equal(body.utc_offset_seconds, 32400);
    assert.deepEqual(body.daily.time, ['2026-10-11']);
    for (const field of ['apparent_temperature_max', 'temperature_2m_max', 'temperature_2m_min', 'weather_code']) {
      assert.equal(body.daily[field].length, 1);
      assert.ok(Number.isFinite(body.daily[field][0]), field);
      assert.equal(body.daily_units[field], field === 'weather_code' ? 'wmo code' : '°C');
    }
    assert.deepEqual(body.hourly_units, { time: 'iso8601', apparent_temperature: '°C', temperature_2m: '°C', relative_humidity_2m: '%', wind_speed_10m: 'm/s', shortwave_radiation: 'W/m²' });
    assert.equal(body.hourly.time.length, 24);
    assert.equal(body.hourly.time[0], '2026-10-11T00:00');
    assert.equal(body.hourly.time[23], '2026-10-11T23:00');
    for (const field of ['apparent_temperature', 'temperature_2m', 'relative_humidity_2m', 'wind_speed_10m', 'shortwave_radiation']) {
      assert.equal(body.hourly[field].length, 24);
      assert.ok(body.hourly[field].every(Number.isFinite), field);
    }
    assert.ok(body.daily.temperature_2m_max[0] >= body.daily.temperature_2m_min[0]);
    assert.equal(body.daily.apparent_temperature_max[0], Math.max(...body.hourly.apparent_temperature));
  }
}
for (const label of ['東京/jma_gsm', '那覇/jma_gsm']) {
  const body = get('forecast', label).response;
  assert.ok(body.hourly.shortwave_radiation.every(value => value === null));
  assert.ok(Number.isFinite(body.daily.apparent_temperature_max[0]));
}
const searches = records.filter(record => record.kind === 'geocoding' && record.status === 200);
for (const record of searches) {
  const params = new URL(record.url).searchParams;
  assert.equal(params.get('countryCode'), 'JP');
  assert.equal(params.get('language'), 'ja');
  for (const result of record.response.results ?? []) {
    assert.equal(result.country_code, 'JP');
    assert.ok(Number.isInteger(result.id));
    assert.ok(Number.isFinite(result.latitude) && Number.isFinite(result.longitude));
  }
}
for (const label of ['東京', '札幌', '大阪', '那覇', '新宿区', 'とうきょう', 'トウキョウ', 'しんじゅく', 'シンジュク', 'ふちゅう', 'フチュウ', '府中市', '府中, 広島県', '檜原村, 東京都']) {
  assert.equal((get('geocoding', label).response.results ?? []).length, 0, label);
}
for (const label of ['東京都', '札幌市', '大阪市', '福岡市', '那覇市', '白馬村', '美瑛町']) {
  assert.ok(get('geocoding', label).response.results.some(result => result.name === label), label);
}
const fuchu = get('geocoding', 'Fuchu').response.results;
assert.ok(fuchu.some(result => result.admin1 === '東京都'));
assert.ok(fuchu.some(result => result.admin1 === '広島県'));
assert.ok(get('geocoding', 'Tokyo').response.results.some(result => result.feature_code === 'PRK'));
const selected = get('geocoding', '府中, 東京都').response.results.find(result => result.id === 11611632);
const resolved = get('geocoding-get', '府中ID再解決').response;
for (const field of ['id', 'latitude', 'longitude', 'name', 'admin1', 'admin2', 'country_code']) {
  assert.equal(resolved[field], selected[field]);
}
const failures = records.filter(record => record.status !== 200);
assert.deepEqual(failures.map(record => record.label).sort(), ['札幌/jma_gsm', '檜原村'].sort());
console.log('Open-Meteo #274 evidence: forecast, units, dates, model gaps, search quality, ID resolution, transport failures OK');
