import type {
  CreateTemplateRequestDto,
  TemplateDetailClothingItemDto,
  TemplateDetailResponseDto,
  TemplateListItemDto,
  TemplateListOrderDto,
  TemplateListResponseDto,
  UpdateTemplateRequestDto,
} from "@/api/schemas/template";
import { DEMO_IDS } from "@/constants/routes";
import {
  TEMPLATE_FIXTURE_WARDROBE_ID,
  templateDetailFixtures,
} from "@/mocks/fixtures/template";
import { clothingDetailFixtureById } from "@/mocks/fixtures/clothing";
import { HttpResponse, http, passthrough } from "msw";

import { applyMockScenario } from "./scenario";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const CURSOR_PREFIX = "offset:";
const TEMPLATE_ID_PREFIX = "tp_mock_";

let mockTemplateIdSequence = 1;
let templateStore = initializeTemplateStore();

function initializeTemplateStore(): TemplateRecord[] {
  return templateDetailFixtures.map((fixture) => ({
    templateId: fixture.templateId,
    name: fixture.name,
    status: fixture.status,
    wearCount: fixture.wearCount,
    lastWornAt: fixture.lastWornAt,
    clothingItems: fixture.clothingItems.map((item) => ({ ...item })),
  }));
}

type TemplateRecord = TemplateDetailResponseDto & {
  templateId: string;
};

function isSupportedWardrobeId(wardrobeId: string) {
  return wardrobeId === TEMPLATE_FIXTURE_WARDROBE_ID || wardrobeId === DEMO_IDS.wardrobe;
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

function parseOrder(value: string | null): TemplateListOrderDto | null {
  if (value === null || value.length === 0) {
    return "asc";
  }

  if (value === "asc" || value === "desc") {
    return value;
  }

  return null;
}

function parseLimit(value: string | null): number | null {
  if (value === null || value.length === 0) {
    return DEFAULT_PAGE_SIZE;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_PAGE_SIZE) {
    return null;
  }

  return parsed;
}

function parseCursor(value: string | null): number | null {
  if (value === null || value.length === 0) {
    return 0;
  }

  if (!value.startsWith(CURSOR_PREFIX)) {
    return null;
  }

  const parsed = Number.parseInt(value.slice(CURSOR_PREFIX.length), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function encodeCursor(offset: number) {
  return `${CURSOR_PREFIX}${offset}`;
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

function normalizeClothingIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const normalized = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);

  if (normalized.length !== value.length) {
    return null;
  }

  if (new Set(normalized).size !== normalized.length) {
    return null;
  }

  return normalized;
}

function resolveClothingItems(clothingIds: string[]): TemplateDetailClothingItemDto[] | null {
  const clothingItems = clothingIds
    .map((clothingId) => clothingDetailFixtureById[clothingId])
    .filter((clothing): clothing is TemplateDetailClothingItemDto => clothing !== undefined)
    .map((clothing) => ({ ...clothing }));

  if (clothingItems.length !== clothingIds.length) {
    return null;
  }

  return clothingItems;
}

function parseCreateRequest(body: unknown): CreateTemplateRequestDto | null {
  if (!isRecord(body) || typeof body.name !== "string") {
    return null;
  }

  const name = body.name.trim();
  if (name.length === 0) {
    return null;
  }

  const clothingIds = normalizeClothingIds(body.clothingIds);
  if (!clothingIds) {
    return null;
  }

  return {
    name,
    clothingIds,
  };
}

function parseUpdateRequest(body: unknown): UpdateTemplateRequestDto | null {
  if (!isRecord(body)) {
    return null;
  }

  const next: UpdateTemplateRequestDto = {};

  if (hasOwnRecordKey(body, "name")) {
    if (typeof body.name !== "string") {
      return null;
    }

    const name = body.name.trim();
    if (name.length === 0) {
      return null;
    }

    next.name = name;
  }

  if (hasOwnRecordKey(body, "clothingIds")) {
    const clothingIds = normalizeClothingIds(body.clothingIds);
    if (!clothingIds) {
      return null;
    }

    next.clothingIds = clothingIds;
  }

  return next;
}

function buildListItems(order: TemplateListOrderDto): TemplateListItemDto[] {
  const activeItems = templateStore
    .filter((template) => template.status === "ACTIVE")
    .map((template) => ({
      templateId: template.templateId,
      name: template.name,
      clothingItems: template.clothingItems.map((clothingItem) => ({
        clothingId: clothingItem.clothingId,
        imageKey: clothingItem.imageKey,
        status: clothingItem.status,
      })),
    }));

  if (order === "desc") {
    return [...activeItems].reverse();
  }

  return activeItems;
}

function createMockTemplateId() {
  const nextId = `${TEMPLATE_ID_PREFIX}${String(mockTemplateIdSequence).padStart(4, "0")}`;
  mockTemplateIdSequence += 1;
  return nextId;
}

function shouldBypassTemplateApiMock(request: Request) {
  if (request.mode === "navigate" || request.destination === "document") {
    return true;
  }

  if (
    request.headers.has("rsc") ||
    request.headers.has("next-router-prefetch") ||
    request.headers.has("next-router-state-tree")
  ) {
    return true;
  }

  const accept = request.headers.get("accept")?.toLowerCase() ?? "";
  return accept.includes("text/x-component") || accept.includes("text/html");
}

export const templateHandlers = [
  http.get("*/wardrobes/:wardrobeId/templates", async ({ params, request }) => {
    if (shouldBypassTemplateApiMock(request)) {
      return passthrough();
    }

    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) {
      return scenarioResponse;
    }

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) {
      return createNotFoundResponse("wardrobe");
    }

    const url = new URL(request.url);
    const order = parseOrder(url.searchParams.get("order"));
    if (order === null) {
      return createErrorResponse(400, "VALIDATION_ERROR", "order must be asc or desc");
    }

    const limit = parseLimit(url.searchParams.get("limit"));
    if (limit === null) {
      return createErrorResponse(400, "VALIDATION_ERROR", "limit must be 1..50");
    }

    const cursor = parseCursor(url.searchParams.get("cursor"));
    if (cursor === null) {
      return createErrorResponse(400, "INVALID_CURSOR", "cursor is invalid");
    }

    const items = buildListItems(order);
    if (cursor > items.length) {
      return createErrorResponse(400, "INVALID_CURSOR", "cursor is out of range");
    }

    const pagedItems = items.slice(cursor, cursor + limit);
    const nextOffset = cursor + pagedItems.length;
    const nextCursor = nextOffset < items.length ? encodeCursor(nextOffset) : null;

    return HttpResponse.json<TemplateListResponseDto>({
      items: pagedItems,
      nextCursor,
    });
  }),

  http.get("*/wardrobes/:wardrobeId/templates/:templateId", async ({ params, request }) => {
    if (shouldBypassTemplateApiMock(request)) {
      return passthrough();
    }

    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) {
      return scenarioResponse;
    }

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) {
      return createNotFoundResponse("wardrobe");
    }

    const templateId = String(params.templateId ?? "");
    const template = templateStore.find((item) => item.templateId === templateId);
    if (!template) {
      return createNotFoundResponse("template");
    }

    return HttpResponse.json<TemplateDetailResponseDto>({
      name: template.name,
      status: template.status,
      wearCount: template.wearCount,
      lastWornAt: template.lastWornAt,
      clothingItems: template.clothingItems,
    });
  }),

  http.post("*/wardrobes/:wardrobeId/templates", async ({ params, request }) => {
    if (shouldBypassTemplateApiMock(request)) {
      return passthrough();
    }

    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) {
      return scenarioResponse;
    }

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) {
      return createNotFoundResponse("wardrobe");
    }

    const body = await parseBody<unknown>(request);
    const payload = parseCreateRequest(body);
    if (!payload) {
      return createErrorResponse(400, "VALIDATION_ERROR", "request body is invalid");
    }

    const clothingItems = resolveClothingItems(payload.clothingIds);
    if (!clothingItems) {
      return createErrorResponse(400, "VALIDATION_ERROR", "clothingIds include unknown id");
    }

    templateStore = [
      ...templateStore,
      {
        templateId: createMockTemplateId(),
        name: payload.name,
        status: "ACTIVE",
        wearCount: 0,
        lastWornAt: 0,
        clothingItems,
      },
    ];

    return new HttpResponse(null, { status: 201 });
  }),

  http.patch("*/wardrobes/:wardrobeId/templates/:templateId", async ({ params, request }) => {
    if (shouldBypassTemplateApiMock(request)) {
      return passthrough();
    }

    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) {
      return scenarioResponse;
    }

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) {
      return createNotFoundResponse("wardrobe");
    }

    const templateId = String(params.templateId ?? "");
    const templateIndex = templateStore.findIndex((item) => item.templateId === templateId);
    if (templateIndex === -1) {
      return createNotFoundResponse("template");
    }

    const body = await parseBody<unknown>(request);
    const payload = parseUpdateRequest(body);
    if (!payload) {
      return createErrorResponse(400, "VALIDATION_ERROR", "request body is invalid");
    }

    const current = templateStore[templateIndex];
    const nextClothingItems = payload.clothingIds
      ? resolveClothingItems(payload.clothingIds)
      : current.clothingItems;

    if (!nextClothingItems) {
      return createErrorResponse(400, "VALIDATION_ERROR", "clothingIds include unknown id");
    }

    templateStore = templateStore.map((template, index) => {
      if (index !== templateIndex) {
        return template;
      }

      return {
        ...template,
        name: payload.name ?? template.name,
        clothingItems: nextClothingItems,
      };
    });

    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("*/wardrobes/:wardrobeId/templates/:templateId", async ({ params, request }) => {
    if (shouldBypassTemplateApiMock(request)) {
      return passthrough();
    }

    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) {
      return scenarioResponse;
    }

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) {
      return createNotFoundResponse("wardrobe");
    }

    const templateId = String(params.templateId ?? "");
    const templateIndex = templateStore.findIndex((item) => item.templateId === templateId);
    if (templateIndex === -1) {
      return createNotFoundResponse("template");
    }

    templateStore = templateStore.map((template, index) => {
      if (index !== templateIndex) {
        return template;
      }

      return {
        ...template,
        status: "DELETED",
      };
    });

    return new HttpResponse(null, { status: 204 });
  }),
];
