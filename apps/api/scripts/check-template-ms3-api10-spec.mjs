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

let getErrorCode = null;
try {
  await sharedDomainHandlers.template({
    requestId: "req_template_get",
    method: "GET",
    pathname: "/wardrobes/wd_123/templates/tp_123",
    path: { wardrobeId: "wd_123", templateId: "tp_123" },
    query: {},
    body: {},
    headers: {},
  });
} catch (error) {
  getErrorCode = error?.code ?? null;
}

const lambda = createLambdaHandler({ domain: "template" });
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/templates/tp_123",
  pathParameters: { wardrobeId: "wd_123", templateId: "tp_123" },
  requestContext: { http: { method: "GET", path: "/wardrobes/wd_123/templates/tp_123" }, requestId: "ctx_template_get" },
  headers: { "x-request-id": "req_template_lambda_get" },
});

const checks = [
  {
    name: "shared template domain handler routes GET detail requests to get handler shape",
    ok: getErrorCode === "NOT_FOUND",
    detail: getErrorCode,
  },
  {
    name: "template lambda entry accepts API-10 GET detail route and returns get-route response",
    ok:
      lambdaResponse.statusCode === 404 &&
      JSON.parse(lambdaResponse.body).error?.code === "NOT_FOUND",
    detail: lambdaResponse,
  },
  {
    name: "adapter source and package / CI wiring include template API-10 aggregate spec",
    ok:
      source.includes("getTemplateHandler") &&
      packageJson.includes('"test:template-ms3-api10": "node --import tsx/esm scripts/check-template-ms3-api10-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-ms3-api10"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T07 template API-10 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T07 template API-10 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
