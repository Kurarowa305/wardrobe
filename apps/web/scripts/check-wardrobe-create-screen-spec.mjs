import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);
const noIncludes = (relativePath, text) => !read(relativePath).includes(text);

const checks = [
  {
    id: "WC-01",
    name: "ワードローブ作成画面でヘッダーを非表示にしている",
    ok: includes("src/components/app/screens/WardrobeCreateScreen.tsx", "showHeader={false}"),
    detail: "WardrobeCreateScreen.tsx で showHeader={false} が指定されていません",
  },
  {
    id: "WC-02",
    name: "アクセントカラーの大きなタイトルを表示している",
    ok:
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", "WARDROBE_STRINGS.create.heroTitle") &&
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", 'text-3xl font-bold leading-tight text-[var(--primary)]'),
    detail: "大きなアクセントカラータイトルの実装が不足しています",
  },
  {
    id: "WC-03",
    name: "タイトルの直下に入力欄を配置している",
    ok:
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", '<section className="grid gap-8 px-1 py-8">') &&
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", '<div className="grid gap-3">') &&
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", '<form className="grid gap-4" onSubmit={handleSubmit}>'),
    detail: "タイトル直下にフォームを配置する構成になっていません",
  },
  {
    id: "WC-04",
    name: "ワードローブ作成画面から ScreenCard を除去している",
    ok:
      noIncludes("src/components/app/screens/WardrobeCreateScreen.tsx", 'import { ScreenCard }') &&
      noIncludes("src/components/app/screens/WardrobeCreateScreen.tsx", "<ScreenCard") &&
      noIncludes("src/components/app/screens/WardrobeCreateScreen.tsx", "</ScreenCard>"),
    detail: "WardrobeCreateScreen.tsx に ScreenCard が残っています",
  },
  {
    id: "WC-05",
    name: "文言定義にヒーロータイトルと補助文言が追加されている",
    ok:
      includes("src/features/wardrobe/strings.ts", 'heroTitle: "あなたのワードローブを作成しましょう"') &&
      includes("src/features/wardrobe/strings.ts", 'description: "まずはワードローブ名を入力して、管理を始めましょう。"'),
    detail: "features/wardrobe/strings.ts に必要な文言が定義されていません",
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
