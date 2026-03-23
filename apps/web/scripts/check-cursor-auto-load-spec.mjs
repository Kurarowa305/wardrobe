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
function check(id, description, passed, detail) { checkCount += 1; if (passed) { console.log(`PASS ${id}: ${description}`); return; } failures.push(`FAIL ${id}: ${description}
  ${detail}`); }
check("CAL-01", "IntersectionObserver ベースの自動読み込み hook を持つ", includes("src/hooks/useAutoLoadOnIntersect.ts", "new IntersectionObserver(") && includes("src/hooks/useAutoLoadOnIntersect.ts", "onLoadMore();"), "自動読み込み hook が不足しています");
check("CAL-02", "共通 trigger コンポーネントが自動読み込み hook を利用する", includes("src/components/app/screens/AutoLoadTrigger.tsx", 'import { useAutoLoadOnIntersect } from "@/hooks/useAutoLoadOnIntersect";') && includes("src/components/app/screens/AutoLoadTrigger.tsx", "const triggerRef = useAutoLoadOnIntersect({"), "共通 trigger コンポーネントが不足しています");
check("CAL-03", "履歴・テンプレート・ホーム・記録画面が AutoLoadTrigger を利用する", ["src/components/app/screens/HistoriesTabScreen.tsx", "src/components/app/screens/TemplatesTabScreen.tsx", "src/components/app/screens/HomeTabScreen.tsx", "src/components/app/screens/RecordByTemplateScreen.tsx"].every((target) => includes(target, 'import { AutoLoadTrigger } from "@/components/app/screens/AutoLoadTrigger";') && includes(target, '<AutoLoadTrigger')), "一覧系画面の AutoLoadTrigger 導入が不足しています");
check("CAL-04", "服系セクションはジャンルごとの下端で自動読み込みを行う", includes("src/components/app/screens/ClothingGenreSection.tsx", '<AutoLoadTrigger') && includes("src/components/app/screens/ClothingsTabScreen.tsx", 'onLoadMore={state.nextCursor !== null && !query.isFetching ? () => handleLoadMore(genre) : undefined}') && includes("src/components/app/screens/TemplateForm.tsx", 'onLoadMore={state.nextCursor !== null && !query.isFetching ? () => handleLoadMore(genre) : undefined}') && includes("src/components/app/screens/RecordByCombinationScreen.tsx", 'onLoadMore={state.nextCursor !== null && !query.isFetching ? () => handleLoadMore(genre) : undefined}'), "ジャンル別自動読み込み導線が不足しています");
check("CAL-05", "一覧 API は設計上限の limit を指定する", includes("src/components/app/screens/HistoriesTabScreen.tsx", "const HISTORY_LIST_PAGE_SIZE = 30;") && includes("src/components/app/screens/HomeTabScreen.tsx", "const HOME_RECENT_HISTORY_LIMIT = 30;") && includes("src/components/app/screens/TemplatesTabScreen.tsx", "const TEMPLATE_LIST_PAGE_SIZE = 30;") && includes("src/components/app/screens/ClothingsTabScreen.tsx", "const CLOTHING_LIST_PAGE_SIZE = 50;") && includes("src/components/app/screens/TemplateForm.tsx", "const TEMPLATE_FORM_CLOTHING_LIMIT = 50;") && includes("src/components/app/screens/RecordByCombinationScreen.tsx", "const RECORD_COMBINATION_CLOTHING_LIMIT = 50;") && includes("src/components/app/screens/RecordByTemplateScreen.tsx", "const RECORD_TEMPLATE_LIMIT = 30;"), "limit 上限指定が不足しています");
check("CAL-06", "fixture は自動読み込みが一度以上走る件数を持つ", includes("src/mocks/fixtures/history.ts", "const GENERATED_HISTORY_FIXTURE_COUNT = 31;") && includes("src/mocks/fixtures/template.ts", "const GENERATED_TEMPLATE_FIXTURE_COUNT = 31;") && includes("src/mocks/fixtures/clothing.ts", "const GENERATED_FIXTURES_PER_GENRE = 49;"), "fixture 件数が不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
