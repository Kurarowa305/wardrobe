import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditWearStats, auditFingerprint } from "./lib/auditWearStats.mjs";
const date = Date.UTC(2026, 0, 10);
const base = {
  PK: "W#w#CLOTH",
  SK: "CLOTH#c",
  wardrobeId: "w",
  clothingId: "c",
  wearCount: 2,
  lastWornAt: date,
  wearCountSk: "WEAR#0000000002#c",
  lastWornAtSk: `LASTWORN#${date}#c`,
};
const history = (id) => ({
  PK: "W#w#HIST",
  SK: `HIST#${id}`,
  wardrobeId: "w",
  historyId: id,
  clothingIds: ["c"],
  templateId: null,
  date: "20260110",
});
const daily = { PK: "W#w#COUNT#CLOTH#c", SK: "DATE#20260110", count: 2 };
const rows = [base, history("h1"), history("h2"), daily];
assert.deepEqual(auditWearStats(rows).counts, {
  histories: 2,
  targets: 1,
  daily: 1,
  differences: 0,
  problems: 0,
});
assert.equal(auditFingerprint(rows), auditFingerprint([...rows].reverse()));
const broken = [
  { ...base, lastWornAt: 0, lastWornAtSk: "LASTWORN#0#c" },
  history("h1"),
  history("h2"),
  { ...daily, count: 1 },
];
const report = auditWearStats(broken);
assert.equal(report.counts.differences, 2);
assert.equal(
  report.differences.find((row) => row.kind === "stats").expected.lastWornAt,
  date,
);
assert.equal(
  report.differences.find((row) => row.kind === "daily").expected,
  2,
);
assert.equal(
  auditWearStats([base]).differences.find((row) => row.kind === "stats")
    .expected.wearCount,
  0,
);
assert.equal(
  auditWearStats([base, daily]).differences.find((row) => row.kind === "daily")
    .expected,
  null,
);
assert.equal(
  auditWearStats(rows.slice(0, 3)).differences.find(
    (row) => row.kind === "daily",
  ).actual,
  null,
);
assert.equal(
  auditWearStats([base, { ...history("h"), templateId: "t", clothingIds: [] }])
    .correctionPlanReady,
  false,
);
assert.equal(auditWearStats([history("h")]).correctionPlanReady, false);
assert.equal(auditWearStats([...rows, base]).correctionPlanReady, false);
assert.equal(
  auditWearStats([{ ...daily, count: null }]).correctionPlanReady,
  false,
);
assert.equal(
  auditWearStats([{ ...history("h"), date: "20260230" }]).correctionPlanReady,
  false,
);
assert.equal(
  auditWearStats(rows.map((row) => ({ ...row, status: "DELETED" }))).counts
    .differences,
  0,
);
const dir = mkdtempSync(join(tmpdir(), "wardrobe-audit-test-"));
try {
  const input = join(dir, "input.json"),
    output = join(dir, "report.json");
  writeFileSync(input, JSON.stringify(broken));
  const run = spawnSync(
    process.execPath,
    ["scripts/audit-wear-stats.mjs", "--input", input, "--output", output],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 2, run.stderr);
  assert.equal(JSON.parse(readFileSync(output, "utf8")).counts.differences, 2);
  const rerun = spawnSync(
    process.execPath,
    ["scripts/audit-wear-stats.mjs", "--input", input, "--output", output],
    { encoding: "utf8" },
  );
  assert.equal(rerun.status, 1, "既存レポートを上書きしない");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(
  "PASS 監査: 正常・同日欠損・日別件数の欠落/余分・未着用・論理削除・履歴不正・対象欠落・CLI出力/上書き防止",
);
