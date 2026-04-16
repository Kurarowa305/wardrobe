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
  "HWT-01",
  "useWardrobeDetail が queryKeys.wardrobe.detail と getWardrobe を利用する",
  includes("src/api/hooks/wardrobe.ts", "export function useWardrobeDetail(wardrobeId: string) {") &&
    includes("src/api/hooks/wardrobe.ts", "queryKey: queryKeys.wardrobe.detail(wardrobeId),") &&
    includes("src/api/hooks/wardrobe.ts", "queryFn: () => getWardrobe(wardrobeId),") &&
    includes("src/api/hooks/wardrobe.ts", "enabled: wardrobeId.length > 0,"),
  "src/api/hooks/wardrobe.ts のワードローブ詳細 query hook 実装が不足しています",
);

check(
  "HWT-02",
  "getWardrobe が GET /wardrobes/{wardrobeId} を呼び name を検証する",
  includes("src/api/endpoints/wardrobe.ts", "export function getWardrobe(wardrobeId: string): Promise<WardrobeDetailResponseDto> {") &&
    includes("src/api/endpoints/wardrobe.ts", "return `${WARDROBE_COLLECTION_PATH}/${wardrobeId}`;") &&
    includes("src/api/endpoints/wardrobe.ts", ".get<unknown>(buildWardrobeDetailPath(wardrobeId))") &&
    includes("src/api/endpoints/wardrobe.ts", 'message: "ワードローブ取得APIのレスポンス形式が不正です。"') &&
    includes("src/api/endpoints/wardrobe.ts", `expected: '{ "name": "My Wardrobe" }'`) &&
    includes("src/api/endpoints/wardrobe.ts", 'if (isRecord(value) && typeof value.name === "string") {'),
  "src/api/endpoints/wardrobe.ts の詳細取得API実装または name 検証が不足しています",
);

check(
  "HWT-03",
  "HomeTabScreen が useWardrobeDetail を呼び出す",
  includes("src/components/app/screens/HomeTabScreen.tsx", 'import { useWardrobeDetail } from "@/api/hooks/wardrobe";') &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "const wardrobeQuery = useWardrobeDetail(wardrobeId);"),
  "HomeTabScreen.tsx でワードローブ詳細取得 hook が使われていません",
);

check(
  "HWT-04",
  "ホームの AppLayout タイトルが成功時のみワードローブ名で、それ以外は空文字になる",
  includes("src/components/app/screens/HomeTabScreen.tsx", 'title: wardrobeQuery.data?.name ?? "",') &&
    noIncludes("src/components/app/screens/HomeTabScreen.tsx", "title: HOME_STRINGS.titlePlaceholder"),
  "HomeTabScreen.tsx のタイトル決定ロジックが仕様と一致しません",
);

check(
  "HWT-05",
  "HOME_STRINGS.titlePlaceholder が残っていない",
  noIncludes("src/features/home/strings.ts", "titlePlaceholder"),
  "src/features/home/strings.ts に旧プレースホルダー定義が残っています",
);

check(
  "HWT-06",
  "package script と CI に新規テストが接続されている",
  includes("package.json", '"test:home-header-wardrobe-title": "node scripts/check-home-header-wardrobe-title-spec.mjs"') &&
    includes("../../.github/workflows/ci.yml", "Home header wardrobe title spec test") &&
    includes("../../.github/workflows/ci.yml", "pnpm --filter web test:home-header-wardrobe-title"),
  "package.json または CI へのホームヘッダー用テスト接続が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
