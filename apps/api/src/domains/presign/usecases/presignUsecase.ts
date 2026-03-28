import { createS3Client, type S3Client, type S3PresignResult } from "../../../clients/s3.js";
import type { PresignIssueInput, PresignIssueResult } from "../entities/presign.js";
import { buildPresignImageKey } from "../repo/presignImageKey.js";

export type PresignUsecaseInput = PresignIssueInput;
export type PresignUsecaseOutput = PresignIssueResult;

export type PresignUsecaseDependencies = {
  s3Client?: Pick<S3Client, "presignPutObject"> | undefined;
  buildImageKey?: ((input: PresignIssueInput) => string) | undefined;
};

function toUsecaseOutput(result: S3PresignResult): PresignUsecaseOutput {
  return {
    imageKey: result.key,
    uploadUrl: result.uploadUrl,
    method: result.method,
    expiresAt: result.expiresAt,
  };
}

export function createPresignUsecase(dependencies: PresignUsecaseDependencies = {}) {
  const s3Client = dependencies.s3Client ?? createS3Client();
  const buildImageKey = dependencies.buildImageKey ?? buildPresignImageKey;

  return {
    async issue(input: PresignUsecaseInput): Promise<PresignUsecaseOutput> {
      const imageKey = buildImageKey(input);
      const result = await s3Client.presignPutObject({
        key: imageKey,
        contentType: input.contentType,
      });

      return toUsecaseOutput(result);
    },
  };
}
