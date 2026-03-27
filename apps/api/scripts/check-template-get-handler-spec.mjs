import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/template/handlers/getTemplateHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { getTemplateHandler } = await import(handlerModulePath);

const response = await getTemplateHandler({
  path: { wardrobeId: "wd_001", templateId: "tp_001" },
  requestId: "req_template_get_handler",
  dependencies: {
    repo: {
      async list() {
        return { Items: [], LastEvaluatedKey: undefined };
      },
      async create() {
        return {};
      },
      async get() {
        return {
          Item: {
            wardrobeId: "wd_001",
            templateId: "tp_001",
            name: "休日コーデ",
            status: "ACTIVE",
            clothingIds: ["cl_001", "cl_002"],
            wearCount: 2,
            lastWornAt: 1735689600000,
            createdAt: 1735603200000,
            deletedAt: null,
            PK: "WARDROBE#wd_001",
            SK: "TEMPLATE#tp_001",
            statusListPk: "WARDROBE#wd_001#TEMPLATE#STATUS#ACTIVE",
            createdAtSk: "CREATED_AT#1735603200000#TEMPLATE#tp_001",
            wearCountSk: "WEAR_COUNT#0000000002#TEMPLATE#tp_001",
            lastWornAtSk: "LAST_WORN_AT#1735689600000#TEMPLATE#tp_001",
          },
        };
      },
    },
    clothingBatchGetRepo: {
      async batchGetByIds() {
        return [
          {
            Responses: {
              WardrobeTable: [
                {
                  clothingId: "cl_002",
                  name: "スラックス",
                  genre: "bottoms",
                  imageKey: "img/bottoms-2.jpg",
                  status: "DELETED",
                  wearCount: 3,
                  lastWornAt: 1735603200000,
                },
                {
                  clothingId: "cl_001",
                  name: "ニット",
                  genre: "tops",
                  imageKey: null,
                  status: "ACTIVE",
                  wearCount: 7,
                  lastWornAt: 1735689600000,
                },
              ],
            },
          },
        ];
      },
    },
  },
});

const responseJson = JSON.parse(response.body);

let validationErrorCode = null;
try {
  await getTemplateHandler({
    path: { wardrobeId: "", templateId: "tp_001" },
    requestId: "req_template_get_invalid_path",
  });
} catch (error) {
  validationErrorCode = error?.code ?? null;
}

const checks = [
  {
    name: "get handler validates path and returns 200 with template detail payload",
    ok:
      response.statusCode === 200 &&
      response.headers["content-type"]?.includes("application/json") &&
      responseJson.name === "休日コーデ" &&
      responseJson.clothingItems.length === 2,
    detail: { response, responseJson },
  },
  {
    name: "get handler includes deleted clothing item in response",
    ok: responseJson.clothingItems.some((item) => item.clothingId === "cl_002" && item.status === "DELETED"),
    detail: responseJson,
  },
  {
    name: "get handler rejects invalid path with VALIDATION_ERROR",
    ok: validationErrorCode === "VALIDATION_ERROR",
    detail: validationErrorCode,
  },
  {
    name: "source exports getTemplateHandler and package / CI wiring",
    ok:
      source.includes("export async function getTemplateHandler") &&
      packageJson.includes('"test:template-get-handler": "node --import tsx/esm scripts/check-template-get-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-get-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T07 template get handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T07 template get handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
