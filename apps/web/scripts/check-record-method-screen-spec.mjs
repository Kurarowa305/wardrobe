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

const target = "src/components/app/screens/RecordMethodScreen.tsx";
const stringsTarget = "src/features/record/strings.ts";

check(
  "RMS-01",
  "記録方法選択画面が所定ファイルに存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "RMS-02",
  "記録方法選択画面が AppLayout でタイトルとホーム戻り導線を定義する",
  includes(target, 'title={RECORD_STRINGS.method.title}') &&
    includes(target, 'backHref={ROUTES.home(wardrobeId)}'),
  "AppLayout の title/backHref 設定が不足しています",
);

check(
  "RMS-03",
  "画面内に方法選択メッセージと2つの選択肢を表示する",
  includes(target, 'RECORD_STRINGS.method.message') &&
    includes(target, 'RECORD_STRINGS.method.actions.byTemplate') &&
    includes(target, 'RECORD_STRINGS.method.actions.byCombination'),
  "方法選択メッセージまたは2択の表示が不足しています",
);

check(
  "RMS-04",
  "テンプレート記録・服組み合わせ記録への遷移先が routes 定義を利用する",
  includes(target, 'ROUTES.recordByTemplate(wardrobeId)') &&
    includes(target, 'ROUTES.recordByCombination(wardrobeId)'),
  "方法選択の遷移先に record routes の利用が不足しています",
);

check(
  "RMS-05",
  "選択肢が outline ボタンとしてカード内に並ぶ",
  includes(target, '<ScreenCard>') &&
    includes(target, 'variant="outline"') &&
    includes(target, 'className="w-full justify-start text-left text-sm font-medium"'),
  "ScreenCard 内の outline ボタン実装が不足しています",
);

check(
  "RMS-06",
  "記録方法選択画面向け文言が record strings に定義される",
  includes(stringsTarget, 'title: "記録"') &&
    includes(stringsTarget, 'message: "どの方法で記録しますか？"') &&
    includes(stringsTarget, 'byTemplate: "テンプレートで記録"') &&
    includes(stringsTarget, 'byCombination: "服の組み合わせで記録"'),
  "features/record/strings.ts に方法選択画面向け文言の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
