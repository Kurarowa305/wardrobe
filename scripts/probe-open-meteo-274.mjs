// 調査の再実行専用。本番アダプターではなく、CIからは呼ばない。
import { readFileSync, writeFileSync } from 'node:fs';
const files = ['responses.json', 'search-additional.json'];
const base = new URL('../design/調査データ/open-meteo-274/', import.meta.url);
if (process.argv.length !== 3) {
  console.error('Usage: node scripts/probe-open-meteo-274.mjs <new-output.json>');
  process.exit(1);
}
const inputs = files.flatMap(file => JSON.parse(readFileSync(new URL(file, base), 'utf8')).records);
const records = [];
for (const input of inputs) {
  const url = new URL(input.url);
  if (!['api.open-meteo.com', 'geocoding-api.open-meteo.com'].includes(url.hostname) || url.protocol !== 'https:') {
    throw new Error('Unexpected probe endpoint');
  }
  const requestedAt = new Date().toISOString();
  const started = performance.now();
  let status = null;
  let response;
  try {
    const result = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    status = result.status;
    response = await result.json();
  } catch (error) {
    response = { probe_error: String(error) };
  }
  records.push({ kind: input.kind, label: input.label, requestedAt, url: input.url, status,
    elapsedMs: Math.round(performance.now() - started), response });
  console.log(`${input.kind}: ${input.label}: ${status ?? 'transport failure'}`);
}
// 既存の証拠を上書きしない。日付・予報値・検索結果が変わるため再取得は別ファイルに保存。
writeFileSync(process.argv[2], JSON.stringify({ records }, null, 2) + '\n', { flag: 'wx' });
