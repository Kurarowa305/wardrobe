import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);
const includesAll = (relativePath, texts) => texts.every((text) => includes(relativePath, text));
const countOccurrences = (relativePath, text) => read(relativePath).split(text).length - 1;

const manifest = JSON.parse(read("public/manifest.webmanifest"));

const checks = [
  {
    id: "PSC-01",
    name: "manifest が start_url を持たずインストール元URLを起動URLにできる",
    ok: !Object.prototype.hasOwnProperty.call(manifest, "start_url"),
    detail: "public/manifest.webmanifest から start_url を削除してください",
  },
  {
    id: "PSC-02",
    name: "manifest がアプリ範囲をルート配下に固定している",
    ok: manifest.scope === "/",
    detail: "public/manifest.webmanifest に scope: \"/\" を定義してください",
  },
  {
    id: "PSC-03",
    name: "manifest の PWA 基本設定とホーム画面アイコンが維持されている",
    ok:
      manifest.id === "/" &&
      manifest.display === "standalone" &&
      manifest.theme_color === "#000000" &&
      Array.isArray(manifest.icons) &&
      manifest.icons.some(
        (icon) =>
          icon.src === "/icons/192.png" &&
          icon.sizes === "192x192" &&
          icon.type === "image/png" &&
          icon.purpose === "any",
      ) &&
      manifest.icons.some(
        (icon) =>
          icon.src === "/icons/512.png" &&
          icon.sizes === "512x512" &&
          icon.type === "image/png" &&
          icon.purpose === "any",
      ),
    detail: "manifest.webmanifest の id/display/theme_color/icons を維持してください",
  },
  {
    id: "PSC-04",
    name: "query 起動時に wardrobeId を保存できる",
    ok:
      includes("src/features/routing/queryParams.ts", "function usePersistWardrobeId(wardrobeId: string | null)") &&
      includes("src/features/routing/queryParams.ts", "writeLastWardrobeId(wardrobeId);") &&
      countOccurrences("src/features/routing/queryParams.ts", "usePersistWardrobeId(wardrobeId);") >= 4 &&
      includes("src/app/home/page.tsx", "const wardrobeId = useWardrobeIdFromQuery();"),
    detail: "queryParams.ts または home/page.tsx の wardrobeId 保存導線が不足しています",
  },
  {
    id: "PSC-05",
    name: "通常のルート起動復帰処理を維持している",
    ok: includesAll("src/app/page.tsx", [
      "const savedWardrobeId = readLastWardrobeId();",
      "await getWardrobe(savedWardrobeId);",
      "router.replace(ROUTES.home(savedWardrobeId));",
    ]),
    detail: "src/app/page.tsx の保存済み wardrobeId 復帰処理が不足しています",
  },
  {
    id: "PSC-06",
    name: "PWA起動URL検証が package.json と CI に登録されている",
    ok:
      includes("package.json", '"test:pwa-start-url-current-page": "node scripts/check-pwa-start-url-current-page-spec.mjs"') &&
      includes("../../.github/workflows/ci.yml", "pnpm --filter web test:pwa-start-url-current-page"),
    detail: "package.json または CI に PWA起動URL検証が登録されていません",
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
