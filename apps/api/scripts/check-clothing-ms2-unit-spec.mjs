import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const repoModulePath = path.join(root, "src/domains/clothing/repo/clothingRepo.ts");
const usecaseModulePath = path.join(root, "src/domains/clothing/usecases/clothingUsecase.ts");
const getHandlerModulePath = path.join(root, "src/domains/clothing/handlers/getClothingHandler.ts");
const listHandlerModulePath = path.join(root, "src/domains/clothing/handlers/listClothingHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const repoSource = readFileSync(repoModulePath, "utf8");
const usecaseSource = readFileSync(usecaseModulePath, "utf8");
const getHandlerSource = readFileSync(getHandlerModulePath, "utf8");
const listHandlerSource = readFileSync(listHandlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createClothingRepo } = await import(repoModulePath);
const { createClothingUsecase } = await import(usecaseModulePath);
const { getClothingHandler } = await import(getHandlerModulePath);
const { listClothingHandler } = await import(listHandlerModulePath);

const repoClient = createClothingRepo({
  async putItem(input) {
    return { operation: "PutItem", request: { input } };
  },
  async getItem(input) {
    return { operation: "GetItem", request: { input } };
  },
  async query(input) {
    return { operation: "Query", request: { input } };
  },
  async updateItem(input) {
    return { operation: "UpdateItem", request: { input } };
  },
});

const listResult = await repoClient.list({
  wardrobeId: "wd_001",
  indexName: "StatusListByCreatedAt",
  limit: 10,
  scanIndexForward: false,
});

const getUsecase = createClothingUsecase({
  repo: {
    async get() {
      return {
        Item: {
          wardrobeId: "wd_001",
          clothingId: "cl_deleted",
          name: "旧ジャケット",
          genre: "others",
          imageKey: "images/old-jacket.png",
          status: "DELETED",
          wearCount: 9,
          lastWornAt: 1_735_699_999_999,
          createdAt: 1_735_000_000_000,
          deletedAt: 1_736_000_000_000,
        },
      };
    },
    async list() {
      return { Items: [], LastEvaluatedKey: undefined };
    },
    async create() {
      return { ok: true };
    },
    async update() {
      return { ok: true };
    },
    async delete() {
      return { ok: true };
    },
  },
});

const deletedDetail = await getUsecase.get({
  wardrobeId: "wd_001",
  clothingId: "cl_deleted",
});

const deletedDetailResponse = await getClothingHandler({
  path: { wardrobeId: "wd_001", clothingId: "cl_deleted" },
  requestId: "req_get_deleted",
  dependencies: {
    repo: {
      async get() {
        return {
          Item: {
            wardrobeId: "wd_001",
            clothingId: "cl_deleted",
            name: "旧ジャケット",
            genre: "others",
            imageKey: "images/old-jacket.png",
            status: "DELETED",
            wearCount: 9,
            lastWornAt: 1_735_699_999_999,
            createdAt: 1_735_000_000_000,
            deletedAt: 1_736_000_000_000,
          },
        };
      },
      async list() {
        return { Items: [], LastEvaluatedKey: undefined };
      },
      async create() {
        return { ok: true };
      },
      async update() {
        return { ok: true };
      },
      async delete() {
        return { ok: true };
      },
    },
  },
});
const deletedDetailJson = JSON.parse(deletedDetailResponse.body);

let invalidCursorCode = null;
try {
  await listClothingHandler({
    path: { wardrobeId: "wd_001" },
    query: {
      order: "asc",
      genre: "tops",
      cursor: Buffer.from(JSON.stringify({
        resource: "clothing-list",
        order: "desc",
        filters: { genre: "tops" },
        position: {
          PK: "W#wd_001#CLOTH",
          SK: "CLOTH#cl_001",
          statusListPk: "W#wd_001#CLOTH#ACTIVE",
          createdAtSk: "CREATED#1735690000000#cl_001",
        },
      })).toString("base64url"),
    },
    requestId: "req_invalid_cursor",
    dependencies: {
      repo: {
        async list() {
          return { Items: [], LastEvaluatedKey: undefined };
        },
        async get() {
          return { Item: undefined };
        },
        async create() {
          return { ok: true };
        },
        async update() {
          return { ok: true };
        },
        async delete() {
          return { ok: true };
        },
      },
    },
  });
} catch (error) {
  invalidCursorCode = error?.code ?? null;
}

const checks = [
  {
    name: "repo list targets ACTIVE statusListPk by default",
    ok:
      listResult.operation === "Query" &&
      listResult.request.input.ExpressionAttributeValues[":statusListPk"] === "W#wd_001#CLOTH#ACTIVE",
    detail: listResult,
  },
  {
    name: "usecase get can read DELETED clothing detail",
    ok:
      deletedDetail.clothingId === "cl_deleted" &&
      deletedDetail.status === "DELETED" &&
      deletedDetail.wearCount === 9,
    detail: deletedDetail,
  },
  {
    name: "get handler returns DELETED clothing detail as 200 response",
    ok:
      deletedDetailResponse.statusCode === 200 &&
      deletedDetailJson.clothingId === "cl_deleted" &&
      deletedDetailJson.status === "DELETED",
    detail: { deletedDetailResponse, deletedDetailJson },
  },
  {
    name: "list handler rejects invalid cursor combinations with INVALID_CURSOR",
    ok: invalidCursorCode === "INVALID_CURSOR",
    detail: invalidCursorCode,
  },
  {
    name: "source includes repo/usecase/handler and package / CI wiring for BE-MS2-T09",
    ok:
      repoSource.includes("statusListPk") &&
      usecaseSource.includes("decodeListCursor") &&
      getHandlerSource.includes("export async function getClothingHandler") &&
      listHandlerSource.includes("export async function listClothingHandler") &&
      packageJson.includes('"test:clothing-ms2-unit": "node --import tsx/esm scripts/check-clothing-ms2-unit-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-ms2-unit"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T09 clothing unit spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T09 clothing unit spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
