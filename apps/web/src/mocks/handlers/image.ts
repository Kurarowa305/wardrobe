import type {
  GetPresignedUrlRequestDto,
  GetPresignedUrlResponseDto,
  ImageCategoryDto,
} from "@/api/schemas/image";
import { DEMO_IDS } from "@/constants/routes";
import { CLOTHING_FIXTURE_WARDROBE_ID } from "@/mocks/fixtures/clothing";
import { HttpResponse, http } from "msw";

import { applyMockScenario } from "./scenario";

const DEFAULT_EXPIRES_IN_MS = 5 * 60 * 1000;
const MOCK_UPLOAD_ORIGIN = "https://mock-storage.local";
const IMAGE_CONTENT_TYPE_PATTERN = /^image\/[a-z0-9.+-]+$/i;
const IMAGE_EXTENSION_PATTERN = /^[a-z0-9]+$/i;
const SUPPORTED_IMAGE_CATEGORIES: readonly ImageCategoryDto[] = ["clothing", "template"];

let mockImageSequence = 1;

function isSupportedWardrobeId(wardrobeId: string) {
  return wardrobeId === CLOTHING_FIXTURE_WARDROBE_ID || wardrobeId === DEMO_IDS.wardrobe;
}

function createErrorResponse(status: number, code: string, message: string) {
  return HttpResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function createNotFoundResponse(resource: string) {
  return createErrorResponse(404, "NOT_FOUND", `${resource} is not found`);
}

function parseBody<TBody>(request: Request): Promise<TBody | null> {
  return request
    .json()
    .then((body) => body as TBody)
    .catch(() => null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasOwnRecordKey(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function normalizeContentType(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!IMAGE_CONTENT_TYPE_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeCategory(value: unknown): ImageCategoryDto | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (SUPPORTED_IMAGE_CATEGORIES.includes(normalized as ImageCategoryDto)) {
    return normalized as ImageCategoryDto;
  }

  return null;
}

function normalizeExtension(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/^\./, "");
  if (!IMAGE_EXTENSION_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function inferExtensionFromContentType(contentType: string): string | null {
  const [, rawSubtype = ""] = contentType.split("/");
  const subtype = rawSubtype.toLowerCase();

  if (subtype === "jpeg" || subtype === "pjpeg") {
    return "jpg";
  }

  const normalizedSubtype = subtype.split("+")[0] ?? subtype;
  if (!IMAGE_EXTENSION_PATTERN.test(normalizedSubtype)) {
    return null;
  }

  return normalizedSubtype;
}

function parsePresignRequest(body: unknown): GetPresignedUrlRequestDto | null {
  if (!isRecord(body)) {
    return null;
  }

  const contentType = normalizeContentType(body.contentType);
  const category = normalizeCategory(body.category);

  if (!contentType || !category) {
    return null;
  }

  if (!hasOwnRecordKey(body, "extension")) {
    return {
      contentType,
      category,
    };
  }

  const extension = normalizeExtension(body.extension);
  if (!extension) {
    return null;
  }

  return {
    contentType,
    category,
    extension,
  };
}

function createMockImageKey(category: ImageCategoryDto, wardrobeId: string, extension: string) {
  const sequence = String(mockImageSequence).padStart(4, "0");
  mockImageSequence += 1;
  return `${category}/${wardrobeId}/img_mock_${Date.now()}_${sequence}.${extension}`;
}

function buildUploadUrl(imageKey: string) {
  return `${MOCK_UPLOAD_ORIGIN}/upload/${imageKey}`;
}

function buildExpiresAt() {
  return new Date(Date.now() + DEFAULT_EXPIRES_IN_MS).toISOString();
}

export const imagePresignHandlers = [
  http.post("*/wardrobes/:wardrobeId/images/presign", async ({ params, request }) => {
    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) {
      return scenarioResponse;
    }

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) {
      return createNotFoundResponse("wardrobe");
    }

    const body = await parseBody<unknown>(request);
    const payload = parsePresignRequest(body);
    if (!payload) {
      return createErrorResponse(400, "VALIDATION_ERROR", "request body is invalid");
    }

    const extension = payload.extension ?? inferExtensionFromContentType(payload.contentType);
    if (!extension) {
      return createErrorResponse(400, "VALIDATION_ERROR", "extension is invalid");
    }

    const imageKey = createMockImageKey(payload.category, wardrobeId, extension);

    return HttpResponse.json<GetPresignedUrlResponseDto>({
      imageKey,
      uploadUrl: buildUploadUrl(imageKey),
      method: "PUT",
      expiresAt: buildExpiresAt(),
    });
  }),
];

export function resetImagePresignHandlersState() {
  mockImageSequence = 1;
}
