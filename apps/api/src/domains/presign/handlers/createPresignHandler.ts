import { createAppError } from "../../../core/errors/index.js";
import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { createWardrobeUsecase, type WardrobeUsecaseRepo } from "../../wardrobe/usecases/wardrobeUsecase.js";
import { createPresignRequestSchema, createPresignResponseSchema, presignWardrobePathParamsSchema } from "../schema/presignSchema.js";
import { createPresignUsecase, type PresignUsecaseDependencies } from "../usecases/presignUsecase.js";

export const createPresignRequestSchemas = {
  path: presignWardrobePathParamsSchema,
  body: createPresignRequestSchema,
} as const;

export type CreatePresignHandlerDependencies = {
  wardrobeRepo?: WardrobeUsecaseRepo | undefined;
  presign?: PresignUsecaseDependencies | undefined;
};

export type CreatePresignHandlerInput = {
  path?: unknown;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined> | undefined;
  requestId?: string;
  dependencies?: CreatePresignHandlerDependencies | undefined;
};

export type CreatePresignHandlerResponse = JsonResponse<{
  imageKey: string;
  uploadUrl: string;
  method: "PUT";
  expiresAt: string;
}>;

function isJsonContentType(contentType: string | undefined): boolean {
  return typeof contentType === "string" && /^application\/json\b/i.test(contentType);
}

function assertJsonContentType(headers: CreatePresignHandlerInput["headers"]): void {
  const raw = headers?.["content-type"];
  const contentType = Array.isArray(raw) ? raw[0] : raw;

  if (!isJsonContentType(contentType)) {
    throw createAppError("UNSUPPORTED_MEDIA_TYPE", {
      message: "Content-Type must be application/json.",
    });
  }
}

export async function createPresignHandler(input: CreatePresignHandlerInput): Promise<CreatePresignHandlerResponse> {
  assertJsonContentType(input.headers);

  const parsed = parseRequest(createPresignRequestSchemas, {
    path: input.path,
    body: input.body,
  }, input.requestId);

  const wardrobeUsecase = createWardrobeUsecase({
    repo: input.dependencies?.wardrobeRepo,
  });

  await wardrobeUsecase.get({
    wardrobeId: parsed.path.wardrobeId,
  });

  const presignUsecase = createPresignUsecase(input.dependencies?.presign);
  const issued = await presignUsecase.issue({
    wardrobeId: parsed.path.wardrobeId,
    contentType: parsed.body.contentType,
    category: parsed.body.category,
    ...(parsed.body.extension ? { extension: parsed.body.extension } : {}),
  });

  const response = createPresignResponseSchema.parse(issued);
  return createSuccessResponse(response);
}
