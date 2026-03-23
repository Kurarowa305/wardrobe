import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, "../.env.local");

dotenv.config({ path: envFilePath });

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.API_HOST ?? "127.0.0.1",
  port: Number(process.env.API_PORT ?? "3001"),
  awsRegion: process.env.AWS_REGION ?? "ap-northeast-1",
  ddbEndpoint: process.env.DDB_ENDPOINT ?? "http://localhost:8000",
  s3Bucket: process.env.S3_BUCKET ?? "wardrobe-dev-images",
  envFilePath,
} as const;
