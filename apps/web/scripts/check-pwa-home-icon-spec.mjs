import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);
const includesAll = (relativePath, texts) => texts.every((text) => includes(relativePath, text));

const checks = [
  {
    name: "layout metadata が manifest とホーム画面アイコンを公開している",
    ok: includesAll("src/app/layout.tsx", [
      'manifest: "/manifest.webmanifest"',
      "appleWebApp: {",
      "capable: true,",
      'icons: {',
      "icon: [HOME_SCREEN_ICON_192, HOME_SCREEN_ICON_512],",
      "shortcut: [HOME_SCREEN_ICON_192],",
      "apple: [HOME_SCREEN_ICON_192],",
    ]),
    detail: "src/app/layout.tsx に manifest またはホーム画面アイコンの metadata 定義が不足しています",
  },
  {
    name: "layout viewport が PWA 用 theme color を公開している",
    ok: includesAll("src/app/layout.tsx", [
      "export const viewport: Viewport = {",
      'themeColor: "#000000",',
    ]),
    detail: "src/app/layout.tsx に themeColor の viewport 定義が不足しています",
  },
  {
    name: "manifest.webmanifest がホーム画面用アイコンを保持している",
    ok: includesAll("public/manifest.webmanifest", [
      '"id": "/"',
      '"start_url": "/"',
      '"display": "standalone"',
      '"theme_color": "#000000"',
      '{ "src": "/icons/192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" }',
      '{ "src": "/icons/512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }',
    ]),
    detail: "public/manifest.webmanifest のアイコン定義またはPWA設定が不足しています",
  },
  {
    name: "PWA ホーム画面アイコン検証スクリプトが package.json と CI に登録されている",
    ok:
      includes("package.json", '"test:pwa-home-icon": "node scripts/check-pwa-home-icon-spec.mjs"') &&
      includes("../../.github/workflows/ci.yml", "pnpm --filter web test:pwa-home-icon"),
    detail: "package.json または CI に PWA ホーム画面アイコン検証が登録されていません",
  },
];

let hasFailure = false;

for (const check of checks) {
  if (check.ok) {
    console.log(`✅ ${check.name}`);
  } else {
    hasFailure = true;
    console.error(`❌ ${check.name}`);
    console.error(`   ${check.detail}`);
  }
}

if (hasFailure) {
  process.exit(1);
}
