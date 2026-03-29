export type StorageDriver = "local" | "s3";

export type S3TransportConfig = {
  region: string;
  bucket: string;
  publicBaseUrl: string;
  storageDriver: StorageDriver;
  endpoint?: string | undefined;
  presignExpiresInSec?: number | undefined;
};

export type S3ClientConfig = S3TransportConfig;

export type PutObjectPresignInput = {
  key: string;
  contentType: string;
  expiresInSec?: number | undefined;
};

export type S3PresignCommand = {
  operation: "PutObject";
  region: string;
  bucket: string;
  storageDriver: StorageDriver;
  endpoint?: string | undefined;
  input: {
    Bucket: string;
    Key: string;
    ContentType: string;
    ExpiresIn: number;
  };
};

export type S3PresignResult = {
  bucket: string;
  key: string;
  method: "PUT";
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
  request: S3PresignCommand;
};

const LOCAL_ENDPOINT_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const isLocalEndpoint = (endpoint: string | undefined): boolean =>
  endpoint !== undefined && LOCAL_ENDPOINT_PATTERN.test(endpoint);

const readNonEmptyEnv = (key: string): string | undefined => {
  const value = process.env[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readStorageDriverEnv = (): StorageDriver | undefined => {
  const value = readNonEmptyEnv("STORAGE_DRIVER");
  if (value === "local" || value === "s3") {
    return value;
  }

  return undefined;
};

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const joinUrl = (baseUrl: string, pathname: string): string =>
  `${stripTrailingSlash(baseUrl)}/${pathname.replace(/^\/+/, "")}`;

export const createS3ClientConfig = (
  overrides: Partial<S3ClientConfig> = {},
): S3ClientConfig => ({
  region: overrides.region ?? readNonEmptyEnv("AWS_REGION") ?? "ap-northeast-1",
  bucket: overrides.bucket ?? readNonEmptyEnv("S3_BUCKET") ?? "wardrobe-dev-images",
  publicBaseUrl: overrides.publicBaseUrl ?? readNonEmptyEnv("IMAGE_PUBLIC_BASE_URL") ?? "http://localhost:4000/images",
  storageDriver: overrides.storageDriver ?? readStorageDriverEnv() ?? "local",
  endpoint: overrides.endpoint,
  presignExpiresInSec: overrides.presignExpiresInSec ?? 600,
});

export const createS3TransportConfig = (
  overrides: Partial<S3TransportConfig> = {},
): S3TransportConfig => {
  const config = createS3ClientConfig(overrides);

  return {
    region: config.region,
    bucket: config.bucket,
    publicBaseUrl: config.publicBaseUrl,
    storageDriver: config.storageDriver,
    endpoint: config.endpoint,
    presignExpiresInSec: config.presignExpiresInSec,
  };
};

export const createS3Presigner = (
  overrides: Partial<S3TransportConfig> = {},
) => {
  const transport = createS3TransportConfig(overrides);
  const resolvedEndpoint =
    transport.storageDriver === "local"
      ? transport.endpoint ?? transport.publicBaseUrl
      : transport.endpoint;

  return {
    config: {
      region: transport.region,
      bucket: transport.bucket,
      publicBaseUrl: transport.publicBaseUrl,
      storageDriver: transport.storageDriver,
      endpoint: resolvedEndpoint,
      accessMode:
        transport.storageDriver === "local" || isLocalEndpoint(resolvedEndpoint)
          ? ("local" as const)
          : ("aws" as const),
      credentials:
        transport.storageDriver === "local" || isLocalEndpoint(resolvedEndpoint)
          ? {
              accessKeyId: "local",
              secretAccessKey: "local",
            }
          : undefined,
      presignExpiresInSec: transport.presignExpiresInSec,
    },
    presignPutObject: async (command: S3PresignCommand): Promise<S3PresignResult> => {
      const expiresAt = new Date(Date.now() + command.input.ExpiresIn * 1000).toISOString();
      const uploadBaseUrl =
        transport.storageDriver === "local"
          ? resolvedEndpoint ?? transport.publicBaseUrl
          : resolvedEndpoint ?? `https://${transport.bucket}.s3.${transport.region}.amazonaws.com`;

      return {
        bucket: command.bucket,
        key: command.input.Key,
        method: "PUT",
        uploadUrl: joinUrl(uploadBaseUrl, command.input.Key),
        publicUrl: joinUrl(transport.publicBaseUrl, command.input.Key),
        expiresAt,
        request: command,
      };
    },
  };
};

export type S3Presigner = ReturnType<typeof createS3Presigner>;
export type S3Client = ReturnType<typeof createS3Client>;

export const createS3Client = (overrides: Partial<S3ClientConfig> = {}) => {
  const config = createS3ClientConfig(overrides);
  const presigner = createS3Presigner(config);

  return {
    config,
    presigner,
    createImagePublicUrl: (key: string): string => joinUrl(config.publicBaseUrl, key),
    presignPutObject: (input: PutObjectPresignInput): Promise<S3PresignResult> =>
      presigner.presignPutObject({
        operation: "PutObject",
        region: config.region,
        bucket: config.bucket,
        storageDriver: config.storageDriver,
        endpoint: config.endpoint,
        input: {
          Bucket: config.bucket,
          Key: input.key,
          ContentType: input.contentType,
          ExpiresIn: input.expiresInSec ?? config.presignExpiresInSec ?? 600,
        },
      }),
  };
};
