import { createAppError } from "../../../core/errors/index.js";
import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { createTemplateRequestSchema, templateWardrobePathParamsSchema } from "../schema/templateSchema.js";
import { createTemplateUsecase, type TemplateUsecaseDependencies } from "../usecases/templateUsecase.js";

export const createTemplateRequestSchemas = {
  path: templateWardrobePathParamsSchema,
  body: createTemplateRequestSchema,
} as const;

export type CreateTemplateHandlerInput = {
  path?: unknown;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined> | undefined;
  requestId?: string;
  dependencies?: TemplateUsecaseDependencies | undefined;
};

export type CreateTemplateHandlerResponse = JsonResponse<{
  templateId: string;
}>;

function isJsonContentType(contentType: string | undefined): boolean {
  return typeof contentType === "string" && /^application\/json\b/i.test(contentType);
}

function assertJsonContentType(headers: CreateTemplateHandlerInput["headers"]): void {
  const raw = headers?.["content-type"];
  const contentType = Array.isArray(raw) ? raw[0] : raw;

  if (!isJsonContentType(contentType)) {
    throw createAppError("UNSUPPORTED_MEDIA_TYPE", {
      message: "Content-Type must be application/json.",
    });
  }
}

export async function createTemplateHandler(input: CreateTemplateHandlerInput): Promise<CreateTemplateHandlerResponse> {
  assertJsonContentType(input.headers);

  const parsed = parseRequest(createTemplateRequestSchemas, {
    path: input.path,
    body: input.body,
  }, input.requestId);

  const usecase = createTemplateUsecase(input.dependencies);
  const result = await usecase.create({
    wardrobeId: parsed.path.wardrobeId,
    name: parsed.body.name,
    clothingIds: parsed.body.clothingIds,
  });

  return createSuccessResponse({
    templateId: result.templateId,
  }, 201);
}
