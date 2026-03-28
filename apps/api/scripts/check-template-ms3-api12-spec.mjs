import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(adapterModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { sharedDomainHandlers, createLambdaHandler } = await import(adapterModulePath);

let deleteErrorCode = null;
try {
  await sharedDomainHandlers.template({
    requestId: "req_template_delete",
    method: "DELETE",
    pathname: "/wardrobes/wd_123/templates/tp_123",
    path: { wardrobeId: "wd_123", templateId: "tp_123" },
    query: {},
    body: {},
    headers: {},
  });
} catch (error) {
  deleteErrorCode = error?.code ?? null;
}

const lambda = createLambdaHandler({ domain: "template" });
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/templates/tp_123",
  pathParameters: { wardrobeId: "wd_123", templateId: "tp_123" },
  requestContext: { http: { method: "DELETE", path: "/wardrobes/wd_123/templates/tp_123" }, requestId: "ctx_template_delete" },
  headers: { "x-request-id": "req_template_lambda_delete" },
  body: null,
});

const checks = [
  {
    name: "shared template domain handler routes DELETE detail requests to delete handler shape",
    ok: deleteErrorCode === "NOT_FOUND",
    detail: deleteErrorCode,
  },
  {
    name: "template lambda entry accepts API-12 DELETE route and returns delete-route response",
    ok:
      lambdaResponse.statusCode === 404 &&
      JSON.parse(lambdaResponse.body).error?.code === "NOT_FOUND",
    detail: lambdaResponse,
  },
  {
    name: "adapter source and package / CI wiring include template API-12 aggregate spec",
    ok:
      source.includes("deleteTemplateHandler") &&
      packageJson.includes('"test:template-ms3-api12": "node --import tsx/esm scripts/check-template-ms3-api12-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-ms3-api12"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T09 template API-12 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T09 template API-12 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
