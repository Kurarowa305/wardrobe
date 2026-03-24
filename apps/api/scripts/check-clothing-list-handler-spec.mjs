import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/clothing/handlers/listClothingHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { listClothingHandler } = await import(handlerModulePath);

const usecaseCalls = [];
const response = await listClothingHandler({
  path: { wardrobeId: "wd_001" },
  query: { order: "desc", genre: "tops", limit: "2" },
  requestId: "req_handler",
  dependencies: {
    repo: {
      async list(input) {
        usecaseCalls.push(input);
        return {
          Items: [{ clothingId: "cl_001", name: "白シャツ", genre: "tops", imageKey: null }],
          LastEvaluatedKey: null,
        };
      },
    },
  },
});

let validationCode = null;
try {
  await listClothingHandler({
    path: { wardrobeId: "   " },
    query: { limit: "0" },
    requestId: "req_invalid",
  });
} catch (error) {
  validationCode = error?.code ?? null;
}

const responseJson = JSON.parse(response.body);

const checks = [
  {
    name: "list handler validates path/query and returns clothing list success response",
    ok:
      response.statusCode === 200 &&
      response.headers["content-type"]?.includes("application/json") &&
      responseJson.items.length === 1 &&
      responseJson.items[0].clothingId === "cl_001" &&
      responseJson.nextCursor === null,
    detail: { response, responseJson },
  },
  {
    name: "list handler coerces numeric limit and forwards query parameters to usecase dependencies",
    ok:
      usecaseCalls.length === 1 &&
      usecaseCalls[0].limit === 2 &&
      usecaseCalls[0].scanIndexForward === false,
    detail: usecaseCalls,
  },
  {
    name: "list handler rejects invalid wardrobeId/limit with VALIDATION_ERROR",
    ok: validationCode === "VALIDATION_ERROR",
    detail: validationCode,
  },
  {
    name: "source exports listClothingHandler plus package script / CI wiring",
    ok:
      source.includes("export async function listClothingHandler") &&
      packageJson.includes('"test:clothing-list-handler": "node --import tsx/esm scripts/check-clothing-list-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-list-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T04 clothing list handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T04 clothing list handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
