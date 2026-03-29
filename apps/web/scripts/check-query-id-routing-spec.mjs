import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

function read(relPath) {
  return fs.readFileSync(path.join(webRoot, relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(webRoot, relPath));
}

function includes(relPath, snippet) {
  return read(relPath).includes(snippet);
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
  "QIR-01",
  "ROUTES が固定パス + query パラメータ構築ヘルパーで定義される",
  includes("src/constants/routes.ts", "function buildPathWithQuery(") &&
    includes("src/constants/routes.ts", 'home: (wardrobeId: string) =>') &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/home",') &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/histories",') &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/templates",') &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/clothings",') &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/record",'),
  "routes.ts の query ルーティング構築が不足しています",
);

check(
  "QIR-02",
  "詳細/編集導線がIDを query パラメータへ載せる",
  includes("src/constants/routes.ts", "ROUTE_QUERY_KEYS") &&
    includes("src/constants/routes.ts", "historyId") &&
    includes("src/constants/routes.ts", "templateId") &&
    includes("src/constants/routes.ts", "clothingId") &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/histories/detail",') &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/templates/detail",') &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/templates/edit",') &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/clothings/detail",') &&
    includes("src/constants/routes.ts", 'buildPathWithQuery("/clothings/edit",'),
  "ID query 付き詳細/編集URLの組み立てが不足しています",
);

check(
  "QIR-03",
  "operation toast 付与時に既存queryを保持したまま toast を追加できる",
  includes("src/features/toast/operationToast.ts", "new URL(pathname, \"https://wardrobe.local\")") &&
    includes("src/features/toast/operationToast.ts", "url.searchParams.set(OPERATION_TOAST_QUERY_KEY, toastId);") &&
    includes("src/features/toast/operationToast.ts", "const search = url.searchParams.toString();"),
  "operationToast.ts の query 維持ロジックが不足しています",
);

check(
  "QIR-04",
  "query パラメータ解決用の共通hookが存在する",
  exists("src/features/routing/queryParams.ts") &&
    includes("src/features/routing/queryParams.ts", "useWardrobeIdFromQuery") &&
    includes("src/features/routing/queryParams.ts", "useHistoryRouteIdsFromQuery") &&
    includes("src/features/routing/queryParams.ts", "useTemplateRouteIdsFromQuery") &&
    includes("src/features/routing/queryParams.ts", "useClothingRouteIdsFromQuery"),
  "queryParams.ts の共通hook定義が不足しています",
);

check(
  "QIR-05",
  "新しい固定パス page.tsx 群が存在し、旧 wardrobeId 動的ルートは除去される",
  [
    "src/app/home/page.tsx",
    "src/app/histories/page.tsx",
    "src/app/histories/detail/page.tsx",
    "src/app/templates/page.tsx",
    "src/app/templates/new/page.tsx",
    "src/app/templates/detail/page.tsx",
    "src/app/templates/edit/page.tsx",
    "src/app/clothings/page.tsx",
    "src/app/clothings/new/page.tsx",
    "src/app/clothings/detail/page.tsx",
    "src/app/clothings/edit/page.tsx",
    "src/app/record/page.tsx",
    "src/app/record/template/page.tsx",
    "src/app/record/combination/page.tsx",
  ].every((file) => exists(file)) && !exists("src/app/wardrobes/[wardrobeId]"),
  "固定パスpageの不足、または旧動的ルートの残存があります",
);

check(
  "QIR-06",
  "トップレベル4タブページが Suspense + wardrobeId query 解決を行う",
  ["src/app/home/page.tsx", "src/app/histories/page.tsx", "src/app/templates/page.tsx", "src/app/clothings/page.tsx"].every(
    (file) => includes(file, '"use client";') && includes(file, "<Suspense") && includes(file, "useWardrobeIdFromQuery"),
  ),
  "タブページの query 解決実装が不足しています",
);

check(
  "QIR-07",
  "詳細ページが wardrobeId + 各IDを query から解決する",
  includes("src/app/histories/detail/page.tsx", "useHistoryRouteIdsFromQuery") &&
    includes("src/app/templates/detail/page.tsx", "useTemplateRouteIdsFromQuery") &&
    includes("src/app/templates/edit/page.tsx", "useTemplateRouteIdsFromQuery") &&
    includes("src/app/clothings/detail/page.tsx", "useClothingRouteIdsFromQuery") &&
    includes("src/app/clothings/edit/page.tsx", "useClothingRouteIdsFromQuery"),
  "詳細/編集ページの query ID 解決が不足しています",
);

check(
  "QIR-08",
  "新規テストスクリプトが package.json と CI に登録される",
  includes("package.json", '"test:query-id-routing": "node scripts/check-query-id-routing-spec.mjs"') &&
    includes("../../.github/workflows/ci.yml", "Query ID routing spec test") &&
    includes("../../.github/workflows/ci.yml", "pnpm --filter web test:query-id-routing"),
  "package.json または CI へのテスト登録が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
