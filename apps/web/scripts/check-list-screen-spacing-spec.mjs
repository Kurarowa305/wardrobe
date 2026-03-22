import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const failures = [];
let checkCount = 0;
const abs = (relPath) => path.join(webRoot, relPath);
const read = (relPath) => fs.readFileSync(abs(relPath), "utf8");
const includes = (relPath, expected) => read(relPath).includes(expected);
function check(id, description, passed, detail) { checkCount += 1; if (passed) { console.log(`PASS ${id}: ${description}`); return; } failures.push(`FAIL ${id}: ${description}\n  ${detail}`); }
const historyTarget = "src/components/app/screens/HistoriesTabScreen.tsx";
const templateTarget = "src/components/app/screens/TemplatesTabScreen.tsx";
const clothingTarget = "src/components/app/screens/ClothingsTabScreen.tsx";
check("LSS-01", "履歴一覧画面の『さらに読み込む』ボタンに上余白が設定されている", includes(historyTarget, '<div className="mt-4">') && includes(historyTarget, 'className="w-full text-sm font-medium"'), "履歴一覧の load more 余白が不足しています");
check("LSS-02", "テンプレート一覧画面の『＋ テンプレートを追加』ボタンに下余白が設定されている", includes(templateTarget, '<div className="mb-4">') && includes(templateTarget, '<Button asChild className="w-full justify-start text-left text-base text-white">'), "テンプレート追加ボタンの余白が不足しています");
check("LSS-03", "テンプレート一覧画面の『さらに読み込む』ボタンに上余白が設定されている", includes(templateTarget, '<div className="mt-4">') && includes(templateTarget, 'className="w-full text-sm font-medium"'), "テンプレート load more 余白が不足しています");
check("LSS-04", "服一覧画面の『＋ 服を追加』ボタンに下余白が設定されている", includes(clothingTarget, '<div className="mb-4">') && includes(clothingTarget, '<Button asChild className="w-full justify-start text-left text-base text-white">'), "服追加ボタンの余白が不足しています");
check("LSS-05", "服一覧画面はジャンルセクション単位で『さらに読み込む』ボタンを表示する", includes(clothingTarget, '<div className="grid gap-4">') && includes("src/components/app/screens/ClothingGenreSection.tsx", 'className="w-full text-sm font-medium"'), "服一覧のジャンル別 load more レイアウトが不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
