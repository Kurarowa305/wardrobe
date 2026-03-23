import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";

process.env.AWS_REGION ??= "ap-northeast-1";
process.env.DDB_ENDPOINT ??= "http://127.0.0.1:8000";
process.env.TABLE_NAME ??= "wardrobe-local";
process.env.S3_BUCKET ??= "wardrobe-local-bucket";
process.env.IMAGE_PUBLIC_BASE_URL ??= "http://127.0.0.1:4566/public";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const routerModulePath = path.join(root, "src/entry/local/router.ts");
const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const lambdaModulePath = path.join(root, "src/entry/lambda/wardrobe_server.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const routerModule = await import(routerModulePath);
const adapterModule = await import(adapterModulePath);
const lambdaModule = await import(lambdaModulePath);

const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

function createJsonRequest({ method, url, body, headers = {} }) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const stream = Readable.from(payload ? [payload] : []);
  return Object.assign(stream, {
    method,
    url,
    headers,
  });
}

const dispatchCalls = [];
const router = routerModule.createLocalRouter({
  wardrobe: async (request) => {
    dispatchCalls.push({
      method: request.method,
      pathname: request.pathname,
      path: request.path,
      body: request.body,
      requestId: request.requestId,
    });

    if (request.method === "POST") {
      return {
        statusCode: 201,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({ wardrobeId: "wd_local_created" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ name: "Local Wardrobe" }),
    };
  },
});

const postDispatch = await router.dispatch(createJsonRequest({
  method: "POST",
  url: "/wardrobes",
  headers: {
    "content-type": "application/json",
    "x-request-id": "req_local_create",
  },
  body: { name: "My Wardrobe" },
}));
const postJson = JSON.parse(postDispatch.response.body);

const getDispatch = await router.dispatch(createJsonRequest({
  method: "GET",
  url: "/wardrobes/wd_local_created",
  headers: {
    "x-request-id": "req_local_get",
  },
}));
const getJson = JSON.parse(getDispatch.response.body);

const lambdaCreateHandler = adapterModule.createLambdaHandler({
  domain: "wardrobe",
  handler(request) {
    assert.equal(request.method, "POST");
    assert.equal(request.pathname, "/wardrobes");
    assert.deepEqual(request.body, { name: "Lambda Wardrobe" });

    return {
      statusCode: 201,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ wardrobeId: "wd_lambda_created" }),
    };
  },
});

const lambdaGetHandler = adapterModule.createLambdaHandler({
  domain: "wardrobe",
  handler(request) {
    assert.equal(request.method, "GET");
    assert.equal(request.path.wardrobeId, "wd_lambda_created");

    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ name: "Lambda Wardrobe" }),
    };
  },
});

const lambdaCreateResponse = await lambdaCreateHandler({
  rawPath: "/wardrobes",
  headers: {
    "content-type": "application/json",
    "x-request-id": "req_lambda_create",
  },
  body: JSON.stringify({ name: "Lambda Wardrobe" }),
  requestContext: {
    http: {
      method: "POST",
      path: "/wardrobes",
    },
    requestId: "ctx_lambda_create",
  },
});
const lambdaCreateJson = JSON.parse(lambdaCreateResponse.body);

const lambdaGetResponse = await lambdaGetHandler({
  rawPath: "/wardrobes/wd_lambda_created",
  pathParameters: { wardrobeId: "wd_lambda_created" },
  headers: {
    "x-request-id": "req_lambda_get",
  },
  requestContext: {
    http: {
      method: "GET",
      path: "/wardrobes/wd_lambda_created",
    },
    requestId: "ctx_lambda_get",
  },
});
const lambdaGetJson = JSON.parse(lambdaGetResponse.body);

const checks = [
  {
    name: "local router dispatches POST /wardrobes to wardrobe domain with request body and returns wardrobeId",
    ok:
      postDispatch.domain === "wardrobe" &&
      postDispatch.response.statusCode === 201 &&
      postJson.wardrobeId === "wd_local_created" &&
      dispatchCalls[0]?.method === "POST" &&
      dispatchCalls[0]?.pathname === "/wardrobes" &&
      dispatchCalls[0]?.body?.name === "My Wardrobe",
    detail: { postDispatch, postJson, dispatchCalls },
  },
  {
    name: "local router dispatches GET /wardrobes/{wardrobeId} to wardrobe domain and returns name",
    ok:
      getDispatch.domain === "wardrobe" &&
      getDispatch.wardrobeId === "wd_local_created" &&
      getDispatch.response.statusCode === 200 &&
      getJson.name === "Local Wardrobe" &&
      dispatchCalls[1]?.path?.wardrobeId === "wd_local_created",
    detail: { getDispatch, getJson, dispatchCalls },
  },
  {
    name: "lambda adapter supports wardrobe create and get flows for MS1 endpoints",
    ok:
      lambdaCreateResponse.statusCode === 201 &&
      lambdaCreateJson.wardrobeId === "wd_lambda_created" &&
      lambdaGetResponse.statusCode === 200 &&
      lambdaGetJson.name === "Lambda Wardrobe",
    detail: { lambdaCreateResponse, lambdaCreateJson, lambdaGetResponse, lambdaGetJson },
  },
  {
    name: "wardrobe lambda entry exports wardrobe domain handler",
    ok:
      lambdaModule.wardrobeLambdaEntry === "wardrobe" &&
      typeof lambdaModule.handler === "function",
    detail: lambdaModule,
  },
  {
    name: "package script and CI include aggregate wardrobe MS1 spec test",
    ok:
      packageJson.includes('"test:wardrobe-ms1": "node --import tsx/esm scripts/check-wardrobe-ms1-spec.mjs"') &&
      packageJson.includes('pnpm run test:wardrobe-ms1') &&
      ciSource.includes('pnpm --filter api test:wardrobe-ms1'),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS1-T05 wardrobe MS1 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS1-T05 wardrobe MS1 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
