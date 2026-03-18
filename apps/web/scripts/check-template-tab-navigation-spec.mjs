import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

function abs(relPath) {
  return path.join(webRoot, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function read(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
}

function includes(source, expected) {
  return source.includes(expected);
}

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

const target = "src/mocks/handlers/template.ts";
const source = exists(target) ? read(target) : "";

check(
  "TTN-01",
  "Template MSW handler が存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "TTN-02",
  "Template MSW handler が passthrough を import する",
  includes(source, 'import { HttpResponse, http, passthrough } from "msw";'),
  "template.ts で passthrough の import が不足しています",
);

check(
  "TTN-03",
  "Template MSW handler が Next.js ルーティング系リクエストをバイパスするガードを持つ",
  includes(source, "function shouldBypassTemplateApiMock(request: Request)") &&
    includes(source, 'request.mode === "navigate" || request.destination === "document"') &&
    includes(source, 'request.headers.has("rsc")') &&
    includes(source, 'request.headers.has("next-router-prefetch")') &&
    includes(source, 'request.headers.has("next-router-state-tree")') &&
    includes(source, 'accept.includes("text/x-component") || accept.includes("text/html")'),
  "ルーティング系リクエストを判定するガード実装が不足しています",
);

const bypassMatches = source.match(/if \(shouldBypassTemplateApiMock\(request\)\) \{\s+return passthrough\(\);\s+\}/g) ?? [];

check(
  "TTN-04",
  "Template handlers 全てでガード判定時に passthrough する",
  bypassMatches.length === 5,
  `passthrough ガードの実装数が不足しています（actual: ${bypassMatches.length}, expected: 5）`,
);

check(
  "TTN-05",
  "ガード判定はシナリオ適用より先に実行される",
  includes(
    source,
    "if (shouldBypassTemplateApiMock(request)) {\n      return passthrough();\n    }\n\n    const scenarioResponse = await applyMockScenario(request);",
  ),
  "バイパス判定が applyMockScenario より後段です",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
