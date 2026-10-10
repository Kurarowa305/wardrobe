import { createHash } from "node:crypto";

const fields = [
  "PK",
  "SK",
  "wardrobeId",
  "historyId",
  "clothingId",
  "templateId",
  "clothingIds",
  "date",
  "count",
  "wearCount",
  "lastWornAt",
  "wearCountSk",
  "lastWornAtSk",
  "statsVersion",
];
const keyOf = (row) => `${row.PK}|${row.SK}`;
const relevant = (row) =>
  /^W#.+#(?:HIST|CLOTH|TPL|COUNT#(?:CLOTH|TPL)#.+)$/.test(row.PK ?? "");
export function auditFingerprint(rows) {
  const canonical = rows
    .filter(relevant)
    .map((row) =>
      Object.fromEntries(
        fields
          .filter((field) => row[field] !== undefined)
          .map((field) => [field, row[field]]),
      ),
    )
    .sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
const timestamp = (date) =>
  Date.UTC(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8));
const validDate = (date) =>
  typeof date === "string" &&
  /^\d{8}$/.test(date) &&
  new Date(timestamp(date)).toISOString().slice(0, 10).replaceAll("-", "") ===
    date;
export function auditWearStats(rows) {
  const bases = new Map(),
    daily = new Map(),
    expectedDaily = new Map(),
    problems = [],
    differences = [];
  const histories = [];
  const seen = new Set();
  for (const row of rows.filter(relevant)) {
    if (seen.has(keyOf(row)))
      problems.push({
        key: keyOf(row),
        reason: "入力に同一キーが重複している。",
      });
    seen.add(keyOf(row));
    if (/^W#.+#(?:CLOTH|TPL)$/.test(row.PK)) bases.set(keyOf(row), row);
    else if (row.PK.includes("#COUNT#")) {
      daily.set(keyOf(row), row);
      if (
        !row.SK?.startsWith("DATE#") ||
        !validDate(row.SK.slice(5)) ||
        !Number.isSafeInteger(row.count) ||
        row.count < 1
      )
        problems.push({
          key: keyOf(row),
          reason: "日別件数のキーまたは件数が不正。",
        });
    } else histories.push(row);
  }
  for (const row of histories) {
    if (
      row.PK !== `W#${row.wardrobeId}#HIST` ||
      row.SK !== `HIST#${row.historyId}` ||
      !validDate(row.date) ||
      !Array.isArray(row.clothingIds) ||
      row.clothingIds.length === 0 ||
      !row.clothingIds.every((id) => typeof id === "string" && id.length > 0) ||
      new Set(row.clothingIds).size !== row.clothingIds.length ||
      !(
        row.templateId === null ||
        (typeof row.templateId === "string" && row.templateId.length > 0)
      )
    ) {
      problems.push({
        key: keyOf(row),
        reason:
          "履歴の構成服・日付・キーが不正。現在のテンプレートから過去の構成を推測しない。",
      });
      continue;
    }
    const targets = row.clothingIds.map((id) => ["CLOTH", id]);
    if (row.templateId) targets.push(["TPL", row.templateId]);
    for (const [kind, id] of targets) {
      const baseKey = `W#${row.wardrobeId}#${kind}|${kind}#${id}`;
      if (!bases.has(baseKey))
        problems.push({
          key: baseKey,
          historyKey: keyOf(row),
          reason: "履歴の対象が存在しない。論理削除済みデータも監査対象。",
        });
      const PK = `W#${row.wardrobeId}#COUNT#${kind}#${id}`,
        SK = `DATE#${row.date}`;
      const key = `${PK}|${SK}`;
      const expected = expectedDaily.get(key) ?? {
        PK,
        SK,
        count: 0,
        baseKey,
        date: row.date,
      };
      expected.count++;
      expectedDaily.set(key, expected);
    }
  }
  const expectedStats = new Map();
  for (const row of expectedDaily.values()) {
    const stats = expectedStats.get(row.baseKey) ?? {
      wearCount: 0,
      lastWornAt: 0,
    };
    stats.wearCount += row.count;
    stats.lastWornAt = Math.max(stats.lastWornAt, timestamp(row.date));
    expectedStats.set(row.baseKey, stats);
  }
  for (const [key, row] of bases) {
    const segment = row.PK.endsWith("#CLOTH") ? "CLOTH" : "TPL";
    const id = segment === "CLOTH" ? row.clothingId : row.templateId;
    if (
      !id ||
      row.PK !== `W#${row.wardrobeId}#${segment}` ||
      row.SK !== `${segment}#${id}` ||
      (row.statsVersion !== undefined &&
        (!Number.isSafeInteger(row.statsVersion) || row.statsVersion < 0))
    ) {
      problems.push({ key, reason: "対象のキーまたは統計更新番号が不正。" });
      continue;
    }
    const stats = expectedStats.get(key) ?? { wearCount: 0, lastWornAt: 0 };
    const expected = {
      ...stats,
      wearCountSk: `WEAR#${String(stats.wearCount).padStart(10, "0")}#${id}`,
      lastWornAtSk: `LASTWORN#${stats.lastWornAt}#${id}`,
    };
    const actual = Object.fromEntries(
      Object.keys(expected).map((field) => [field, row[field] ?? null]),
    );
    if (Object.keys(expected).some((field) => row[field] !== expected[field]))
      differences.push({
        kind: "stats",
        key,
        actual,
        expected,
        observedStatsVersion: row.statsVersion ?? null,
      });
  }
  for (const key of new Set([...daily.keys(), ...expectedDaily.keys()])) {
    const actual = daily.get(key)?.count ?? null,
      expected = expectedDaily.get(key)?.count ?? null;
    if (actual !== expected)
      differences.push({ kind: "daily", key, actual, expected });
  }
  return {
    fingerprint: auditFingerprint(rows),
    counts: {
      histories: histories.length,
      targets: bases.size,
      daily: daily.size,
      differences: differences.length,
      problems: problems.length,
    },
    problems,
    differences,
    correctionPlanReady: problems.length === 0,
    correctionPolicy:
      "書き込み停止中に再監査し、履歴を根拠に日別件数と統計・索引を一括整合させる。補正時は対象のstatsVersionも進める。実行前に対象・バックアップ・条件付き更新をレビューする。本スクリプトは書き込まない。",
  };
}
