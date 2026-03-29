import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);
const exists = (relativePath) => fs.existsSync(path.join(repoRoot, relativePath));

const checks = [
  {
    id: "WAF-01",
    name: "ワードローブ作成APIクライアントを実装している",
    ok:
      exists("src/api/endpoints/wardrobe.ts") &&
      includes("src/api/endpoints/wardrobe.ts", 'const WARDROBE_COLLECTION_PATH = "/wardrobes";') &&
      includes("src/api/endpoints/wardrobe.ts", "export function createWardrobe(") &&
      includes("src/api/endpoints/wardrobe.ts", "apiClient.post<CreateWardrobeResponseDto"),
    detail: "src/api/endpoints/wardrobe.ts の作成APIクライアント実装が不足しています",
  },
  {
    id: "WAF-02",
    name: "ワードローブ作成Mutation hookを実装している",
    ok:
      exists("src/api/hooks/wardrobe.ts") &&
      includes("src/api/hooks/wardrobe.ts", "export function useCreateWardrobeMutation()") &&
      includes("src/api/hooks/wardrobe.ts", "mutationFn: (body: CreateWardrobeRequestDto) => createWardrobe(body)"),
    detail: "src/api/hooks/wardrobe.ts の Mutation hook 実装が不足しています",
  },
  {
    id: "WAF-03",
    name: "作成画面がMutation hookを使って作成APIを呼び出す",
    ok:
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", 'import { useCreateWardrobeMutation } from "@/api/hooks/wardrobe";') &&
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", "const createWardrobeMutation = useCreateWardrobeMutation();") &&
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", "const created = await createWardrobeMutation.mutateAsync({"),
    detail: "WardrobeCreateScreen.tsx が作成APIを呼び出していません",
  },
  {
    id: "WAF-04",
    name: "作成成功時にAPIレスポンスのwardrobeIdでホームへ遷移する",
    ok:
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", "ROUTES.home(created.wardrobeId)") &&
      !includes("src/components/app/screens/WardrobeCreateScreen.tsx", "DEMO_IDS.wardrobe"),
    detail: "作成成功遷移で固定IDが使われています",
  },
  {
    id: "WAF-05",
    name: "MSWにPOST /wardrobesハンドラが実装されている",
    ok:
      exists("src/mocks/handlers/wardrobe.ts") &&
      includes("src/mocks/handlers/wardrobe.ts", 'http.post("*/wardrobes"') &&
      includes("src/mocks/handlers/wardrobe.ts", "wardrobeId") &&
      includes("src/mocks/handlers/wardrobe.ts", "status: 201"),
    detail: "MSWのワードローブ作成ハンドラが不足しています",
  },
  {
    id: "WAF-06",
    name: "MSW handlers集約にワードローブハンドラを登録している",
    ok:
      includes("src/mocks/handlers/index.ts", 'import { wardrobeHandlers } from "./wardrobe";') &&
      includes("src/mocks/handlers/index.ts", "handlers.push(...wardrobeHandlers);"),
    detail: "src/mocks/handlers/index.ts にワードローブハンドラ登録がありません",
  },
  {
    id: "WAF-07",
    name: "新規テストスクリプトがpackage.jsonとCIに登録されている",
    ok:
      includes("package.json", '"test:wardrobe-create-api-flow": "node scripts/check-wardrobe-create-api-flow-spec.mjs"') &&
      includes("../../.github/workflows/ci.yml", "Wardrobe create API flow spec test") &&
      includes("../../.github/workflows/ci.yml", "pnpm --filter web test:wardrobe-create-api-flow"),
    detail: "package.json または CI へのテスト登録が不足しています",
  },
];

let hasFailure = false;
for (const check of checks) {
  if (check.ok) {
    console.log(`PASS ${check.id}: ${check.name}`);
  } else {
    hasFailure = true;
    console.error(`FAIL ${check.id}: ${check.name}`);
    console.error(`  ${check.detail}`);
  }
}

if (hasFailure) {
  process.exit(1);
}
