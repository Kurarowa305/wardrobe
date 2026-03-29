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

function noIncludes(relPath, unexpected) {
  return !read(relPath).includes(unexpected);
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
  "ARI-01",
  "Next.js 設定が static export ではなく SSR 前提になっている",
  exists("next.config.ts") &&
    includes("next.config.ts", "const nextConfig: NextConfig = {};") &&
    noIncludes("next.config.ts", 'output: "export"'),
  "apps/web/next.config.ts に output: \"export\" が残っているか、SSR前提の設定ではありません",
);

check(
  "ARI-02",
  "MSW 起動判定が NEXT_PUBLIC_ENABLE_MSW フラグに統一されている",
  includes("src/mocks/start.ts", 'return process.env.NEXT_PUBLIC_ENABLE_MSW === "true";'),
  "src/mocks/start.ts の起動判定が NEXT_PUBLIC_ENABLE_MSW ベースになっていません",
);

check(
  "ARI-03",
  "ワードローブ API client が /wardrobes の create/get を提供している",
  exists("src/api/schemas/wardrobe.ts") &&
    exists("src/api/endpoints/wardrobe.ts") &&
    includes("src/api/endpoints/wardrobe.ts", 'return "/wardrobes";') &&
    includes("src/api/endpoints/wardrobe.ts", "export function createWardrobe(") &&
    includes("src/api/endpoints/wardrobe.ts", "export function getWardrobe("),
  "ワードローブ API client（schemas/endpoints）の実装が不足しています",
);

check(
  "ARI-04",
  "ワードローブ作成画面が createWardrobe API の返却 wardrobeId でホーム遷移する",
  includes("src/components/app/screens/WardrobeCreateScreen.tsx", "useCreateWardrobeMutation") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "const created = await createWardrobeMutation.mutateAsync({") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "ROUTES.home(created.wardrobeId)") &&
    noIncludes("src/components/app/screens/WardrobeCreateScreen.tsx", "ROUTES.home(DEMO_IDS.wardrobe)"),
  "ワードローブ作成画面の実API遷移化が不足しています",
);

const runtimeDynamicPages = [
  "src/app/wardrobes/[wardrobeId]/layout.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/clothings/[clothingId]/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/clothings/[clothingId]/edit/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/templates/[templateId]/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/templates/[templateId]/edit/page.tsx",
  "src/app/wardrobes/[wardrobeId]/(stack)/histories/[historyId]/page.tsx",
];

check(
  "ARI-05",
  "動的ページから fixture 依存の generateStaticParams が除去されている",
  runtimeDynamicPages.every((relPath) =>
    noIncludes(relPath, "generateStaticParams") &&
    noIncludes(relPath, "Fixtures") &&
    noIncludes(relPath, "_FIXTURE_") &&
    noIncludes(relPath, "MOCK_") &&
    noIncludes(relPath, "DEMO_IDS"),
  ),
  "動的ページに fixture/static params/defaultId 依存が残っています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
