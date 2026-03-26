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

let postErrorCode = null;
try {
  await sharedDomainHandlers.template({
    requestId: "req_template_post",
    method: "POST",
    pathname: "/wardrobes/wd_123/templates",
    path: { wardrobeId: "wd_123" },
    query: {},
    body: { name: "通勤", clothingIds: ["cl_001"] },
    headers: { "content-type": "application/json" },
  });
} catch (error) {
  postErrorCode = error?.code ?? null;
}

const lambda = createLambdaHandler({ domain: "template" });
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/templates",
  pathParameters: { wardrobeId: "wd_123" },
  requestContext: { http: { method: "POST", path: "/wardrobes/wd_123/templates" }, requestId: "ctx_template_post" },
  headers: { "x-request-id": "req_template_lambda", "content-type": "application/json" },
  body: JSON.stringify({ name: "通勤", clothingIds: ["cl_001"] }),
});

const checks = [
  {
    name: "shared template domain handler routes POST collection requests to create handler shape",
    ok:
      postErrorCode === "NOT_FOUND",
    detail: postErrorCode,
  },
  {
    name: "template lambda entry accepts API-09 POST route and returns create-route response",
    ok:
      lambdaResponse.statusCode === 404 &&
      JSON.parse(lambdaResponse.body).error?.code === "NOT_FOUND",
    detail: lambdaResponse,
  },
  {
    name: "adapter source and package / CI wiring include template API-09 aggregate spec",
    ok:
      source.includes("createTemplateHandler") &&
      packageJson.includes('"test:template-ms3-api09": "node --import tsx/esm scripts/check-template-ms3-api09-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-ms3-api09"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T06 template API-09 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T06 template API-09 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
