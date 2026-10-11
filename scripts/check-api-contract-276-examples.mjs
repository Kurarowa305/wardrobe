import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const path = 'design/タスク設計/地域天気テンプレート推薦_API契約と状態管理判断.md';
const document = readFileSync(new URL(path, root), 'utf8');
const examples = [...document.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
const modes = ['auto', 'spring', 'summer', 'autumn', 'winter'];
const integer = (value) => Number.isSafeInteger(value) && value >= 0;

function validateRecommendation(value) {
  assert.equal(typeof value.wardrobeId, 'string');
  assert.ok(integer(value.regionRevision));
  assert.match(value.targetDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(modes.includes(value.mode));
  assert.ok(['ready', 'empty', 'region_required', 'weather_required'].includes(value.status));
  assert.ok(['manual', 'apparent_temperature', 'temperature_max_fallback', 'none'].includes(value.basis));
  assert.ok(Array.isArray(value.items));
  assert.ok(value.items.length <= 3);
  if (value.status === 'ready') assert.ok(value.items.length > 0);
  else assert.equal(value.items.length, 0);
  if (['region_required', 'weather_required'].includes(value.status)) {
    assert.equal(value.mode, 'auto');
    assert.equal(value.basis, 'none');
  } else if (value.mode !== 'auto') assert.equal(value.basis, 'manual');
  else assert.ok(['apparent_temperature', 'temperature_max_fallback'].includes(value.basis));
  assert.equal(Object.hasOwn(value, 'season'), false);
  for (const item of value.items) {
    assert.ok(integer(item.revision));
    assert.equal(typeof item.templateId, 'string');
    assert.equal(typeof item.name, 'string');
    assert.ok(Array.isArray(item.tagIds));
    assert.ok(item.clothingItems.length >= 1 && item.clothingItems.length <= 20);
    assert.equal(new Set(item.clothingItems.map((clothing) => clothing.clothingId)).size, item.clothingItems.length);
    for (const clothing of item.clothingItems) {
      assert.equal(typeof clothing.clothingId, 'string');
      assert.equal(clothing.status, 'ACTIVE');
      assert.ok(clothing.imageKey === null || typeof clothing.imageKey === 'string');
    }
  }
}

test('全JSON例を解析でき、検索・天気・推薦3状態・エラーの例が揃う', () => {
  assert.equal(examples.length, 6);
  assert.ok(examples.some((value) => value.datasetVersion));
  assert.ok(examples.some((value) => value.daily));
  for (const status of ['ready', 'empty', 'region_required']) {
    assert.ok(examples.some((value) => value.mode && value.status === status));
  }
  assert.ok(examples.some((value) => value.error));
});

test('地域検索例の識別子・表示名・件数・辞書版を検証する', () => {
  const value = examples.find((entry) => entry.datasetVersion);
  assert.equal(typeof value.datasetVersion, 'string');
  assert.equal(typeof value.hasMore, 'boolean');
  assert.ok(value.items.length <= 10);
  for (const item of value.items) {
    assert.match(item.regionId, /^abr:lg:\d{6}$/);
    assert.ok(item.label.length > 0);
  }
});

test('天気例はJST対象日末に失効し、単位・気象入力・判定根拠が一致する', () => {
  const value = examples.find((entry) => entry.daily);
  assert.equal(value.status, 'available');
  assert.ok(integer(value.regionRevision));
  assert.equal(value.provider, 'open-meteo');
  assert.equal(value.modelPolicy, 'best_match');
  assert.equal(value.timezone, 'Asia/Tokyo');
  assert.equal(value.temperatureUnit, 'celsius');
  assert.ok(['fresh', 'cache'].includes(value.delivery));
  const start = Date.parse(`${value.targetDate}T00:00:00+09:00`);
  assert.equal(Date.parse(value.expiresAt), start + 86_400_000);
  assert.ok(Date.parse(value.fetchedAt) >= start && Date.parse(value.fetchedAt) < Date.parse(value.expiresAt));
  for (const key of ['apparentTemperatureMax', 'temperatureMax', 'temperatureMin']) {
    assert.ok(value.daily[key] === null || Number.isFinite(value.daily[key]));
  }
  assert.ok(value.daily.temperatureMax >= value.daily.temperatureMin);
  assert.equal(value.derivation.source, 'apparent_temperature');
  const temperature = value.daily.apparentTemperatureMax;
  assert.equal(value.derivation.dressingIndex, temperature < 15 ? 1 : temperature < 25 ? 2 : 3);
  assert.equal(Object.hasOwn(value, 'season'), false);
});

test('推薦例は手動・地域未設定・候補0件を区別し、最大3件と確認版を守る', () => {
  for (const value of examples.filter((entry) => entry.mode)) validateRecommendation(value);
});

test('不正な推薦例は拒否する（4件、readyが空、手動で設定要求、負の確認版、削除服、内部季節）', () => {
  const ready = examples.find((entry) => entry.status === 'ready');
  const mutations = [
    (value) => { value.items = Array(4).fill(value.items[0]); },
    (value) => { value.items = []; },
    (value) => { value.status = 'region_required'; value.items = []; value.basis = 'none'; },
    (value) => { value.items[0].revision = -1; },
    (value) => { value.items[0].clothingItems[0].status = 'DELETED'; },
    (value) => { value.season = 'summer'; },
  ];
  for (const mutate of mutations) {
    const value = structuredClone(ready);
    mutate(value);
    assert.throws(() => validateRecommendation(value));
  }
});

test('確認競合例は既存エラー形式で理由を返し、関連設計の契約参照が解決する', () => {
  const value = examples.find((entry) => entry.error);
  assert.equal(value.error.code, 'CONFLICT');
  assert.equal(value.error.details.reason, 'CONFIRMATION_STALE');
  assert.ok(value.error.message.length > 0);
  for (const name of ['API設計.md', 'DB設計.md', 'TanStackQuery設計.md']) {
    const contents = readFileSync(new URL(`design/${name}`, root), 'utf8');
    const link = [...contents.matchAll(/\]\(([^)]+)\)/g)].find((match) => match[1].endsWith(path.split('/').at(-1)));
    assert.ok(link, name);
    assert.ok(existsSync(new URL(link[1], new URL(`design/${name}`, root))));
  }
});
