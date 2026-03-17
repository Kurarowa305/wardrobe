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

const resolverTarget = "src/features/clothing/imageUrl.ts";
const listScreen = "src/components/app/screens/ClothingsTabScreen.tsx";
const detailScreen = "src/components/app/screens/ClothingDetailScreen.tsx";

check(
  "IUR-01",
  "imageKey から表示URLを解決する共通関数が存在する",
  exists(resolverTarget) &&
    includes(resolverTarget, "export function resolveImageUrl(imageKey: string | null | undefined): string | null {"),
  "共通の resolveImageUrl 関数が見つかりません",
);

check(
  "IUR-02",
  "表示URL解決は NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL を参照し、既定値 /images を持つ",
  includes(resolverTarget, 'const DEFAULT_IMAGE_PUBLIC_BASE_URL = "/images";') &&
    includes(resolverTarget, "process.env.NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL?.trim()"),
  "画像表示URLのベース設定（環境変数/既定値）が不足しています",
);

check(
  "IUR-03",
  "表示URL解決は空の imageKey を null 扱いし、path segment をエンコードする",
  includes(resolverTarget, 'if (typeof imageKey !== "string") {') &&
    includes(resolverTarget, "if (normalizedImageKey.length === 0) {") &&
    includes(resolverTarget, ".map((segment) => encodeURIComponent(segment))"),
  "imageKey のバリデーションまたはURLエンコード処理が不足しています",
);

check(
  "IUR-04",
  "服一覧画面のサムネ表示が resolveImageUrl を使い、no image フォールバックを持つ",
  includes(listScreen, 'import { resolveImageUrl } from "@/features/clothing/imageUrl";') &&
    includes(listScreen, "const imageUrl = resolveImageUrl(item.imageKey);") &&
    includes(listScreen, "<img") &&
    includes(listScreen, "COMMON_STRINGS.placeholders.noImage"),
  "服一覧画面での resolveImageUrl 利用または no image フォールバックが不足しています",
);

check(
  "IUR-05",
  "服詳細画面の画像表示が resolveImageUrl を使い、no image フォールバックを持つ",
  includes(detailScreen, 'import { resolveImageUrl } from "@/features/clothing/imageUrl";') &&
    includes(detailScreen, "const imageUrl = resolveImageUrl(clothingQuery.data?.imageKey);") &&
    includes(detailScreen, "<img") &&
    includes(detailScreen, "COMMON_STRINGS.placeholders.noImage"),
  "服詳細画面での resolveImageUrl 利用または no image フォールバックが不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
