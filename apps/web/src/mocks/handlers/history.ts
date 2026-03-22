import type {
  CreateHistoryRequestDto,
  HistoryDetailClothingItemDto,
  HistoryDetailResponseDto,
  HistoryListItemDto,
  HistoryListOrderDto,
  HistoryListResponseDto,
} from "@/api/schemas/history";
import { DEMO_IDS } from "@/constants/routes";
import {
  HISTORY_FIXTURE_WARDROBE_ID,
  historyDetailFixtures,
} from "@/mocks/fixtures/history";
import { clothingDetailFixtureById } from "@/mocks/fixtures/clothing";
import { templateDetailFixtureById } from "@/mocks/fixtures/template";
import { HttpResponse, http, passthrough } from "msw";

import { applyMockScenario } from "./scenario";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 30;
const CURSOR_PREFIX = "offset:";
const HISTORY_ID_PREFIX = "hs_mock_";
const DATE_PATTERN = /^\d{8}$/;

let mockHistoryIdSequence = 1;
let historyStore = initializeHistoryStore();

type HistoryRecord = HistoryDetailResponseDto & {
  historyId: string;
};

function initializeHistoryStore(): HistoryRecord[] {
  return historyDetailFixtures.map((fixture) => ({
    historyId: fixture.historyId,
    date: fixture.date,
    templateName: fixture.templateName,
    template: fixture.template ? { ...fixture.template } : null,
    clothingItems: fixture.clothingItems.map((item) => ({ ...item })),
  }));
}

function isSupportedWardrobeId(wardrobeId: string) {
  return wardrobeId === HISTORY_FIXTURE_WARDROBE_ID || wardrobeId === DEMO_IDS.wardrobe;
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

function parseOrder(value: string | null): HistoryListOrderDto | null {
  if (value === null || value.length === 0) {
    return "desc";
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

function parseDate(value: string | null): string | null {
  if (value === null || value.length === 0) {
    return null;
  }

  return DATE_PATTERN.test(value) ? value : null;
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

function resolveClothingItems(clothingIds: string[]): HistoryDetailClothingItemDto[] | null {
  const clothingItems = clothingIds
    .map((clothingId) => clothingDetailFixtureById[clothingId])
    .filter((clothing): clothing is HistoryDetailClothingItemDto => clothing !== undefined)
    .map((clothing) => ({ ...clothing }));

  if (clothingItems.length !== clothingIds.length) {
    return null;
  }

  return clothingItems;
}

function parseCreateRequest(body: unknown): CreateHistoryRequestDto | null {
  if (!isRecord(body) || typeof body.date !== "string" || !DATE_PATTERN.test(body.date)) {
    return null;
  }

  const templateId = typeof body.templateId === "string" ? body.templateId.trim() : undefined;
  const clothingIds = normalizeClothingIds(body.clothingIds);

  if (templateId && clothingIds) {
    return null;
  }

  if (templateId) {
    return {
      date: body.date,
      templateId,
    };
  }

  if (clothingIds) {
    return {
      date: body.date,
      clothingIds,
    };
  }

  return null;
}

function buildListItems(
  items: HistoryRecord[],
  order: HistoryListOrderDto,
  from: string | null,
  to: string | null,
): HistoryListItemDto[] {
  const filteredItems = items.filter((history) => {
    if (from !== null && history.date < from) {
      return false;
    }

    if (to !== null && history.date > to) {
      return false;
    }

    return true;
  });

  const sortedItems = [...filteredItems].sort((left, right) => {
    if (left.date === right.date) {
      return left.historyId.localeCompare(right.historyId);
    }

    return left.date.localeCompare(right.date);
  });

  const orderedItems = order === "desc" ? sortedItems.reverse() : sortedItems;

  return orderedItems.map((history) => ({
    historyId: history.historyId,
    date: history.date,
    name: history.templateName,
    clothingItems: history.clothingItems.map((clothingItem) => ({
      clothingId: clothingItem.clothingId,
      name: clothingItem.name,
      imageKey: clothingItem.imageKey,
      status: clothingItem.status,
    })),
  }));
}

function createMockHistoryId() {
  const nextId = `${HISTORY_ID_PREFIX}${String(mockHistoryIdSequence).padStart(4, "0")}`;
  mockHistoryIdSequence += 1;
  return nextId;
}

function shouldBypassHistoryApiMock(request: Request) {
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

export const historyHandlers = [
  http.get("*/wardrobes/:wardrobeId/histories", async ({ params, request }) => {
    if (shouldBypassHistoryApiMock(request)) {
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
      return createErrorResponse(400, "VALIDATION_ERROR", "limit must be 1..30");
    }

    const cursor = parseCursor(url.searchParams.get("cursor"));
    if (cursor === null) {
      return createErrorResponse(400, "INVALID_CURSOR", "cursor is invalid");
    }

    const from = parseDate(url.searchParams.get("from"));
    if (url.searchParams.has("from") && from === null) {
      return createErrorResponse(400, "VALIDATION_ERROR", "from must be yyyymmdd");
    }

    const to = parseDate(url.searchParams.get("to"));
    if (url.searchParams.has("to") && to === null) {
      return createErrorResponse(400, "VALIDATION_ERROR", "to must be yyyymmdd");
    }

    if (from !== null && to !== null && from > to) {
      return createErrorResponse(400, "VALIDATION_ERROR", "from must be less than or equal to to");
    }

    const items = buildListItems(historyStore, order, from, to);
    if (cursor > items.length) {
      return createErrorResponse(400, "INVALID_CURSOR", "cursor is out of range");
    }

    const pagedItems = items.slice(cursor, cursor + limit);
    const nextOffset = cursor + pagedItems.length;
    const nextCursor = nextOffset < items.length ? encodeCursor(nextOffset) : null;

    return HttpResponse.json<HistoryListResponseDto>({
      items: pagedItems,
      nextCursor,
    });
  }),

  http.get("*/wardrobes/:wardrobeId/histories/:historyId", async ({ params, request }) => {
    if (shouldBypassHistoryApiMock(request)) {
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

    const historyId = String(params.historyId ?? "");
    const history = historyStore.find((item) => item.historyId === historyId);
    if (!history) {
      return createNotFoundResponse("history");
    }

    return HttpResponse.json<HistoryDetailResponseDto>({
      date: history.date,
      templateName: history.templateName,
      template: history.template ? { ...history.template } : null,
      clothingItems: history.clothingItems.map((item) => ({ ...item })),
    });
  }),

  http.post("*/wardrobes/:wardrobeId/histories", async ({ params, request }) => {
    if (shouldBypassHistoryApiMock(request)) {
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

    let nextHistory: HistoryRecord | null = null;

    if ("templateId" in payload && typeof payload.templateId === "string") {
      const template = templateDetailFixtureById[payload.templateId];
      if (template) {
        nextHistory = {
          historyId: createMockHistoryId(),
          date: payload.date,
          templateName: template.name,
          template: {
            templateId: payload.templateId,
            name: template.name,
            wearCount: template.wearCount,
            lastWornAt: template.lastWornAt,
          },
          clothingItems: template.clothingItems.map((item: HistoryDetailClothingItemDto) => ({ ...item })),
        };
      }
    } else {
      const clothingItems = resolveClothingItems(payload.clothingIds);
      if (clothingItems) {
        nextHistory = {
          historyId: createMockHistoryId(),
          date: payload.date,
          templateName: null,
          template: null,
          clothingItems,
        };
      }
    }

    if (!nextHistory) {
      return createErrorResponse(404, "NOT_FOUND", "template or clothing is not found");
    }

    historyStore = [nextHistory, ...historyStore];

    return new HttpResponse(null, { status: 201 });
  }),

  http.delete("*/wardrobes/:wardrobeId/histories/:historyId", async ({ params, request }) => {
    if (shouldBypassHistoryApiMock(request)) {
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

    const historyId = String(params.historyId ?? "");
    const historyIndex = historyStore.findIndex((item) => item.historyId === historyId);
    if (historyIndex === -1) {
      return createNotFoundResponse("history");
    }

    historyStore = historyStore.filter((history) => history.historyId !== historyId);

    return new HttpResponse(null, { status: 204 });
  }),
];
