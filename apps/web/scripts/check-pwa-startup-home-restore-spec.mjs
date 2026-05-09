import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);
const includesAll = (relativePath, texts) => texts.every((text) => includes(relativePath, text));
const countOccurrences = (relativePath, text) => read(relativePath).split(text).length - 1;

const checks = [
  {
    id: "SHR-01",
    name: "query 解決hookが有効な wardrobeId を保存する",
    ok:
      includes("src/features/routing/queryParams.ts", "function usePersistWardrobeId(wardrobeId: string | null)") &&
      includes("src/features/routing/queryParams.ts", "writeLastWardrobeId(wardrobeId);") &&
      countOccurrences("src/features/routing/queryParams.ts", "const wardrobeId = resolveWardrobeId(searchParams);") >= 4 &&
      countOccurrences("src/features/routing/queryParams.ts", "usePersistWardrobeId(wardrobeId);") >= 4,
    detail: "src/features/routing/queryParams.ts に wardrobeId 保存処理の共通化が不足しています",
  },
  {
    id: "SHR-02",
    name: "ワードローブ作成成功時に新規 wardrobeId を保存してからホームへ遷移する",
    ok: includesAll("src/components/app/screens/WardrobeCreateScreen.tsx", [
      'import { writeLastWardrobeId } from "@/features/routing/lastWardrobeStorage";',
      "writeLastWardrobeId(created.wardrobeId);",
      "ROUTES.home(created.wardrobeId)",
    ]),
    detail: "WardrobeCreateScreen.tsx の保存または遷移処理が不足しています",
  },
  {
    id: "SHR-03",
    name: "ルートページが保存済み wardrobeId を読んでホームへ replace 遷移する",
    ok: includesAll("src/app/page.tsx", [
      '"use client";',
      "const savedWardrobeId = readLastWardrobeId();",
      "await getWardrobe(savedWardrobeId);",
      "router.replace(ROUTES.home(savedWardrobeId));",
    ]),
    detail: "src/app/page.tsx に保存済み wardrobeId のホーム復帰処理が不足しています",
  },
  {
    id: "SHR-04",
    name: "保存IDなしではルートページが新規作成画面へ replace 遷移する",
    ok: includesAll("src/app/page.tsx", [
      "if (!savedWardrobeId) {",
      "router.replace(ROUTES.wardrobeNew);",
    ]),
    detail: "src/app/page.tsx に保存ID欠落時の新規作成フォールバックが不足しています",
  },
  {
    id: "SHR-05",
    name: "保存IDの wardrobe 取得が404の時だけ保存をクリアして新規作成へフォールバックする",
    ok: includesAll("src/app/page.tsx", [
      "if (isAppError(error) && error.status === 404) {",
      "clearLastWardrobeId();",
      "router.replace(ROUTES.wardrobeNew);",
    ]),
    detail: "src/app/page.tsx の 404 フォールバックまたは保存クリアが不足しています",
  },
  {
    id: "SHR-06",
    name: "PWA再起動ホーム復帰検証が package.json と CI に登録されている",
    ok:
      includes("package.json", '"test:pwa-startup-home-restore": "node scripts/check-pwa-startup-home-restore-spec.mjs"') &&
      includes("../../.github/workflows/ci.yml", "pnpm --filter web test:pwa-startup-home-restore"),
    detail: "package.json または CI に PWA再起動ホーム復帰検証が登録されていません",
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
