export type StorageDriver = "local" | "s3";

export type S3ClientConfig = {
  region: string;
  bucket: string;
  publicBaseUrl: string;
  storageDriver: StorageDriver;
};

export const createS3ClientConfig = (
  overrides: Partial<S3ClientConfig> = {},
): S3ClientConfig => ({
  region: overrides.region ?? "ap-northeast-1",
  bucket: overrides.bucket ?? "wardrobe-dev-images",
  publicBaseUrl: overrides.publicBaseUrl ?? "http://localhost:4000/images",
  storageDriver: overrides.storageDriver ?? "local",
});
