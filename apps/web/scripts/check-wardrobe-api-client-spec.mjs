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
  "WAC-01",
  "Wardrobe API schema が定義される",
  exists("src/api/schemas/wardrobe.ts") &&
    includes("src/api/schemas/wardrobe.ts", "export type CreateWardrobeRequestDto =") &&
    includes("src/api/schemas/wardrobe.ts", "export type CreateWardrobeResponseDto =") &&
    includes("src/api/schemas/wardrobe.ts", "export type WardrobeDetailResponseDto ="),
  "src/api/schemas/wardrobe.ts の型定義が不足しています",
);

check(
  "WAC-02",
  "Wardrobe endpoint が /wardrobes を使って create/get を実装する",
  exists("src/api/endpoints/wardrobe.ts") &&
    includes("src/api/endpoints/wardrobe.ts", 'const WARDROBE_COLLECTION_PATH = "/wardrobes";') &&
    includes("src/api/endpoints/wardrobe.ts", "apiClient.post<CreateWardrobeResponseDto, CreateWardrobeRequestDto>") &&
    includes("src/api/endpoints/wardrobe.ts", "apiClient.get<WardrobeDetailResponseDto>"),
  "src/api/endpoints/wardrobe.ts の create/get 実装が不足しています",
);

check(
  "WAC-03",
  "Wardrobe hooks が query/mutation を公開する",
  exists("src/api/hooks/wardrobe.ts") &&
    includes("src/api/hooks/wardrobe.ts", "export function useWardrobe(") &&
    includes("src/api/hooks/wardrobe.ts", "useQuery({") &&
    includes("src/api/hooks/wardrobe.ts", "queryKeys.wardrobe.detail(wardrobeId)") &&
    includes("src/api/hooks/wardrobe.ts", "export function useCreateWardrobeMutation()") &&
    includes("src/api/hooks/wardrobe.ts", "useMutation({"),
  "src/api/hooks/wardrobe.ts の query/mutation 公開が不足しています",
);

check(
  "WAC-04",
  "Wardrobe 作成画面が API 返却 wardrobeId を使ってホームへ遷移する",
  includes("src/components/app/screens/WardrobeCreateScreen.tsx", "useCreateWardrobeMutation") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "createWardrobeMutation.mutateAsync({ name: trimmedName })") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "ROUTES.home(created.wardrobeId)") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "OPERATION_TOAST_IDS.wardrobeCreated"),
  "WardrobeCreateScreen.tsx の API連携遷移が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
