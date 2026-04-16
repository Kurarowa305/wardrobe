import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..", "..");

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

function repoIncludes(relPath, expected) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8").includes(expected);
}

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }

  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

const detailTarget = "src/components/app/screens/ClothingDetailScreen.tsx";
const packageTarget = "package.json";
const ciTarget = ".github/workflows/ci.yml";

check(
  "CDIL-01",
  "服詳細画像が横幅いっぱい・縦横比維持で画像単体表示される",
  includes(detailTarget, 'className="block w-full h-auto rounded-md"') &&
    !includes(detailTarget, "max-h-[60dvh]") &&
    !includes(detailTarget, "object-cover"),
  "服詳細画像の横幅維持・比率追従表示、または高さ上限制限の除去が不足しています",
);

check(
  "CDIL-02",
  "服詳細画像が専用ラッパーなしで表示される",
  !includes(detailTarget, 'className="flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 p-2"'),
  "服詳細画像の背景付きラッパーが残っています",
);

check(
  "CDIL-03",
  "画像未設定時に no image プレースホルダを維持する",
  includes(detailTarget, 'className="flex h-48 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600"') &&
    includes(detailTarget, "COMMON_STRINGS.placeholders.noImage"),
  "画像未設定時のプレースホルダ実装が不足しています",
);

check(
  "CDIL-04",
  "新規テストスクリプトが package.json と CI workflow に登録されている",
  includes(packageTarget, '"test:clothing-detail-image-layout": "node scripts/check-clothing-detail-image-layout-spec.mjs"') &&
    repoIncludes(ciTarget, "pnpm --filter web test:clothing-detail-image-layout"),
  "package.json または CI workflow へのテスト登録が不足しています",
);

check(
  "CDIL-05",
  "既存の詳細表示ロジックとして resolveImageUrl・エラー表示・削除済み表示・利用情報表示が維持される",
  includes(detailTarget, "const imageUrl = resolveImageUrl(clothingQuery.data?.imageKey);") &&
    includes(detailTarget, "resolveErrorMessage(clothingQuery.error)") &&
    includes(detailTarget, "CLOTHING_STRINGS.detail.messages.deleted") &&
    includes(detailTarget, "CLOTHING_STRINGS.detail.labels.wearCount") &&
    includes(detailTarget, "CLOTHING_STRINGS.detail.labels.lastWornAt") &&
    includes(detailTarget, "formatLastWornDate(clothingQuery.data.lastWornAt, CLOTHING_STRINGS.detail.messages.neverWorn)"),
  "既存の詳細表示ロジックの維持確認が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
