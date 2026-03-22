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

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check("CLL-01", "服一覧 DTO から cursor/nextCursor が削除されている", !includes("src/api/schemas/clothing.ts", "cursor?:") && !includes("src/api/schemas/clothing.ts", "nextCursor"), "DTO に cursor/nextCursor が残っています");
check("CLL-02", "服一覧 query key 正規化から cursor が削除されている", !includes("src/api/queryKeys.ts", "cursor?: string | null;") && !includes("src/api/queryKeys.ts", "cursor: params.cursor ?? null,"), "query key に cursor 正規化が残っています");
check("CLL-03", "一覧 hook が nextCursor を扱わない", !includes("src/api/hooks/clothing.ts", "nextCursor"), "一覧 hook に nextCursor 処理が残っています");
check("CLL-04", "MSW handler が登録上限100件と limit 100 を定義する", includes("src/mocks/handlers/clothing.ts", 'const DEFAULT_LIST_LIMIT = 100;') && includes("src/mocks/handlers/clothing.ts", 'const MAX_CLOTHING_COUNT = 100;'), "handler に 100件制限定義が不足しています");

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
