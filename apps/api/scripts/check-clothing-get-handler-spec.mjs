import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/clothing/handlers/getClothingHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { getClothingHandler } = await import(handlerModulePath);

const response = await getClothingHandler({
  path: { wardrobeId: "wd_001", clothingId: "cl_001" },
  requestId: "req_get",
  dependencies: {
    repo: {
      async get() {
        return {
          Item: {
            wardrobeId: "wd_001",
            clothingId: "cl_001",
            name: "白シャツ",
            genre: "tops",
            imageKey: "images/white-shirt.png",
            status: "DELETED",
            wearCount: 3,
            lastWornAt: 1_735_700_000_000,
          },
        };
      },
      async list() {
        return { Items: [], LastEvaluatedKey: null };
      },
      async create() {
        return { ok: true };
      },
    },
  },
});

let validationCode = null;
try {
  await getClothingHandler({
    path: { wardrobeId: " ", clothingId: "cl_001" },
    requestId: "req_invalid",
  });
} catch (error) {
  validationCode = error?.code ?? null;
}

let notFoundCode = null;
try {
  await getClothingHandler({
    path: { wardrobeId: "wd_001", clothingId: "cl_missing" },
    requestId: "req_not_found",
    dependencies: {
      repo: {
        async get() {
          return { Item: undefined };
        },
        async list() {
          return { Items: [], LastEvaluatedKey: null };
        },
        async create() {
          return { ok: true };
        },
      },
    },
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const responseJson = JSON.parse(response.body);

const checks = [
  {
    name: "get handler returns 200 clothing detail and includes deleted item status/wear counters",
    ok:
      response.statusCode === 200 &&
      response.headers["content-type"]?.includes("application/json") &&
      responseJson.clothingId === "cl_001" &&
      responseJson.status === "DELETED" &&
      responseJson.wearCount === 3 &&
      responseJson.lastWornAt === 1_735_700_000_000,
    detail: { response, responseJson },
  },
  {
    name: "get handler rejects invalid path with VALIDATION_ERROR",
    ok: validationCode === "VALIDATION_ERROR",
    detail: validationCode,
  },
  {
    name: "get handler returns NOT_FOUND when clothing does not exist",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source exports getClothingHandler plus package script / CI wiring",
    ok:
      source.includes("export async function getClothingHandler") &&
      packageJson.includes('"test:clothing-get-handler": "node --import tsx/esm scripts/check-clothing-get-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-get-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T06 clothing get handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T06 clothing get handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
