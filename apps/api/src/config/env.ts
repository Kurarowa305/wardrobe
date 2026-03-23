import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const envFilePath = path.resolve(__dirname, "../../.env.local");

dotenv.config({ path: envFilePath, quiet: true });

const storageDriverSchema = z.enum(["local", "s3"]);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().trim().min(1).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  AWS_REGION: z.string().trim().min(1, "AWS_REGION is required"),
  DDB_ENDPOINT: z.string().trim().url("DDB_ENDPOINT must be a valid URL"),
  TABLE_NAME: z.string().trim().min(1, "TABLE_NAME is required"),
  S3_BUCKET: z.string().trim().min(1, "S3_BUCKET is required"),
  IMAGE_PUBLIC_BASE_URL: z
    .string()
    .trim()
    .url("IMAGE_PUBLIC_BASE_URL must be a valid URL"),
  STORAGE_DRIVER: storageDriverSchema.default("local"),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  host: parsedEnv.API_HOST,
  port: parsedEnv.API_PORT,
  awsRegion: parsedEnv.AWS_REGION,
  ddbEndpoint: parsedEnv.DDB_ENDPOINT,
  tableName: parsedEnv.TABLE_NAME,
  s3Bucket: parsedEnv.S3_BUCKET,
  imagePublicBaseUrl: parsedEnv.IMAGE_PUBLIC_BASE_URL,
  storageDriver: parsedEnv.STORAGE_DRIVER,
  envFilePath,
} as const;

export type Env = typeof env;
export type StorageDriver = z.infer<typeof storageDriverSchema>;
