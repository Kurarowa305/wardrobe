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

const target = "src/components/app/screens/TemplatesTabScreen.tsx";
const stringsTarget = "src/features/template/strings.ts";

check(
  "TLS-01",
  "テンプレート一覧画面が src/components/app/screens/TemplatesTabScreen.tsx に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "TLS-02",
  "テンプレート一覧画面が useTemplateList を利用し、cursorページングでデータ取得する",
  includes(target, '"use client";') &&
    includes(target, 'import { useTemplateList } from "@/api/hooks/template";') &&
    includes(target, "const TEMPLATE_LIST_PAGE_SIZE = 20;") &&
    includes(target, "useTemplateList(wardrobeId, {") &&
    includes(target, "limit: TEMPLATE_LIST_PAGE_SIZE,") &&
    includes(target, "cursor,"),
  "useTemplateList または cursor/limit 指定が不足しています",
);

check(
  "TLS-03",
  "一覧画面に「＋ テンプレートを追加」導線があり、テンプレート追加画面へ遷移できる",
  includes(target, "ROUTES.templateNew(wardrobeId)") && includes(target, "TEMPLATE_STRINGS.list.actions.add"),
  "テンプレート追加導線（ROUTES.templateNew / actions.add）の実装が不足しています",
);

check(
  "TLS-04",
  "一覧画面が読込中・空状態・読込失敗の表示文言を持つ",
  includes(target, "TEMPLATE_STRINGS.list.messages.loading") &&
    includes(target, "TEMPLATE_STRINGS.list.messages.empty") &&
    includes(target, "TEMPLATE_STRINGS.list.messages.error"),
  "読込/空/エラー状態の文言表示が不足しています",
);

check(
  "TLS-05",
  "テンプレートカードが詳細遷移導線を持ち、サムネ表示で resolveImageUrl/no image/削除済みオーバーレイに対応する",
  includes(target, "ROUTES.templateDetail(wardrobeId, item.templateId)") &&
    includes(target, 'import { resolveImageUrl } from "@/features/clothing/imageUrl";') &&
    includes(target, 'import { ThumbnailStrip } from "@/components/app/shared/ThumbnailStrip";') &&
    includes(target, '<ThumbnailStrip') &&
    includes(target, "TEMPLATE_STRINGS.list.badges.deleted"),
  "テンプレートカードの詳細遷移またはサムネ表示実装が不足しています",
);

check(
  "TLS-06",
  "テンプレートカードがサムネ共通レイアウトコンポーネントを利用する",
  includes(target, 'import { ThumbnailStrip } from "@/components/app/shared/ThumbnailStrip";') &&
    includes(target, '<ThumbnailStrip') &&
    includes(target, 'deletedLabel={TEMPLATE_STRINGS.list.badges.deleted}'),
  "テンプレートカードで共通サムネイルレイアウトの利用が不足しています",
);

check(
  "TLS-07",
  "nextCursor がある場合に『さらに読み込む』で追加取得できる",
  includes(target, "const [nextCursor, setNextCursor] = useState<string | null>(null);") &&
    includes(target, "setNextCursor(data.nextCursor);") &&
    includes(target, "setCursor(nextCursor);") &&
    includes(target, "TEMPLATE_STRINGS.list.actions.loadMore") &&
    includes(target, "onClick={handleLoadMore}"),
  "nextCursor を使った追加読み込み導線が不足しています",
);

check(
  "TLS-08",
  "テンプレート一覧画面向けの文言（loadMore/messages/badges）が template strings に定義される",
  includes(stringsTarget, 'loadMore: "さらに読み込む"') &&
    includes(stringsTarget, 'loading: "読み込み中..."') &&
    includes(stringsTarget, 'empty: "テンプレートがまだ登録されていません。"') &&
    includes(stringsTarget, 'error: "テンプレート一覧の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'deleted: "削除済み"'),
  "features/template/strings.ts に一覧状態文言の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
