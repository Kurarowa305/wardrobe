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

function read(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
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
  "TanStack Query の依存パッケージが導入されている",
  includes("package.json", '"@tanstack/react-query"') &&
    includes("package.json", '"@tanstack/react-query-devtools"'),
  "apps/web/package.json に TanStack Query 依存が不足しています",
);

check(
  "QF-02",
  "QueryClient 作成ヘルパーが存在し、Query/Mutation の onError 方針を定義している",
  exists("src/lib/query/queryClient.ts") &&
    includes("src/lib/query/queryClient.ts", "new QueryClient") &&
    includes("src/lib/query/queryClient.ts", "new QueryCache") &&
    includes("src/lib/query/queryClient.ts", "new MutationCache") &&
    includes("src/lib/query/queryClient.ts", 'console.error(`[TanStack Query]['),
  "queryClient.ts の生成処理またはエラーハンドリング定義が不足しています",
);

check(
  "QF-03",
  "QueryProvider が QueryClientProvider で children をラップしている",
  exists("src/components/providers/QueryProvider.tsx") &&
    includes("src/components/providers/QueryProvider.tsx", '"use client";') &&
    includes("src/components/providers/QueryProvider.tsx", "QueryClientProvider") &&
    includes("src/components/providers/QueryProvider.tsx", "createQueryClient") &&
    includes("src/components/providers/QueryProvider.tsx", "useState(createQueryClient)") &&
    includes("src/components/providers/QueryProvider.tsx", "<QueryClientProvider client={queryClient}>") &&
    includes("src/components/providers/QueryProvider.tsx", "{children}"),
  "QueryProvider.tsx の Provider 実装が不足しています",
);

check(
  "QF-04",
  "開発時に React Query Devtools を表示できる",
  includes("src/components/providers/QueryProvider.tsx", "ReactQueryDevtools") &&
    includes("src/components/providers/QueryProvider.tsx", 'process.env.NODE_ENV === "development"'),
  "QueryProvider.tsx の Devtools 設定が不足しています",
);

check(
  "QF-05",
  "RootLayout で QueryProvider により全画面をラップしている",
  includes("src/app/layout.tsx", 'import { QueryProvider } from "@/components/providers/QueryProvider";') &&
    includes("src/app/layout.tsx", "<QueryProvider>") &&
    includes("src/app/layout.tsx", "</QueryProvider>"),
  "layout.tsx への QueryProvider 組み込みが不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
