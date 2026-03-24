import { encodeCursor } from "../src/core/cursor/index.ts";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/clothing/usecases/clothingUsecase.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const usecase = await import(usecaseModulePath);

const repoCalls = [];
const repo = {
  async list(input) {
    repoCalls.push(input);
    return {
      Items: [
        { clothingId: "cl_001", name: "黒T", genre: "tops", imageKey: null },
        { clothingId: "cl_002", name: "黒デニム", genre: "bottoms", imageKey: "clothing/black-denim.png" },
      ],
      LastEvaluatedKey: {
        PK: "W#wd_001#CLOTH",
        SK: "CLOTH#cl_002",
        statusListPk: "W#wd_001#CLOTH#ACTIVE",
        createdAtSk: "CREATED#1735690000123#cl_002",
      },
    };
  },
};

const listUsecase = usecase.createClothingUsecase({ repo });
const listResult = await listUsecase.list({
  wardrobeId: "wd_001",
  params: { order: "asc", genre: "bottoms", limit: 5 },
  requestId: "req_list_usecase",
});

const decodedCursor = JSON.parse(Buffer.from(listResult.nextCursor, "base64url").toString("utf8"));

const repoWithCursorCalls = [];
const cursorRepo = {
  async list(input) {
    repoWithCursorCalls.push(input);
    return { Items: [], LastEvaluatedKey: undefined };
  },
};
const cursorUsecase = usecase.createClothingUsecase({ repo: cursorRepo });
await cursorUsecase.list({
  wardrobeId: "wd_001",
  params: {
    order: "desc",
    cursor: encodeCursor({
      resource: "clothing-list",
      order: "desc",
      filters: { genre: "tops" },
      position: {
        PK: "W#wd_001#CLOTH",
        SK: "CLOTH#cl_010",
        statusListPk: "W#wd_001#CLOTH#ACTIVE",
        createdAtSk: "CREATED#1735699999999#cl_010",
      },
    }),
    genre: "tops",
  },
  requestId: "req_cursor",
});

let invalidCursorCode = null;
try {
  await cursorUsecase.list({
    wardrobeId: "wd_001",
    params: { order: "asc", genre: "tops", cursor: listResult.nextCursor },
    requestId: "req_invalid_cursor",
  });
} catch (error) {
  invalidCursorCode = error?.code ?? null;
}

const checks = [
  {
    name: "list usecase queries createdAt index with asc order, limit, and decoded ACTIVE cursor context",
    ok:
      repoCalls.length === 1 &&
      repoCalls[0].indexName === "StatusListByCreatedAt" &&
      repoCalls[0].limit === 5 &&
      repoCalls[0].scanIndexForward === true &&
      repoCalls[0].exclusiveStartKey === undefined,
    detail: repoCalls,
  },
  {
    name: "list usecase filters items by genre and exposes nextCursor envelope",
    ok:
      listResult.items.length === 1 &&
      listResult.items[0].clothingId === "cl_002" &&
      decodedCursor.resource === "clothing-list" &&
      decodedCursor.order === "asc" &&
      decodedCursor.filters.genre === "bottoms" &&
      decodedCursor.position.createdAtSk === "CREATED#1735690000123#cl_002",
    detail: { listResult, decodedCursor },
  },
  {
    name: "list usecase decodes cursor and forwards it as ExclusiveStartKey on subsequent requests",
    ok:
      repoWithCursorCalls.length === 1 &&
      repoWithCursorCalls[0].scanIndexForward === false &&
      repoWithCursorCalls[0].exclusiveStartKey.createdAtSk === "CREATED#1735699999999#cl_010",
    detail: repoWithCursorCalls,
  },
  {
    name: "list usecase rejects mismatched cursor order/filter combinations with INVALID_CURSOR",
    ok: invalidCursorCode === "INVALID_CURSOR",
    detail: invalidCursorCode,
  },
  {
    name: "source exports clothing usecase factory and package script / CI wiring",
    ok:
      source.includes("export function createClothingUsecase") &&
      packageJson.includes('"test:clothing-list-usecase": "node --import tsx/esm scripts/check-clothing-list-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-list-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T04 clothing list usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T04 clothing list usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
