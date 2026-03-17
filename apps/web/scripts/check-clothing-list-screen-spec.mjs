import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

function abs(relPath) {
  return path.join(webRoot, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function read(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
}

function includes(relPath, expected) {
  return read(relPath).includes(expected);
}

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

check(
  "CLS-01",
  "服一覧画面が src/components/app/screens/ClothingsTabScreen.tsx に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "CLS-02",
  "服一覧画面が useClothingList を利用し、cursorページングでデータ取得する",
  includes(target, '"use client";') &&
    includes(target, 'import { useClothingList } from "@/api/hooks/clothing";') &&
    includes(target, "const CLOTHING_LIST_PAGE_SIZE = 20;") &&
    includes(target, "useClothingList(wardrobeId, {") &&
    includes(target, "limit: CLOTHING_LIST_PAGE_SIZE,") &&
    includes(target, "cursor,"),
  "useClothingList または cursor/limit 指定が不足しています",
);

check(
  "CLS-03",
  "一覧画面に「＋ 服を追加」導線があり、服追加画面へ遷移できる",
  includes(target, "ROUTES.clothingNew(wardrobeId)") &&
    includes(target, "CLOTHING_STRINGS.list.actions.add"),
  "服追加導線（ROUTES.clothingNew / actions.add）の実装が不足しています",
);

check(
  "CLS-04",
  "一覧画面が読込中・空状態・読込失敗の表示文言を持つ",
  includes(target, "CLOTHING_STRINGS.list.messages.loading") &&
    includes(target, "CLOTHING_STRINGS.list.messages.empty") &&
    includes(target, "CLOTHING_STRINGS.list.messages.error"),
  "読込/空/エラー状態の文言表示が不足しています",
);

check(
  "CLS-05",
  "服カードが詳細遷移導線を持ち、resolveImageUrl で画像表示/no image フォールバックを行う",
  includes(target, "ROUTES.clothingDetail(wardrobeId, item.clothingId)") &&
    includes(target, 'import { resolveImageUrl } from "@/features/clothing/imageUrl";') &&
    includes(target, "const imageUrl = resolveImageUrl(item.imageKey);") &&
    includes(target, "<img") &&
    includes(target, "COMMON_STRINGS.placeholders.noImage") &&
    includes(target, "item.name"),
  "服カードの詳細遷移または resolveImageUrl/no image 表示実装が不足しています",
);

check(
  "CLS-06",
  "nextCursor がある場合に「さらに読み込む」で追加取得できる",
  includes(target, "const [nextCursor, setNextCursor] = useState<string | null>(null);") &&
    includes(target, "setNextCursor(data.nextCursor);") &&
    includes(target, "setCursor(nextCursor);") &&
    includes(target, "CLOTHING_STRINGS.list.actions.loadMore") &&
    includes(target, "onClick={handleLoadMore}"),
  "nextCursor を使った追加読み込み導線が不足しています",
);

check(
  "CLS-07",
  "服一覧画面向けの文言（loadMore/messages）が clothing strings に定義される",
  includes(stringsTarget, "loadMore: \"さらに読み込む\"") &&
    includes(stringsTarget, "loading: \"読み込み中...\"") &&
    includes(stringsTarget, "empty: \"服がまだ登録されていません。\"") &&
    includes(stringsTarget, "error: \"服一覧の読み込みに失敗しました。\""),
  "features/clothing/strings.ts に一覧状態文言の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
