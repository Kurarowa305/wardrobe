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

check(
  "TA-01",
  "Template APIクライアントが src/api/endpoints/template.ts に存在する",
  exists("src/api/endpoints/template.ts"),
  "src/api/endpoints/template.ts が存在しません",
);

check(
  "TA-02",
  "Template APIクライアントは fetch wrapper（apiClient）経由で実装される",
  includes("src/api/endpoints/template.ts", 'import { apiClient } from "@/api/client";') &&
    includes("src/api/endpoints/template.ts", "apiClient.get<") &&
    includes("src/api/endpoints/template.ts", "apiClient.post<") &&
    includes("src/api/endpoints/template.ts", "apiClient.patch<") &&
    includes("src/api/endpoints/template.ts", "apiClient.delete<"),
  "apiClient 経由の実装（GET/POST/PATCH/DELETE）が不足しています",
);

check(
  "TA-03",
  "MS3-T03で定義された list/get/create/update/delete が公開される",
  includes("src/api/endpoints/template.ts", "export function listTemplates(") &&
    includes("src/api/endpoints/template.ts", "export function getTemplate(") &&
    includes("src/api/endpoints/template.ts", "export function createTemplate(") &&
    includes("src/api/endpoints/template.ts", "export function updateTemplate(") &&
    includes("src/api/endpoints/template.ts", "export function deleteTemplate("),
  "Template APIクライアント関数の公開が不足しています",
);

check(
  "TA-04",
  "一覧/詳細取得の戻り値がDTO型（TemplateListResponseDto / TemplateDetailResponseDto）で返る",
  includes("src/api/endpoints/template.ts", "Promise<TemplateListResponseDto>") &&
    includes("src/api/endpoints/template.ts", "Promise<TemplateDetailResponseDto>") &&
    includes("src/api/endpoints/template.ts", "apiClient.get<TemplateListResponseDto>") &&
    includes("src/api/endpoints/template.ts", "apiClient.get<TemplateDetailResponseDto>"),
  "一覧または詳細のDTO戻り値型定義が不足しています",
);

check(
  "TA-05",
  "一覧APIは order/limit/cursor を query として渡せる",
  includes("src/api/schemas/template.ts", "export type TemplateListParamsDto = {") &&
    includes("src/api/schemas/template.ts", "order?: TemplateListOrderDto;") &&
    includes("src/api/schemas/template.ts", "limit?: number;") &&
    includes("src/api/schemas/template.ts", "cursor?: string | null;") &&
    includes("src/api/endpoints/template.ts", "params: TemplateListParamsDto = {}") &&
    includes("src/api/endpoints/template.ts", "query: params,"),
  "一覧クエリパラメータDTOまたは query 受け渡し実装が不足しています",
);

check(
  "TA-06",
  "作成/更新APIはリクエストDTO（Create/UpdateTemplateRequestDto）をbodyで送る",
  includes("src/api/schemas/template.ts", "export type CreateTemplateRequestDto = {") &&
    includes("src/api/schemas/template.ts", "export type UpdateTemplateRequestDto = {") &&
    includes("src/api/endpoints/template.ts", "body: CreateTemplateRequestDto,") &&
    includes("src/api/endpoints/template.ts", "body: UpdateTemplateRequestDto,") &&
    includes("src/api/endpoints/template.ts", "apiClient.post<void, CreateTemplateRequestDto>") &&
    includes("src/api/endpoints/template.ts", "apiClient.patch<void, UpdateTemplateRequestDto>"),
  "作成/更新のリクエストDTO定義または body 送信実装が不足しています",
);

check(
  "TA-07",
  "テンプレAPIパスが /wardrobes/{wardrobeId}/templates(/:templateId) 形式で統一される",
  includes("src/api/endpoints/template.ts", "return `/wardrobes/${wardrobeId}/templates`;") &&
    includes(
      "src/api/endpoints/template.ts",
      "return `${buildTemplateCollectionPath(wardrobeId)}/${templateId}`;",
    ),
  "テンプレAPIパスの組み立て実装が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
