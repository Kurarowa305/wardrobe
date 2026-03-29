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

function includes(relPath, expected) {
  return read(relPath).includes(expected);
}

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check(
  "MF-01",
  "web package に MSW 依存が追加されている",
  includes("package.json", '"msw"'),
  "apps/web/package.json に msw 依存が見つかりません",
);

check(
  "MF-02",
  "Service Worker スクリプトが public に配置されている",
  exists("public/mockServiceWorker.js"),
  "apps/web/public/mockServiceWorker.js が存在しません",
);

check(
  "MF-03",
  "health ハンドラが GET /health をモックで返す",
  exists("src/mocks/handlers/health.ts") &&
    includes("src/mocks/handlers/health.ts", 'http.get("*/health"') &&
    includes("src/mocks/handlers/health.ts", 'status: "ok"'),
  "src/mocks/handlers/health.ts に /health モック応答実装が不足しています",
);

check(
  "MF-04",
  "handlers 集約が healthHandler を公開している",
  exists("src/mocks/handlers/index.ts") &&
    includes("src/mocks/handlers/index.ts", 'import { healthHandler } from "./health";') &&
    includes("src/mocks/handlers/index.ts", "export const handlers = [healthHandler];"),
  "src/mocks/handlers/index.ts のハンドラ集約が不足しています",
);

check(
  "MF-05",
  "browser worker が setupWorker(...handlers) で初期化される",
  exists("src/mocks/browser.ts") &&
    includes("src/mocks/browser.ts", 'import { setupWorker } from "msw/browser";') &&
    includes("src/mocks/browser.ts", "export const worker = setupWorker(...handlers);"),
  "src/mocks/browser.ts の worker 初期化が不足しています",
);

check(
  "MF-06",
  "MSW 起動関数が NEXT_PUBLIC_ENABLE_MSW=true のときだけ一度だけ起動する",
  exists("src/mocks/start.ts") &&
    includes("src/mocks/start.ts", "let isStarted = false;") &&
    includes("src/mocks/start.ts", "export function shouldEnableMockServiceWorker()") &&
    includes("src/mocks/start.ts", 'return process.env.NEXT_PUBLIC_ENABLE_MSW === "true";') &&
    includes("src/mocks/start.ts", "if (!shouldEnableMockServiceWorker())") &&
    includes("src/mocks/start.ts", 'if (typeof window === "undefined")') &&
    includes("src/mocks/start.ts", "await worker.start({") &&
    includes("src/mocks/start.ts", 'onUnhandledRequest: "bypass"') &&
    includes("src/mocks/start.ts", "isStarted = true;"),
  "src/mocks/start.ts の起動ガード実装が不足しています",
);

check(
  "MF-07",
  "AppProviders が起動時に startMockServiceWorker を呼び出す",
  includes("src/lib/providers/AppProviders.tsx", 'from "@/mocks/start";') &&
    includes("src/lib/providers/AppProviders.tsx", "startMockServiceWorker") &&
    includes("src/lib/providers/AppProviders.tsx", "await startMockServiceWorker();") &&
    includes("src/lib/providers/AppProviders.tsx", 'console.error("[msw] failed to start mock service worker", error);'),
  "src/lib/providers/AppProviders.tsx の MSW 自動起動実装が不足しています",
);

check(
  "MF-08",
  "MSW有効環境では起動完了まで描画を待機する",
  includes("src/lib/providers/AppProviders.tsx", "useState(() => !shouldEnableMockServiceWorker())") &&
    includes("src/lib/providers/AppProviders.tsx", "if (!shouldEnableMockServiceWorker())") &&
    includes("src/lib/providers/AppProviders.tsx", "if (!isMockReady)") &&
    includes("src/lib/providers/AppProviders.tsx", "return null;"),
  "MSW 起動待機の描画制御が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
