import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const src = fs.readFileSync(path.join(root, "src", "index.ts"), "utf8");
const envSrc = fs.readFileSync(path.join(root, "src", "env.ts"), "utf8");
const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
const tsconfig = JSON.parse(fs.readFileSync(path.join(root, "tsconfig.json"), "utf8"));

const checks = [
  {
    name: "dev script uses tsx watch",
    ok: packageJson.scripts?.dev === "tsx watch src/index.ts",
    detail: packageJson.scripts?.dev,
  },
  {
    name: "bootstrap test script is registered",
    ok: packageJson.scripts?.["test:bootstrap"] === "node scripts/check-bootstrap-spec.mjs",
    detail: packageJson.scripts?.["test:bootstrap"],
  },
  {
    name: ".env.local loading is centralized",
    ok: envSrc.includes('dotenv.config({ path: envFilePath });'),
    detail: envSrc,
  },
  {
    name: "local http server exposes /health",
    ok: src.includes('request.url === "/health"') && src.includes('status: "ok"'),
    detail: src,
  },
  {
    name: "NodeNext build settings are enabled",
    ok: tsconfig.compilerOptions?.module === 'NodeNext' && tsconfig.compilerOptions?.moduleResolution === 'NodeNext',
    detail: tsconfig.compilerOptions,
  },
  {
    name: ".env.example documents required bootstrap variables",
    ok: ["AWS_REGION=", "DDB_ENDPOINT=", "S3_BUCKET=", "API_PORT="].every((token) => envExample.includes(token)),
    detail: envExample,
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS0-T01 bootstrap spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS0-T01 bootstrap spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
