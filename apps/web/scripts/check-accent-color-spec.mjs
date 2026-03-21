import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);

const checks = [
  {
    name: "アクセントカラー変数が #687A88 / 白文字 に更新されている",
    ok:
      includes("src/app/globals.css", "--primary: #687a88;") &&
      includes("src/app/globals.css", "--primary-soft: #687a88;") &&
      includes("src/app/globals.css", ".tab-item.is-active {") &&
      includes("src/app/globals.css", "color: #fff;"),
    detail: "globals.css のアクセントカラー定義またはタブアクティブ色が不足しています",
  },
  {
    name: "Button の default variant が #687A88 ベースかつ白文字になっている",
    ok: includes(
      "src/components/ui/button.tsx",
      'default: "bg-[var(--primary)] text-white hover:bg-[#5b6b78] [&_a]:text-white"',
    ),
    detail: "button.tsx の default variant に白文字維持指定が不足しています",
  },
  {
    name: "対象3ボタンが白文字・太字・大きめで default Button を利用している",
    ok:
      includes(
        "src/components/app/screens/HomeTabScreen.tsx",
        '<Button asChild className="w-full justify-start text-left text-base font-bold text-white">',
      ) &&
      includes(
        "src/components/app/screens/TemplatesTabScreen.tsx",
        '<Button asChild className="w-full justify-start text-left text-base font-bold text-white">',
      ) &&
      includes(
        "src/components/app/screens/ClothingsTabScreen.tsx",
        '<Button asChild className="w-full justify-start text-left text-base font-bold text-white">',
      ) &&
      includes("src/components/app/screens/WardrobeCreateScreen.tsx", '<Button type="submit" className="w-full">') &&
      includes(
        "src/components/app/screens/TemplateForm.tsx",
        '<Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isSelectionEmpty || isPending}>',
      ) &&
      includes(
        "src/components/app/screens/ClothingCreateScreen.tsx",
        '<Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isPending}>',
      ) &&
      includes(
        "src/components/app/screens/ClothingEditScreen.tsx",
        '<Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isPending}>',
      ) &&
      includes(
        "src/components/app/screens/RecordByTemplateScreen.tsx",
        '<Button\n            type="submit"\n            className="w-full text-sm font-medium"',
      ) &&
      includes(
        "src/components/app/screens/RecordByCombinationScreen.tsx",
        '<Button\n          type="submit"\n          className="w-full text-sm font-medium"',
      ),
    detail: "対象画面の primary Button 導線または3ボタンの文字スタイル指定が不足しています",
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
