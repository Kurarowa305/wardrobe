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

const screenTarget = "src/components/app/screens/HistoryDetailScreen.tsx";
const typesTarget = "src/features/history/types.ts";
const schemaTarget = "src/api/schemas/history.ts";
const fixtureTarget = "src/mocks/fixtures/history.ts";
const handlerTarget = "src/mocks/handlers/history.ts";
const stringsTarget = "src/features/history/strings.ts";

check(
  "HDT-01",
  "入力方法カードの2行目から組み合わせ/テンプレート名の表記を削除している",
  !includes(screenTarget, "historyQuery.data.templateName ?? HISTORY_STRINGS.detail.messages.combinationSummary"),
  "入力方法カード内に旧来の2行目表示が残っています",
);

check(
  "HDT-02",
  "テンプレート入力時のみ着用テンプレートカードを白背景で表示し、名称・着た回数を描画する",
  includes(screenTarget, "historyQuery.data.template ? (") &&
    includes(screenTarget, "rounded-md border border-slate-200 bg-white p-3") &&
    includes(screenTarget, "historyQuery.data.template.name") &&
    includes(screenTarget, "HISTORY_STRINGS.detail.labels.templateWearCount}: {historyQuery.data.template.wearCount}") &&
    !includes(screenTarget, "formatLastWornDate(historyQuery.data.template.lastWornAt, HISTORY_STRINGS.detail.messages.neverWorn)"),
  "着用テンプレートカードの見た目、または最後に着た日行削除の実装が不足しています",
);

check(
  "HDT-03",
  "履歴詳細DTO/VMがテンプレートカード表示用の情報を保持する",
  includes(schemaTarget, "export type HistoryDetailTemplateDto = {") &&
    includes(schemaTarget, "template: HistoryDetailTemplateDto | null;") &&
    includes(typesTarget, "export type HistoryTemplate = {") &&
    includes(typesTarget, "template: HistoryTemplate | null;") &&
    includes(typesTarget, "template: dto.template ? toHistoryTemplate(dto.template) : null,"),
  "履歴詳細DTOまたはVMにテンプレート情報の定義が不足しています",
);

check(
  "HDT-04",
  "fixture/handlerがテンプレート入力履歴にテンプレート詳細情報を含める",
  includes(fixtureTarget, "template: {") &&
    includes(fixtureTarget, "wearCount: templateFixture.wearCount,") &&
    includes(handlerTarget, "template: history.template ? { ...history.template } : null,") &&
    includes(handlerTarget, "templateId: payload.templateId,"),
  "fixture または MSW handler にテンプレート情報の同梱が不足しています",
);

check(
  "HDT-05",
  "履歴詳細向け文言に着用テンプレートカード用ラベルが定義され、最後に着た日文言を持たない",
  includes(stringsTarget, 'template: "着たテンプレート"') &&
    includes(stringsTarget, 'templateWearCount: "着た回数"') &&
    !includes(stringsTarget, 'templateLastWornAt: "最後に着た日"'),
  "着用テンプレートカード向け文言の整理が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
