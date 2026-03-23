import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const failures = [];
let checkCount = 0;
const abs = (relPath) => path.join(webRoot, relPath);
const exists = (relPath) => fs.existsSync(abs(relPath));
const read = (relPath) => fs.readFileSync(abs(relPath), "utf8");
const includes = (relPath, expected) => read(relPath).includes(expected);
function check(id, description, passed, detail) { checkCount += 1; if (passed) { console.log(`PASS ${id}: ${description}`); return; } failures.push(`FAIL ${id}: ${description}\n  ${detail}`); }
const target = "src/components/app/screens/ClothingsTabScreen.tsx";
const stringsTarget = "src/features/clothing/strings.ts";
check("CLS-01", "服一覧画面が存在する", exists(target), `${target} が存在しません`);
check("CLS-02", "服一覧画面がジャンル別 useClothingList を利用する", includes(target, 'const topsQuery = useClothingList(wardrobeId, { genre: "tops"') && includes(target, 'const bottomsQuery = useClothingList(wardrobeId, { genre: "bottoms"') && includes(target, 'const othersQuery = useClothingList(wardrobeId, { genre: "others"') && includes(target, 'const CLOTHING_LIST_PAGE_SIZE = 50;'), "ジャンル別一覧取得が不足しています");
check("CLS-03", "一覧画面に追加導線がある", includes(target, "ROUTES.clothingNew(wardrobeId)") && includes(target, "CLOTHING_STRINGS.list.actions.add"), "追加導線が不足しています");
check("CLS-04", "一覧画面が読込中・空状態・読込失敗の表示文言を持つ", includes(target, "CLOTHING_STRINGS.list.messages.loading") && includes(target, "CLOTHING_STRINGS.list.messages.empty") && includes(target, "CLOTHING_STRINGS.list.messages.error"), "状態別文言が不足しています");
check("CLS-05", "各ジャンルを見出し付きセクションで表示し、同ジャンルアイコンを出す", includes(target, "ClothingGenreSection") && includes("src/components/app/screens/ClothingGenreSection.tsx", 'aria-expanded={!collapsed}') && includes("src/components/app/screens/ClothingGenreSection.tsx", 'ClothingGenreIcon genre={genre}'), "見出し・折りたたみ・アイコン付きセクションが不足しています");
check("CLS-06", "ジャンルごとにスクロール下端で自動読み込みする", includes(target, 'onLoadMore={state.nextCursor !== null && !query.isFetching ? () => handleLoadMore(genre) : undefined}') && includes("src/components/app/screens/ClothingGenreSection.tsx", '<AutoLoadTrigger'), "ジャンル別自動読み込みが不足しています");
check("CLS-07", "服一覧画面向けの文言に sectionEmpty を持つ", includes(stringsTarget, 'sectionEmpty: "このジャンルの服はまだ登録されていません。"'), "sectionEmpty 文言が不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
