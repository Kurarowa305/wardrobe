import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const s3 = await import(path.join(root, "src/clients/s3.ts"));
const source = readFileSync(path.join(root, "src/clients/s3.ts"), "utf8");
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
const localClient = s3.createS3Client({
  bucket: "wardrobe-local-images",
  publicBaseUrl: "http://localhost:4000/images",
  storageDriver: "local",
  endpoint: "http://localhost:4566",
  presignExpiresInSec: 300,
});
const cloudClient = s3.createS3Client({
  region: "us-east-1",
  bucket: "wardrobe-prod-images",
  publicBaseUrl: "https://images.example.com",
  storageDriver: "s3",
});

const localSigned = await localClient.presignPutObject({
  key: "clothing/wd_01/example.jpg",
  contentType: "image/jpeg",
});
const cloudSigned = await cloudClient.presignPutObject({
  key: "template/wd_01/example.webp",
  contentType: "image/webp",
  expiresInSec: 120,
});

for (const key of trackedEnvKeys) {
  setEnv(key, previousEnv[key]);
}

const checks = [
  {
    name: "default config exposes region bucket public base url and local storage defaults",
    ok:
      defaultConfig.region === "ap-northeast-1" &&
      defaultConfig.bucket === "wardrobe-dev-images" &&
      defaultConfig.publicBaseUrl === "http://localhost:4000/images" &&
      defaultConfig.storageDriver === "local" &&
      defaultConfig.presignExpiresInSec === 600,
    detail: defaultConfig,
  },
  {
    name: "local storage switches presigner to mock endpoint with static local credentials",
    ok:
      localClient.presigner.config.endpoint === "http://localhost:4566" &&
      localClient.presigner.config.accessMode === "local" &&
      localClient.presigner.config.credentials?.accessKeyId === "local",
    detail: localClient.presigner.config,
  },
  {
    name: "s3 storage keeps aws mode and does not force local credentials",
    ok:
      cloudClient.config.region === "us-east-1" &&
      cloudClient.presigner.config.accessMode === "aws" &&
      cloudClient.presigner.config.credentials === undefined,
    detail: cloudClient.presigner.config,
  },
  {
    name: "presign put object returns upload url method public url and request payload",
    ok:
      localSigned.method === "PUT" &&
      localSigned.uploadUrl === "http://localhost:4566/clothing/wd_01/example.jpg" &&
      localSigned.publicUrl === "http://localhost:4000/images/clothing/wd_01/example.jpg" &&
      localSigned.request.input.Bucket === "wardrobe-local-images" &&
      localSigned.request.input.ContentType === "image/jpeg" &&
      cloudSigned.uploadUrl ===
        "https://wardrobe-prod-images.s3.us-east-1.amazonaws.com/template/wd_01/example.webp" &&
      cloudSigned.request.input.ExpiresIn === 120,
    detail: { localSigned, cloudSigned },
  },
  {
    name: "client exposes public url builder and presign api for presigned url use cases",
    ok:
      typeof localClient.createImagePublicUrl === "function" &&
      typeof localClient.presignPutObject === "function" &&
      localClient.createImagePublicUrl("template/wd_01/image.png") ===
        "http://localhost:4000/images/template/wd_01/image.png",
  },
  {
    name: "source declares put object presign and local mock switching tokens",
    ok:
      [
        'operation: "PutObject"',
        'storageDriver === "local"',
        "presignPutObject",
        "createImagePublicUrl",
      ].every((token) => source.includes(token)),
  },
  {
    name: "package script and CI include s3 spec test",
    ok:
      packageJson.includes('"test:s3": "node --import tsx/esm scripts/check-s3-client-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:s3"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS0-T05 s3 client spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS0-T05 s3 client spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
