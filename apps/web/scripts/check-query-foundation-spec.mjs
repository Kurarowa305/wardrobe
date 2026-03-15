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
  "QF-01",
  "web package に TanStack Query 依存が追加されている",
  includes("package.json", '"@tanstack/react-query"'),
  "apps/web/package.json に @tanstack/react-query が見つかりません",
);

check(
  "QF-02",
  "RootLayout が AppProviders で全体をラップしている",
  includes("src/app/layout.tsx", 'import { AppProviders } from "@/lib/providers/AppProviders";') &&
    includes("src/app/layout.tsx", "<AppProviders>") &&
    includes("src/app/layout.tsx", "</AppProviders>") &&
    includes("src/app/layout.tsx", "<Toaster />"),
  "src/app/layout.tsx に AppProviders の導入が不足しています",
);

check(
  "QF-03",
  "AppProviders が QueryClientProvider を初期化している",
  exists("src/lib/providers/AppProviders.tsx") &&
    includes("src/lib/providers/AppProviders.tsx", '"use client";') &&
    includes("src/lib/providers/AppProviders.tsx", "QueryClientProvider") &&
    includes("src/lib/providers/AppProviders.tsx", "createAppQueryClient") &&
    includes("src/lib/providers/AppProviders.tsx", "useState(() => createAppQueryClient())"),
  "src/lib/providers/AppProviders.tsx の Provider 初期化実装が不足しています",
);

check(
  "QF-04",
  "queryClient で Query/Mutation のエラーハンドリング下地が定義されている",
  exists("src/lib/queryClient.ts") &&
    includes("src/lib/queryClient.ts", "new QueryCache({") &&
    includes("src/lib/queryClient.ts", "new MutationCache({") &&
    includes("src/lib/queryClient.ts", 'logReactQueryError("query"') &&
    includes("src/lib/queryClient.ts", 'logReactQueryError("mutation"'),
  "src/lib/queryClient.ts のエラーハンドリング定義が不足しています",
);

check(
  "QF-05",
  "queryClient の defaultOptions が定義されている",
  includes("src/lib/queryClient.ts", "defaultOptions:") &&
    includes("src/lib/queryClient.ts", "staleTime: DEFAULT_STALE_TIME_MS") &&
    includes("src/lib/queryClient.ts", "retry: 1") &&
    includes("src/lib/queryClient.ts", "retry: 0") &&
    includes("src/lib/queryClient.ts", "refetchOnWindowFocus: false"),
  "src/lib/queryClient.ts の defaultOptions 設定が不足しています",
);

check(
  "QF-06",
  "開発時にキャッシュ状態を確認できる導線がある",
  includes("src/lib/providers/AppProviders.tsx", "window.__WARDROBE_QUERY_CLIENT__ = queryClient") &&
    includes("src/lib/providers/AppProviders.tsx", "getQueryCache().subscribe") &&
    includes("src/lib/providers/AppProviders.tsx", 'console.debug("[tanstack-query:cache]"'),
  "AppProviders の開発向けキャッシュ観測導線が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
