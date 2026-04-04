import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);

const checks = [
  {
    id: "WIG-01",
    name: "wardrobeId のバリデーション関数が wd_ 形式を判定する",
    ok:
      includes("src/api/schemas/wardrobe.ts", "const WARDROBE_ID_PATTERN = /^wd_") &&
      includes("src/api/schemas/wardrobe.ts", "export function isWardrobeId(value: unknown): value is string") &&
      includes("src/api/schemas/wardrobe.ts", "return WARDROBE_ID_PATTERN.test(trimmed);"),
    detail: "src/api/schemas/wardrobe.ts の wardrobeId 判定実装が不足しています",
  },
  {
    id: "WIG-02",
    name: "ワードローブ作成APIレスポンスをランタイム検証する",
    ok:
      includes("src/api/endpoints/wardrobe.ts", "parseCreateWardrobeResponseDto") &&
      includes("src/api/endpoints/wardrobe.ts", "apiClient.post<unknown, CreateWardrobeRequestDto>") &&
      includes("src/api/endpoints/wardrobe.ts", "code: \"INVALID_RESPONSE\"") &&
      includes("src/api/endpoints/wardrobe.ts", "isWardrobeId(value.wardrobeId)"),
    detail: "src/api/endpoints/wardrobe.ts のレスポンス検証が不足しています",
  },
  {
    id: "WIG-03",
    name: "query パラメータ解決が DEMO_IDS へフォールバックしない",
    ok:
      includes("src/features/routing/queryParams.ts", "resolveWardrobeId(searchParams) ?? \"\"") &&
      !includes("src/features/routing/queryParams.ts", "DEMO_IDS.wardrobe") &&
      !includes("src/features/routing/queryParams.ts", "DEMO_IDS.history") &&
      !includes("src/features/routing/queryParams.ts", "DEMO_IDS.template") &&
      !includes("src/features/routing/queryParams.ts", "DEMO_IDS.clothing"),
    detail: "src/features/routing/queryParams.ts に DEMO_IDS フォールバックが残っています",
  },
  {
    id: "WIG-04",
    name: "必須ID欠落時に /wardrobes/new へリダイレクトするガードhookを持つ",
    ok:
      includes("src/features/routing/queryParams.ts", "export function useRedirectToWardrobeNewIfMissing(ids: string[])") &&
      includes("src/features/routing/queryParams.ts", "router.replace(ROUTES.wardrobeNew);") &&
      includes("src/features/routing/queryParams.ts", "const hasMissing = ids.some((value) => value.trim().length === 0);"),
    detail: "queryParams.ts の欠落IDリダイレクトガードが不足しています",
  },
  {
    id: "WIG-05",
    name: "query 解決ページが欠落IDガードを利用する",
    ok:
      [
        "src/app/home/page.tsx",
        "src/app/histories/page.tsx",
        "src/app/templates/page.tsx",
        "src/app/clothings/page.tsx",
        "src/app/record/page.tsx",
        "src/app/record/template/page.tsx",
        "src/app/record/combination/page.tsx",
        "src/app/templates/new/page.tsx",
        "src/app/templates/detail/page.tsx",
        "src/app/templates/edit/page.tsx",
        "src/app/clothings/new/page.tsx",
        "src/app/clothings/detail/page.tsx",
        "src/app/clothings/edit/page.tsx",
        "src/app/histories/detail/page.tsx",
      ].every((file) => includes(file, "useRedirectToWardrobeNewIfMissing")),
    detail: "一部の query 解決ページで欠落IDガードが使われていません",
  },
  {
    id: "WIG-06",
    name: "query 解決ページの Suspense fallback が DEMO_IDS.wardrobe を使わない",
    ok:
      [
        "src/app/home/page.tsx",
        "src/app/histories/page.tsx",
        "src/app/templates/page.tsx",
        "src/app/clothings/page.tsx",
        "src/app/record/page.tsx",
        "src/app/record/template/page.tsx",
        "src/app/record/combination/page.tsx",
        "src/app/templates/new/page.tsx",
        "src/app/templates/detail/page.tsx",
        "src/app/templates/edit/page.tsx",
        "src/app/clothings/new/page.tsx",
        "src/app/clothings/detail/page.tsx",
        "src/app/clothings/edit/page.tsx",
        "src/app/histories/detail/page.tsx",
      ].every((file) => !includes(file, "DEMO_IDS.wardrobe")),
    detail: "query 解決ページの fallback に DEMO_IDS.wardrobe が残っています",
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
