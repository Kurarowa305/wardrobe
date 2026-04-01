import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const s3 = await import(path.join(root, "src/clients/s3.ts"));
const packageJson = readFileSync(path.join(root, "package.json"), "utf8");
const ciSource = readFileSync(path.join(root, "../../.github/workflows/ci.yml"), "utf8");

const trackedEnvKeys = ["AWS_REGION", "S3_BUCKET", "IMAGE_PUBLIC_BASE_URL", "STORAGE_DRIVER"];
const previousEnv = Object.fromEntries(trackedEnvKeys.map((key) => [key, process.env[key]]));

const setEnv = (key, value) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

for (const key of trackedEnvKeys) {
  setEnv(key, undefined);
}

const defaultConfig = s3.createS3ClientConfig();

setEnv("AWS_REGION", "us-west-2");
setEnv("S3_BUCKET", "wardrobe-prod-images");
setEnv("IMAGE_PUBLIC_BASE_URL", "https://images.example.com");
setEnv("STORAGE_DRIVER", "s3");

const envConfig = s3.createS3ClientConfig();
const overrideConfig = s3.createS3ClientConfig({
  region: "ap-southeast-2",
  bucket: "wardrobe-override-images",
  publicBaseUrl: "https://override.example.com/images",
  storageDriver: "local",
  presignExpiresInSec: 1200,
});

const envClient = s3.createS3Client();
const presigned = await envClient.presignPutObject({
  key: "clothing/wd_900/example.jpg",
  contentType: "image/jpeg",
  expiresInSec: 180,
});

for (const key of trackedEnvKeys) {
  setEnv(key, previousEnv[key]);
}

const checks = [
  {
    name: "env 未設定時はローカル既定値で S3 設定を解決する",
    ok:
      defaultConfig.region === "ap-northeast-1"
      && defaultConfig.bucket === "wardrobe-dev-images"
      && defaultConfig.publicBaseUrl === "http://localhost:4000/images"
      && defaultConfig.storageDriver === "local"
      && defaultConfig.presignExpiresInSec === 600,
    detail: defaultConfig,
  },
  {
    name: "環境変数 AWS_REGION/S3_BUCKET/IMAGE_PUBLIC_BASE_URL/STORAGE_DRIVER を S3 設定へ反映できる",
    ok:
      envConfig.region === "us-west-2"
      && envConfig.bucket === "wardrobe-prod-images"
      && envConfig.publicBaseUrl === "https://images.example.com"
      && envConfig.storageDriver === "s3",
    detail: envConfig,
  },
  {
    name: "明示 override が環境変数より優先される",
    ok:
      overrideConfig.region === "ap-southeast-2"
      && overrideConfig.bucket === "wardrobe-override-images"
      && overrideConfig.publicBaseUrl === "https://override.example.com/images"
      && overrideConfig.storageDriver === "local"
      && overrideConfig.presignExpiresInSec === 1200,
    detail: overrideConfig,
  },
  {
    name: "環境変数で解決した S3 設定が presign リクエストと URL 生成に適用される",
    ok:
      envClient.config.region === "us-west-2"
      && envClient.config.bucket === "wardrobe-prod-images"
      && envClient.config.publicBaseUrl === "https://images.example.com"
      && envClient.config.storageDriver === "s3"
      && presigned.request.region === "us-west-2"
      && presigned.request.bucket === "wardrobe-prod-images"
      && presigned.request.storageDriver === "s3"
      && presigned.uploadUrl === "https://wardrobe-prod-images.s3.us-west-2.amazonaws.com/clothing/wd_900/example.jpg"
      && presigned.publicUrl === "https://images.example.com/clothing/wd_900/example.jpg",
    detail: { config: envClient.config, presigned },
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes('"test:s3-env-resolution": "node --import tsx/esm scripts/check-s3-env-resolution-spec.mjs"')
      && packageJson.includes("pnpm run test:s3-env-resolution")
      && ciSource.includes("pnpm --filter api test:s3-env-resolution"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("presign s3 env resolution spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("presign s3 env resolution spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
