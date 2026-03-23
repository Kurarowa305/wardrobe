import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const importSnippet = `import('./src/config/env.ts').then(({ env }) => {
  console.log(JSON.stringify(env));
});`;

const runEnvImport = (envOverrides) =>
  execFileSync(process.execPath, ["--import", "tsx/esm", "--eval", importSnippet], {
    cwd: root,
    env: {
      ...process.env,
      ...envOverrides,
    },
    encoding: "utf8",
  }).trim();

const runEnvImportExpectFailure = (envOverrides) => {
  const result = spawnSync(process.execPath, ["--import", "tsx/esm", "--eval", importSnippet], {
    cwd: root,
    env: {
      ...process.env,
      ...envOverrides,
    },
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return `${result.stdout ?? ""}${result.stderr ?? ""}`;
  }

  return null;
};

const validEnv = {
  NODE_ENV: "test",
  API_HOST: "0.0.0.0",
  API_PORT: "4010",
  AWS_REGION: "ap-northeast-1",
  DDB_ENDPOINT: "http://localhost:8000",
  TABLE_NAME: "WardrobeTable",
  S3_BUCKET: "wardrobe-dev-images",
  IMAGE_PUBLIC_BASE_URL: "http://localhost:4000/images",
  STORAGE_DRIVER: "s3",
};

const parsed = JSON.parse(runEnvImport(validEnv));
const envExample = await readFile(path.join(root, ".env.example"), "utf8");

const checks = [
  {
    name: "env exports validated values for backend infra settings",
    ok:
      parsed.nodeEnv === "test" &&
      parsed.host === "0.0.0.0" &&
      parsed.port === 4010 &&
      parsed.awsRegion === validEnv.AWS_REGION &&
      parsed.ddbEndpoint === validEnv.DDB_ENDPOINT &&
      parsed.tableName === validEnv.TABLE_NAME &&
      parsed.s3Bucket === validEnv.S3_BUCKET &&
      parsed.imagePublicBaseUrl === validEnv.IMAGE_PUBLIC_BASE_URL &&
      parsed.storageDriver === validEnv.STORAGE_DRIVER,
    detail: parsed,
  },
  {
    name: "invalid STORAGE_DRIVER is rejected",
    ok: (runEnvImportExpectFailure({ ...validEnv, STORAGE_DRIVER: "fs" }) ?? "").includes(
      "STORAGE_DRIVER",
    ),
  },
  {
    name: "invalid DDB_ENDPOINT is rejected",
    ok: (runEnvImportExpectFailure({ ...validEnv, DDB_ENDPOINT: "not-a-url" }) ?? "").includes(
      "DDB_ENDPOINT",
    ),
  },
  {
    name: ".env.example documents backend env variables",
    ok: [
      "AWS_REGION=",
      "DDB_ENDPOINT=",
      "TABLE_NAME=",
      "S3_BUCKET=",
      "IMAGE_PUBLIC_BASE_URL=",
      "STORAGE_DRIVER=",
    ].every((token) => envExample.includes(token)),
    detail: envExample,
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS0-T03 env spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS0-T03 env spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
