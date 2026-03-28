import { createAppError } from "../../../core/errors/index.js";
import { createNoContentResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import {
  templatePathParamsSchema,
  updateTemplateRequestSchema,
} from "../schema/templateSchema.js";
import { createTemplateUsecase, type TemplateUsecaseDependencies } from "../usecases/templateUsecase.js";

export const updateTemplateRequestSchemas = {
  path: templatePathParamsSchema,
  body: updateTemplateRequestSchema,
} as const;

export type UpdateTemplateHandlerInput = {
  path?: unknown;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined> | undefined;
  requestId?: string;
  dependencies?: TemplateUsecaseDependencies | undefined;
};

function isJsonContentType(contentType: string | undefined): boolean {
  return typeof contentType === "string" && /^application\/json\b/i.test(contentType);
}

function assertJsonContentType(headers: UpdateTemplateHandlerInput["headers"]): void {
  const raw = headers?.["content-type"];
  const contentType = Array.isArray(raw) ? raw[0] : raw;

  if (!isJsonContentType(contentType)) {
    throw createAppError("UNSUPPORTED_MEDIA_TYPE", {
      message: "Content-Type must be application/json.",
    });
  }
}

export async function updateTemplateHandler(input: UpdateTemplateHandlerInput) {
  assertJsonContentType(input.headers);

  const parsed = parseRequest(updateTemplateRequestSchemas, {
    path: input.path,
    body: input.body,
  }, input.requestId);

  const usecase = createTemplateUsecase(input.dependencies);
  await usecase.update({
    wardrobeId: parsed.path.wardrobeId,
    templateId: parsed.path.templateId,
    name: parsed.body.name,
    clothingIds: parsed.body.clothingIds,
  });

  return createNoContentResponse();
}
