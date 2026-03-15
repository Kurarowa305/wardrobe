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

function collectFiles(dirPath, out = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, out);
      continue;
    }
    out.push(fullPath);
  }
  return out;
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
  "QK-01",
  "QueryKey 集約ファイルが src/api/queryKeys.ts に存在する",
  exists("src/api/queryKeys.ts"),
  "src/api/queryKeys.ts が存在しません",
);

check(
  "QK-02",
  "queryKeys がドメイン別（wardrobe/clothing/template/history/image）で定義される",
  includes("src/api/queryKeys.ts", "export const queryKeys = {") &&
    includes("src/api/queryKeys.ts", "wardrobe: {") &&
    includes("src/api/queryKeys.ts", "clothing: {") &&
    includes("src/api/queryKeys.ts", "template: {") &&
    includes("src/api/queryKeys.ts", "history: {") &&
    includes("src/api/queryKeys.ts", "image: {"),
  "queryKeys のドメイン定義が不足しています",
);

check(
  "QK-03",
  "clothing query key に list/detail と invalidate 用スコープ（lists/details）がある",
  includes("src/api/queryKeys.ts", "lists: (wardrobeId: string) => clothingListScope(wardrobeId),") &&
    includes("src/api/queryKeys.ts", "list: (wardrobeId: string, params: CursorListParams = {}) =>") &&
    includes("src/api/queryKeys.ts", "details: (wardrobeId: string) => clothingDetailScope(wardrobeId),") &&
    includes("src/api/queryKeys.ts", "detail: (wardrobeId: string, clothingId: string) =>"),
  "clothing query key の list/detail 定義が不足しています",
);

check(
  "QK-04",
  "template query key に list/detail と invalidate 用スコープ（lists/details）がある",
  includes("src/api/queryKeys.ts", "lists: (wardrobeId: string) => templateListScope(wardrobeId),") &&
    includes("src/api/queryKeys.ts", "list: (wardrobeId: string, params: CursorListParams = {}) =>") &&
    includes("src/api/queryKeys.ts", "details: (wardrobeId: string) => templateDetailScope(wardrobeId),") &&
    includes("src/api/queryKeys.ts", "detail: (wardrobeId: string, templateId: string) =>"),
  "template query key の list/detail 定義が不足しています",
);

check(
  "QK-05",
  "history query key に list/detail と from/to を含むパラメータ正規化がある",
  includes("src/api/queryKeys.ts", "list: (wardrobeId: string, params: HistoryListParams = {}) =>") &&
    includes("src/api/queryKeys.ts", "normalizeHistoryListParams") &&
    includes("src/api/queryKeys.ts", "from: params.from ?? null,") &&
    includes("src/api/queryKeys.ts", "to: params.to ?? null,"),
  "history query key のパラメータ正規化定義が不足しています",
);

check(
  "QK-06",
  "キー命名が [domain, wardrobeId, scope, ...] の階層で追えるように定義される",
  includes("src/api/queryKeys.ts", "return [domain, wardrobeId] as const;") &&
    includes("src/api/queryKeys.ts", '["wardrobe", wardrobeId, "detail"]') &&
    includes("src/api/queryKeys.ts", '[...clothingScope(wardrobeId), "list"] as const;') &&
    includes("src/api/queryKeys.ts", '[...clothingScope(wardrobeId), "detail"] as const;'),
  "キー階層の定義（domain/wardrobeId/scope）が不足しています",
);

const sourceFiles = collectFiles(path.join(webRoot, "src"))
  .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
  .map((file) => path.relative(webRoot, file).replaceAll(path.sep, "/"))
  .filter((file) => file !== "src/api/queryKeys.ts");

const literalQueryKeyViolations = sourceFiles.filter((file) => {
  const source = read(file);
  return /queryKey\s*:\s*\[/.test(source) || /mutationKey\s*:\s*\[/.test(source);
});

check(
  "QK-07",
  "画面/機能コードで queryKey/mutationKey の配列直書きをしない",
  literalQueryKeyViolations.length === 0,
  `queryKey/mutationKey の直書きが見つかりました: ${literalQueryKeyViolations.join(", ") || "(none)"}`,
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
