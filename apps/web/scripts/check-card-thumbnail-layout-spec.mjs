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

const sharedTarget = "src/components/app/shared/ThumbnailStrip.tsx";
const historyCardTarget = "src/components/app/history/HistoryCard.tsx";
const templateListTarget = "src/components/app/screens/TemplatesTabScreen.tsx";
const recordTemplateTarget = "src/components/app/screens/RecordByTemplateScreen.tsx";

check(
  "CTL-01",
  "カード用サムネイル共通コンポーネントが所定ファイルに存在する",
  exists(sharedTarget),
  `${sharedTarget} が存在しません`,
);

check(
  "CTL-02",
  "共通コンポーネントがサムネイル上限4件と超過時5枠レイアウトを定義する",
  includes(sharedTarget, "export const CARD_THUMBNAIL_LIMIT = 4;") &&
    includes(sharedTarget, "const visibleItems = items.slice(0, CARD_THUMBNAIL_LIMIT);") &&
    includes(sharedTarget, "const hiddenCount = Math.max(items.length - CARD_THUMBNAIL_LIMIT, 0);") &&
    includes(sharedTarget, "const columnCount = hiddenCount > 0 ? CARD_THUMBNAIL_LIMIT + 1 : Math.max(visibleItems.length, 1);") &&
    includes(sharedTarget, 'style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}'),
  "4件上限または超過時5枠レイアウト定義が不足しています",
);

check(
  "CTL-03",
  "共通コンポーネントが no image / 削除済み / +x タイル表示を担当する",
  includes(sharedTarget, "COMMON_STRINGS.placeholders.noImage") &&
    includes(sharedTarget, "{deletedLabel}") &&
    includes(sharedTarget, "+{hiddenCount}") &&
    includes(sharedTarget, "rounded-md border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700"),
  "no image・削除済み・+xタイル表示の共通化が不足しています",
);

check(
  "CTL-04",
  "ホームと履歴一覧の共通履歴カードが ThumbnailStrip を利用する",
  includes(historyCardTarget, 'import { ThumbnailStrip } from "@/components/app/shared/ThumbnailStrip";') &&
    includes(historyCardTarget, "<ThumbnailStrip") &&
    includes(historyCardTarget, "deletedLabel={HISTORY_STRINGS.list.badges.deleted}"),
  "履歴カードで ThumbnailStrip の利用が不足しています",
);

check(
  "CTL-05",
  "テンプレート一覧カードが ThumbnailStrip を利用してレイアウトを統一する",
  includes(templateListTarget, 'import { ThumbnailStrip } from "@/components/app/shared/ThumbnailStrip";') &&
    includes(templateListTarget, "<ThumbnailStrip") &&
    includes(templateListTarget, "deletedLabel={TEMPLATE_STRINGS.list.badges.deleted}"),
  "テンプレート一覧で ThumbnailStrip の利用が不足しています",
);

check(
  "CTL-06",
  "テンプレート記録画面の選択カードが ThumbnailStrip を利用してレイアウトを統一する",
  includes(recordTemplateTarget, 'import { ThumbnailStrip } from "@/components/app/shared/ThumbnailStrip";') &&
    includes(recordTemplateTarget, "<ThumbnailStrip") &&
    includes(recordTemplateTarget, "deletedLabel={RECORD_STRINGS.common.deleted}"),
  "テンプレート記録画面で ThumbnailStrip の利用が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
