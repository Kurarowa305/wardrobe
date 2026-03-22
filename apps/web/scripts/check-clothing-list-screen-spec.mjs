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

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

const target = "src/components/app/screens/ClothingsTabScreen.tsx";
const stringsTarget = "src/features/clothing/strings.ts";

check("CLS-01", "服一覧画面が存在する", exists(target), `${target} が存在しません`);
check("CLS-02", "服一覧画面がジャンル別 useClothingList を上限100件指定で利用する", includes(target, 'const CLOTHING_LIST_LIMIT = 100;') && includes(target, 'const topsQuery = useClothingList(wardrobeId, { genre: "tops", limit: CLOTHING_LIST_LIMIT });') && includes(target, 'const bottomsQuery = useClothingList(wardrobeId, { genre: "bottoms", limit: CLOTHING_LIST_LIMIT });') && includes(target, 'const othersQuery = useClothingList(wardrobeId, { genre: "others", limit: CLOTHING_LIST_LIMIT });'), "ジャンル別一覧取得または上限100件指定が不足しています");
check("CLS-03", "一覧画面に追加導線がある", includes(target, "ROUTES.clothingNew(wardrobeId)") && includes(target, "CLOTHING_STRINGS.list.actions.add"), "追加導線が不足しています");
check("CLS-04", "一覧画面が読込中・空状態・読込失敗の表示文言を持つ", includes(target, "CLOTHING_STRINGS.list.messages.loading") && includes(target, "CLOTHING_STRINGS.list.messages.empty") && includes(target, "CLOTHING_STRINGS.list.messages.error"), "状態別文言が不足しています");
check("CLS-05", "各ジャンルを見出し付きセクションで表示し、同ジャンルアイコンを出す", includes(target, "ClothingGenreSection") && includes("src/components/app/screens/ClothingGenreSection.tsx", 'aria-expanded={!collapsed}') && includes("src/components/app/screens/ClothingGenreSection.tsx", 'ClothingGenreIcon genre={genre}'), "見出し・折りたたみ・アイコン付きセクションが不足しています");
check("CLS-06", "服一覧画面に『さらに読み込む』や cursor 状態を持たない", !includes(target, "handleLoadMore") && !includes(target, "nextCursor") && !includes(target, "loadMoreLabel") && !includes(target, "cursor:"), "load more もしくは cursor 依存実装が残っています");
check("CLS-07", "服一覧画面向けの文言に sectionEmpty と上限案内を持つ", includes(stringsTarget, 'sectionEmpty: "このジャンルの服はまだ登録されていません。"') && includes(stringsTarget, 'limitNotice: "服の登録上限は100件です。一覧はジャンルごとに最大100件まで取得します。"'), "sectionEmpty または上限案内文言が不足しています");

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
