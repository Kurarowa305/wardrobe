import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const normalizeWhitespace = (value) => value.replace(/\s+/g, " ").trim();
const includes = (relativePath, text) => read(relativePath).includes(text);
const includesNormalized = (relativePath, text) =>
  normalizeWhitespace(read(relativePath)).includes(normalizeWhitespace(text));
const excludesNormalized = (relativePath, text) =>
  !normalizeWhitespace(read(relativePath)).includes(normalizeWhitespace(text));

const checks = [
  {
    name: "アクセントカラー変数が #687A88 / 白文字 に更新されている",
    ok:
      includes("src/app/globals.css", "--primary: #687a88;") &&
      includes("src/app/globals.css", "--primary-soft: #687a88;") &&
      includes("src/app/globals.css", ".tab-item.is-active {") &&
      includes("src/app/globals.css", "color: #fff;"),
    detail:
      "globals.css のアクセントカラー定義またはタブアクティブ色が不足しています",
  },
  {
    name: "Button の default variant が #687A88 ベースかつ白文字になっている",
    ok:
      includes(
        "src/components/ui/button.tsx",
        'default: "bg-[var(--primary)] text-white hover:bg-[#5b6b78]"',
      ) &&
      includes("src/app/globals.css", '[data-slot="button"].text-white {') &&
      includes("src/app/globals.css", "color: #fff;"),
    detail:
      "button.tsx の default variant または text-white 補強スタイルが不足しています",
  },
  {
    name: "global の a 色上書きが Button 文字色を打ち消さない",
    ok: excludesNormalized("src/app/globals.css", "a { color: inherit; }"),
    detail:
      "globals.css に a の color 上書きが残っており、text-white を打ち消す可能性があります",
  },
  {
    name: "対象導線が現行仕様の default Button（非太字）を利用している",
    ok:
      includes(
        "src/components/app/screens/HomeTabScreen.tsx",
        '<Button asChild className="w-full justify-start text-left text-base text-white">',
      ) &&
      excludesNormalized(
        "src/components/app/screens/HomeTabScreen.tsx",
        '<Button asChild className="w-full justify-start text-left text-base font-bold text-white">',
      ) &&
      includes(
        "src/components/app/screens/TemplatesTabScreen.tsx",
        '<Button asChild className="w-full justify-start text-left text-base text-white">',
      ) &&
      excludesNormalized(
        "src/components/app/screens/TemplatesTabScreen.tsx",
        '<Button asChild className="w-full justify-start text-left text-base font-bold text-white">',
      ) &&
      includes(
        "src/components/app/screens/ClothingsTabScreen.tsx",
        '<Button asChild className="w-full justify-start text-left text-base text-white">',
      ) &&
      excludesNormalized(
        "src/components/app/screens/ClothingsTabScreen.tsx",
        '<Button asChild className="w-full justify-start text-left text-base font-bold text-white">',
      ) &&
      includesNormalized(
        "src/components/app/screens/WardrobeCreateScreen.tsx",
        '<Button type="submit" className="w-full" disabled={isSubmitDisabled}>',
      ) &&
      includesNormalized(
        "src/components/app/screens/TemplateForm.tsx",
        '<Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isSelectionEmpty || isPending}',
      ) &&
      includesNormalized(
        "src/components/app/screens/ClothingCreateScreen.tsx",
        '<Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isPending}>',
      ) &&
      includesNormalized(
        "src/components/app/screens/ClothingEditScreen.tsx",
        '<Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isPending}>',
      ) &&
      includesNormalized(
        "src/components/app/screens/RecordByTemplateScreen.tsx",
        '<Button type="submit" className="w-full text-sm font-medium"',
      ) &&
      includesNormalized(
        "src/components/app/screens/RecordByCombinationScreen.tsx",
        '<Button type="submit" className="w-full text-sm font-medium"',
      ),
    detail:
      "対象画面の primary Button 導線が現行仕様と一致していません",
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
