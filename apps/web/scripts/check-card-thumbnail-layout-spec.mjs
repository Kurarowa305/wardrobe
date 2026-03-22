import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function includes(relativePath, snippet) {
  return read(relativePath).includes(snippet);
}

const results = [];

function check(id, description, passed, detail) {
  results.push({ id, description, passed, detail });
}

const railTarget = "src/components/app/shared/ThumbnailRail.tsx";
const historyTarget = "src/components/app/history/HistoryCard.tsx";
const templatesTarget = "src/components/app/screens/TemplatesTabScreen.tsx";
const recordTarget = "src/components/app/screens/RecordByTemplateScreen.tsx";
const packageTarget = "package.json";
const ciTarget = "../../.github/workflows/ci.yml";

check(
  "CTL-01",
  "共通 ThumbnailRail コンポーネントが存在し、必要 props を受け取る",
  exists(railTarget) &&
    includes(railTarget, "export function ThumbnailRail({") &&
    includes(railTarget, "items,") &&
    includes(railTarget, "deletedLabel,") &&
    includes(railTarget, "thumbnailAltSuffix,") &&
    includes(railTarget, "limit = DEFAULT_THUMBNAIL_LIMIT,"),
  "ThumbnailRail.tsx または必要props定義が不足しています",
);

check(
  "CTL-02",
  "5枠横並びで収まる固定サイズと非折り返しレイアウトを持つ",
  includes(
    railTarget,
    'const THUMBNAIL_SLOT_SIZE = "h-10 w-10 sm:h-12 sm:w-12";',
  ) &&
    includes(
      railTarget,
      'const THUMBNAIL_RAIL_CLASS_NAME = "flex flex-nowrap gap-1.5 overflow-hidden";',
    ),
  "5枠横並びレイアウト用の固定サイズまたは flex-nowrap 設定が不足しています",
);

check(
  "CTL-03",
  "サムネイル最大4件と超過分 +x 表示を持つ",
  includes(railTarget, "const DEFAULT_THUMBNAIL_LIMIT = 4;") &&
    includes(railTarget, "const visibleItems = items.slice(0, limit);") &&
    includes(
      railTarget,
      "const hiddenCount = Math.max(items.length - limit, 0);",
    ) &&
    includes(railTarget, "+{hiddenCount}"),
  "サムネイル最大4件または +x 表示ロジックが不足しています",
);

check(
  "CTL-04",
  "履歴カードが共通サムネイルレールを利用する",
  includes(
    historyTarget,
    'import { ThumbnailRail } from "@/components/app/shared/ThumbnailRail";',
  ) &&
    includes(historyTarget, "<ThumbnailRail") &&
    includes(historyTarget, "const HISTORY_THUMBNAIL_LIMIT = 4;"),
  "履歴カードの ThumbnailRail 利用または件数上限定義が不足しています",
);

check(
  "CTL-05",
  "テンプレート一覧とテンプレート記録画面が共通サムネイルレールを利用する",
  includes(
    templatesTarget,
    'import { ThumbnailRail } from "@/components/app/shared/ThumbnailRail";',
  ) &&
    includes(templatesTarget, "<ThumbnailRail") &&
    includes(templatesTarget, "const TEMPLATE_THUMBNAIL_LIMIT = 4;") &&
    includes(
      recordTarget,
      'import { ThumbnailRail } from "@/components/app/shared/ThumbnailRail";',
    ) &&
    includes(recordTarget, "<ThumbnailRail") &&
    includes(recordTarget, "const TEMPLATE_THUMBNAIL_LIMIT = 4;"),
  "テンプレート系画面の ThumbnailRail 利用または件数上限定義が不足しています",
);

check(
  "CTL-06",
  "テストスクリプトが package.json と CI に登録される",
  includes(
    packageTarget,
    '"test:card-thumbnail-layout": "node scripts/check-card-thumbnail-layout-spec.mjs"',
  ) && includes(ciTarget, "pnpm --filter web test:card-thumbnail-layout"),
  "package.json または CI への card-thumbnail-layout テスト登録が不足しています",
);

const failed = results.filter((result) => !result.passed);

for (const result of results) {
  const prefix = result.passed ? "PASS" : "FAIL";
  console.log(`${prefix} ${result.id}: ${result.description}`);
  if (!result.passed) {
    console.log(`  ${result.detail}`);
  }
}

if (failed.length > 0) {
  process.exitCode = 1;
}
