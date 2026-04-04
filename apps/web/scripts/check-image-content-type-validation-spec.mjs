import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..", "..");

const endpointPath = path.join(webRoot, "src/api/endpoints/image.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const ciPath = path.join(repoRoot, ".github/workflows/ci.yml");

const endpoint = fs.readFileSync(endpointPath, "utf8");
const packageJson = fs.readFileSync(packageJsonPath, "utf8");
const ciSource = fs.readFileSync(ciPath, "utf8");

const checks = [
  {
    name: "対応形式の Content-Type を image/jpeg, image/png, image/webp に限定する",
    ok:
      endpoint.includes('normalizedType === "image/jpeg" || normalizedType === "image/png" || normalizedType === "image/webp"') &&
      endpoint.includes('if (extension === "jpg" || extension === "jpeg") {') &&
      endpoint.includes('if (extension === "png") {') &&
      endpoint.includes('if (extension === "webp") {'),
  },
  {
    name: "非対応形式を unsupported image type で reject する",
    ok: endpoint.includes('throw new Error("unsupported image type");'),
  },
  {
    name: "アップロード時に presign request と同一の Content-Type ヘッダーを送る",
    ok:
      endpoint.includes("const contentType = resolveContentType(file);") &&
      endpoint.includes('"Content-Type": contentType'),
  },
  {
    name: "テストスクリプトが package.json と CI に登録される",
    ok:
      packageJson.includes('"test:image-content-type-validation": "node scripts/check-image-content-type-validation-spec.mjs"') &&
      ciSource.includes("pnpm --filter web test:image-content-type-validation"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("image content type validation spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("image content type validation spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
