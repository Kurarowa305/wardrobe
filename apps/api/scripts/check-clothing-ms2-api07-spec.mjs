import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/clothing/handlers/deleteClothingHandler.ts");
const usecaseModulePath = path.join(root, "src/domains/clothing/usecases/clothingUsecase.ts");
const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const handlerSource = readFileSync(handlerModulePath, "utf8");
const usecaseSource = readFileSync(usecaseModulePath, "utf8");
const adapterSource = readFileSync(adapterModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { deleteClothingHandler } = await import(handlerModulePath);

const getCalls = [];
const deleteCalls = [];

const noContentResponse = await deleteClothingHandler({
  path: { wardrobeId: "wd_001", clothingId: "cl_001" },
  requestId: "req_delete",
  dependencies: {
    now: () => 1_736_000_000_000,
    repo: {
      async get(input) {
        getCalls.push(input);
        return {
          Item: {
            wardrobeId: input.wardrobeId,
            clothingId: input.clothingId,
            name: "黒Tシャツ",
            genre: "tops",
            imageKey: "images/top.png",
            status: "ACTIVE",
            wearCount: 4,
            lastWornAt: 1_735_690_000_000,
            createdAt: 1_735_680_000_000,
            deletedAt: null,
          },
        };
      },
      async delete(input) {
        deleteCalls.push(input);
        return { ok: true };
      },
      async list() {
        return { Items: [], LastEvaluatedKey: null };
      },
      async create() {
        return { ok: true };
      },
      async update() {
        return { ok: true };
      },
    },
  },
});

let notFoundCode = null;
try {
  await deleteClothingHandler({
    path: { wardrobeId: "wd_001", clothingId: "cl_missing" },
    requestId: "req_delete_not_found",
    dependencies: {
      repo: {
        async get() {
          return { Item: undefined };
        },
        async delete() {
          return { ok: true };
        },
        async list() {
          return { Items: [], LastEvaluatedKey: null };
        },
        async create() {
          return { ok: true };
        },
        async update() {
          return { ok: true };
        },
      },
    },
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const checks = [
  {
    name: "delete handler returns 204 no-content",
    ok: noContentResponse.statusCode === 204 && noContentResponse.body === "",
    detail: noContentResponse,
  },
  {
    name: "delete usecase fetches target and performs logical delete with deletedAt",
    ok:
      getCalls.length === 1 &&
      deleteCalls.length === 1 &&
      deleteCalls[0].wardrobeId === "wd_001" &&
      deleteCalls[0].clothingId === "cl_001" &&
      deleteCalls[0].deletedAt === 1_736_000_000_000,
    detail: { getCalls, deleteCalls },
  },
  {
    name: "delete handler returns NOT_FOUND when target clothing does not exist",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source exports API-07 delete flow and package / CI wiring",
    ok:
      handlerSource.includes("export async function deleteClothingHandler") &&
      usecaseSource.includes("async delete(input: DeleteClothingUsecaseInput)") &&
      adapterSource.includes("deleteClothingHandler") &&
      packageJson.includes('"test:clothing-ms2-api07": "node --import tsx/esm scripts/check-clothing-ms2-api07-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-ms2-api07"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T08 clothing API-07 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T08 clothing API-07 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
