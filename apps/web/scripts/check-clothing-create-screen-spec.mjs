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
const target = "src/components/app/screens/ClothingCreateScreen.tsx";
const stringsTarget = "src/features/clothing/strings.ts";
check("CCS-01", "服追加画面が存在する", exists(target), `${target} が存在しません`);
check("CCS-02", "追加mutationと name/genre state を持つ", includes(target, 'const [name, setName] = useState("");') && includes(target, 'const [genre, setGenre] = useState<ClothingGenreDto | "">("");') && includes(target, 'const createMutation = useCreateClothingMutation(wardrobeId);'), "name/genre state または mutation が不足しています");
check("CCS-03", "服名未入力時に保存不可かつエラーメッセージを表示する", includes(target, 'const isNameEmpty = trimmedName.length === 0;') && includes(target, 'CLOTHING_STRINGS.create.messages.nameRequired'), "服名バリデーションが不足しています");
check("CCS-04", "服ジャンル未選択時に保存不可かつエラーメッセージを表示する", includes(target, 'const isGenreEmpty = genre.length === 0;') && includes(target, 'CLOTHING_STRINGS.create.messages.genreRequired') && includes(target, 'name="genre"'), "ジャンル選択バリデーションが不足しています");
check("CCS-05", "ジャンル選択プルダウンの右に同じアイコンを表示する", includes(target, '<select id="clothing-genre" name="genre"') && includes(target, '<ClothingGenreIcon genre={genre} className="h-5 w-5 text-slate-700" />'), "ジャンルプルダウン右のアイコンが不足しています");
check("CCS-06", "保存成功時に服一覧へ遷移し、genre を payload に含める", includes(target, 'await createMutation.mutateAsync({ name: trimmedName, genre: genre as ClothingGenreDto, imageKey: uploadedImageKey });') && includes(target, 'router.push(appendOperationToast(ROUTES.clothings(wardrobeId), OPERATION_TOAST_IDS.clothingCreated));'), "保存 payload または遷移が不足しています");
check("CCS-07", "服追加画面向け文言に genreRequired を定義する", includes(stringsTarget, 'genreRequired: "服のジャンルを選択してください。"'), "genreRequired 文言が不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
