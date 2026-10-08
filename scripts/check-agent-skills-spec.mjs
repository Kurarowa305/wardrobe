import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

// Optional glossary/ADR files are intentionally not required by this contract.
test("AS-01: Agent skills の参照先が存在し、ブロックが重複しない", () => {
  const agents = read("AGENTS.md");
  assert.equal(agents.match(/^## Agent skills$/gm)?.length, 1);
  const block = agents.split("## Agent skills\n")[1].split(/^## /m)[0];
  const paths = [...block.matchAll(/`(docs\/agents\/[^`]+\.md)`/g)].map((match) => match[1]);
  assert.equal(paths.length, 3);
  assert.equal(new Set(paths).size, 3);
  for (const path of paths) assert.ok(read(path).trim(), fileURLToPath(new URL(path, root)));
});

test("AS-02: GitHub の対象リポジトリと PR triage フラグ", () => {
  const tracker = read("docs/agents/issue-tracker.md");
  assert.match(tracker, /^# Issue tracker: GitHub$/m);
  assert.match(tracker, /Kurarowa305\/wardrobe/);
  assert.match(tracker, /PRs as a request surface: no\./);
  assert.match(tracker, /gh issue create/);
  assert.match(tracker, /gh issue view/);
});

test("AS-03: canonical role の5種類が既定ラベルに一対一で対応する", () => {
  const rows = read("docs/agents/triage-labels.md").split("\n")
    .filter((line) => line.startsWith("|"))
    .slice(2)
    .map((line) => line.split("|").slice(1, 3).map((cell) => cell.trim()));
  assert.deepEqual(rows, [
    ["needs-triage", "needs-triage"],
    ["needs-info", "needs-info"],
    ["ready-for-agent", "ready-for-agent"],
    ["ready-for-human", "ready-for-human"],
    ["wontfix", "wontfix"],
  ]);
});

test("AS-04: 共有ドメイン資料と既存設計資料への参照", () => {
  const domain = read("docs/agents/domain.md");
  assert.match(domain, /single-context/);
  for (const path of ["GLOSSARY.md", "docs/adr/", "design/", "design/タスク設計/"]) {
    assert.ok(domain.includes(`\`${path}\``), `${path} への参照`);
  }
});
