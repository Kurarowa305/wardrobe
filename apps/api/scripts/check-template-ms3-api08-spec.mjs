import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const handlerModulePath = path.join(root, "src/domains/template/handlers/listTemplateHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(adapterModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createLambdaHandler } = await import(adapterModulePath);
const { listTemplateHandler } = await import(handlerModulePath);

const templateListDependencies = {
  repo: {
    async list() {
      return {
        Items: [],
      };
    },
    async create() {
      return { ok: true };
    },
    async get() {
      return {};
    },
    async update() {
      return { ok: true };
    },
    async delete() {
      return { ok: true };
    },
  },
};

const listResponse = await listTemplateHandler({
  path: { wardrobeId: "wd_123" },
  query: { order: "asc", limit: "3" },
  requestId: "req_template_list",
  dependencies: templateListDependencies,
});

const lambda = createLambdaHandler({
  domain: "template",
  handler(request) {
    return listTemplateHandler({
      path: request.path,
      query: request.query,
      requestId: request.requestId,
      dependencies: templateListDependencies,
    });
  },
});
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/templates",
  rawQueryString: "order=asc&limit=3",
  pathParameters: { wardrobeId: "wd_123" },
  requestContext: { http: { method: "GET", path: "/wardrobes/wd_123/templates" }, requestId: "ctx_template_list" },
  headers: { "x-request-id": "req_template_lambda" },
});

const checks = [
  {
    name: "shared template domain handler routes GET collection requests to list handler shape",
    ok:
      listResponse.statusCode === 200 &&
      Array.isArray(JSON.parse(listResponse.body).items) &&
      JSON.parse(listResponse.body).nextCursor === null,
    detail: listResponse,
  },
  {
    name: "template lambda entry returns API-08 response envelope for collection GET requests",
    ok:
      lambdaResponse.statusCode === 200 &&
      Array.isArray(JSON.parse(lambdaResponse.body).items) &&
      JSON.parse(lambdaResponse.body).nextCursor === null,
    detail: lambdaResponse,
  },
  {
    name: "adapter source and package / CI wiring include template API-08 aggregate spec",
    ok:
      source.includes("listTemplateHandler") &&
      packageJson.includes('"test:template-ms3-api08": "node --import tsx/esm scripts/check-template-ms3-api08-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-ms3-api08"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T05 template API-08 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T05 template API-08 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
