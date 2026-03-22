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
const target = "src/components/app/screens/RecordByCombinationScreen.tsx";
const stringsTarget = "src/features/record/strings.ts";
check("RCS-01", "服組み合わせ記録画面が存在する", exists(target), `${target} が存在しません`);
check("RCS-02", "AppLayout でタイトルと戻り先が設定される", includes(target, 'title={RECORD_STRINGS.byCombination.title}') && includes(target, 'backHref={ROUTES.recordMethod(wardrobeId)}'), "title/backHref が不足しています");
check("RCS-03", "日付入力欄が date input と必須エラー付きで実装される", includes(target, 'type="date"') && includes(target, 'RECORD_STRINGS.byCombination.messages.dateRequired'), "日付入力またはエラー文言が不足しています");
check("RCS-04", "服一覧取得にジャンル別 clothing query hook を用い、複数選択 checkbox を描画する", includes(target, 'const topsQuery = useClothingList(wardrobeId, { genre: "tops"') && includes(target, 'const bottomsQuery = useClothingList(wardrobeId, { genre: "bottoms"') && includes(target, 'const othersQuery = useClothingList(wardrobeId, { genre: "others"') && includes("src/components/app/screens/ClothingGenreSection.tsx", 'type="checkbox"'), "ジャンル別取得または複数選択 UI が不足しています");
check("RCS-05", "服一覧がジャンル別サムネイル付き選択セクションとして描画される", includes(target, 'ClothingGenreSection') && includes("src/components/app/screens/ClothingGenreSection.tsx", 'grid-cols-[56px_minmax(0,1fr)_40px]') && includes("src/components/app/screens/ClothingGenreSection.tsx", 'ClothingGenreIcon genre={genre}'), "ジャンル別サムネイル付きセクションが不足しています");
check("RCS-06", "記録ボタンが create history mutation を呼び、yyyymmdd に変換した服ID配列で履歴を作成する", includes(target, 'function toHistoryApiDate(dateInputValue: string)') && includes(target, 'dateInputValue.replaceAll("-", "")') && includes(target, 'await createHistoryMutation.mutateAsync({ date: historyApiDate, clothingIds: selectedClothingIds });'), "mutation payload が不足しています");
check("RCS-07", "ジャンルごとにさらに読み込むボタンを持つ", includes(target, 'onLoadMore={state.nextCursor !== null ? () => handleLoadMore(genre) : undefined}') && includes(target, 'loadMoreLabel={RECORD_STRINGS.byCombination.actions.loadMore}'), "ジャンル別 load more が不足しています");
check("RCS-08", "record strings に sectionEmpty を定義する", includes(stringsTarget, 'sectionEmpty: "このジャンルで選択できる服はまだありません。"') && includes(stringsTarget, 'clothingRequired: "服を1着以上選択してください。"'), "sectionEmpty または clothingRequired 文言が不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
