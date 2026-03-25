import { encodeCursor } from "../src/core/cursor/index.ts";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/template/usecases/templateUsecase.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const usecase = await import(usecaseModulePath);

const repoCalls = [];
const batchCalls = [];
const templateRepo = {
  async list(input) {
    repoCalls.push(input);
    return {
      Items: [
        {
          templateId: "tp_001",
          name: "通勤",
          clothingIds: ["cl_001", "cl_002", "cl_003", "cl_004", "cl_005"],
        },
      ],
      LastEvaluatedKey: {
        PK: "W#wd_001#TPL",
        SK: "TPL#tp_001",
        statusListPk: "W#wd_001#TPL#ACTIVE",
        createdAtSk: "CREATED#1735690000123#tp_001",
      },
    };
  },
};

const clothingBatchGetRepo = {
  async batchGetByIds(input) {
    batchCalls.push(input);
    return [
      {
        Responses: {
          WardrobeTable: [
            { clothingId: "cl_001", imageKey: "img/1.jpg", status: "ACTIVE" },
            { clothingId: "cl_002", imageKey: "img/2.jpg", status: "ACTIVE" },
            { clothingId: "cl_003", imageKey: "img/3.jpg", status: "ACTIVE" },
            { clothingId: "cl_004", imageKey: "img/4.jpg", status: "ACTIVE" },
            { clothingId: "cl_005", imageKey: "img/5.jpg", status: "DELETED" },
          ],
        },
      },
    ];
  },
};

const listUsecase = usecase.createTemplateUsecase({ repo: templateRepo, clothingBatchGetRepo });
const listResult = await listUsecase.list({
  wardrobeId: "wd_001",
  params: { order: "asc", limit: 5 },
  requestId: "req_template_list_usecase",
});

const decodedCursor = JSON.parse(Buffer.from(listResult.nextCursor, "base64url").toString("utf8"));

const repoWithCursorCalls = [];
const cursorRepo = {
  async list(input) {
    repoWithCursorCalls.push(input);
    return { Items: [], LastEvaluatedKey: undefined };
  },
};
const cursorUsecase = usecase.createTemplateUsecase({
  repo: cursorRepo,
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [];
    },
  },
});

await cursorUsecase.list({
  wardrobeId: "wd_001",
  params: {
    order: "desc",
    cursor: encodeCursor({
      resource: "template-list",
      order: "desc",
      filters: {},
      position: {
        PK: "W#wd_001#TPL",
        SK: "TPL#tp_010",
        statusListPk: "W#wd_001#TPL#ACTIVE",
        createdAtSk: "CREATED#1735699999999#tp_010",
      },
    }),
  },
  requestId: "req_template_cursor",
});

let invalidCursorCode = null;
try {
  await cursorUsecase.list({
    wardrobeId: "wd_001",
    params: { order: "desc", cursor: listResult.nextCursor },
    requestId: "req_template_invalid_cursor",
  });
} catch (error) {
  invalidCursorCode = error?.code ?? null;
}

const checks = [
  {
    name: "list usecase queries template createdAt index and forwards order/limit",
    ok:
      repoCalls.length === 1 &&
      repoCalls[0].indexName === "StatusListByCreatedAt" &&
      repoCalls[0].limit === 5 &&
      repoCalls[0].scanIndexForward === true,
    detail: repoCalls,
  },
  {
    name: "list usecase includes all clothingItems without 4-item truncation and preserves order",
    ok:
      batchCalls.length === 1 &&
      listResult.items.length === 1 &&
      listResult.items[0].clothingItems.length === 5 &&
      listResult.items[0].clothingItems[0].clothingId === "cl_001" &&
      listResult.items[0].clothingItems[4].clothingId === "cl_005",
    detail: { batchCalls, listResult },
  },
  {
    name: "list usecase returns nextCursor envelope for template-list resource",
    ok:
      decodedCursor.resource === "template-list" &&
      decodedCursor.order === "asc" &&
      Object.keys(decodedCursor.filters).length === 0 &&
      decodedCursor.position.createdAtSk === "CREATED#1735690000123#tp_001",
    detail: decodedCursor,
  },
  {
    name: "list usecase decodes cursor and forwards ExclusiveStartKey on subsequent requests",
    ok:
      repoWithCursorCalls.length >= 1 &&
      repoWithCursorCalls[0].scanIndexForward === false &&
      repoWithCursorCalls[0].exclusiveStartKey.createdAtSk === "CREATED#1735699999999#tp_010",
    detail: repoWithCursorCalls,
  },
  {
    name: "list usecase rejects mismatched cursor order with INVALID_CURSOR",
    ok: invalidCursorCode === "INVALID_CURSOR",
    detail: invalidCursorCode,
  },
  {
    name: "source exports template usecase factory and package script / CI wiring",
    ok:
      source.includes("export function createTemplateUsecase") &&
      packageJson.includes('"test:template-list-usecase": "node --import tsx/esm scripts/check-template-list-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-list-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T05 template list usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T05 template list usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
