import type {
  ClothingDetailResponseDto,
  ClothingGenreDto,
  ClothingListItemDto,
  ClothingListOrderDto,
  ClothingListResponseDto,
  CreateClothingRequestDto,
  UpdateClothingRequestDto,
} from "@/api/schemas/clothing";
import { CLOTHING_FIXTURE_WARDROBE_ID, clothingDetailFixtures } from "@/mocks/fixtures/clothing";
import { DEMO_IDS } from "@/constants/routes";
import { HttpResponse, http } from "msw";

import { applyMockScenario } from "./scenario";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const CURSOR_PREFIX = "offset:";
const CLOTHING_ID_PREFIX = "cl_mock_";

let mockClothingIdSequence = 1;
let clothingStore = initializeClothingStore();

function initializeClothingStore(): ClothingDetailResponseDto[] {
  return clothingDetailFixtures.map((fixture) => ({ ...fixture }));
}

function isSupportedWardrobeId(wardrobeId: string) {
  return wardrobeId === CLOTHING_FIXTURE_WARDROBE_ID || wardrobeId === DEMO_IDS.wardrobe;
}

function createErrorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function createNotFoundResponse(resource: string) {
  return createErrorResponse(404, "NOT_FOUND", `${resource} is not found`);
}

function parseOrder(value: string | null): ClothingListOrderDto | null {
  if (value === null || value.length === 0) {
    return "asc";
  }

  if (value === "asc" || value === "desc") {
    return value;
  }

  return null;
}

function normalizeGenre(value: unknown): ClothingGenreDto | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value === "tops" || value === "bottoms" || value === "others" ? value : undefined;
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
  return request.json().then((body) => body as TBody).catch(() => null);
}

function normalizeImageKey(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasOwnRecordKey(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCreateRequest(body: unknown): CreateClothingRequestDto | null {
  if (!isRecord(body) || typeof body.name !== "string") {
    return null;
  }
  const name = body.name.trim();
  const genre = normalizeGenre(body.genre);
  if (name.length === 0 || !genre) {
    return null;
  }
  const normalizedImageKey = normalizeImageKey(body.imageKey);
  if (body.imageKey !== undefined && normalizedImageKey === undefined) {
    return null;
  }
  return { name, genre, imageKey: normalizedImageKey ?? null };
}

function parseUpdateRequest(body: unknown): UpdateClothingRequestDto | null {
  if (!isRecord(body)) {
    return null;
  }
  const next: UpdateClothingRequestDto = {};
  if (hasOwnRecordKey(body, "name")) {
    if (typeof body.name !== "string") return null;
    const name = body.name.trim();
    if (name.length === 0) return null;
    next.name = name;
  }
  if (hasOwnRecordKey(body, "genre")) {
    const genre = normalizeGenre(body.genre);
    if (!genre) return null;
    next.genre = genre;
  }
  if (hasOwnRecordKey(body, "imageKey")) {
    const normalizedImageKey = normalizeImageKey(body.imageKey);
    if (normalizedImageKey === undefined) return null;
    next.imageKey = normalizedImageKey;
  }
  return next;
}

function buildListItems(order: ClothingListOrderDto, genre?: ClothingGenreDto): ClothingListItemDto[] {
  const activeItems = clothingStore
    .filter((clothing) => clothing.status === "ACTIVE")
    .filter((clothing) => (genre ? clothing.genre === genre : true))
    .map((clothing) => ({
      clothingId: clothing.clothingId,
      name: clothing.name,
      genre: clothing.genre,
      imageKey: clothing.imageKey,
    }));

  return order === "desc" ? [...activeItems].reverse() : activeItems;
}

function createMockClothingId() {
  const nextId = `${CLOTHING_ID_PREFIX}${String(mockClothingIdSequence).padStart(4, "0")}`;
  mockClothingIdSequence += 1;
  return nextId;
}

export const clothingHandlers = [
  http.get("*/wardrobes/:wardrobeId/clothing", async ({ params, request }) => {
    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) return scenarioResponse;

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) return createNotFoundResponse("wardrobe");

    const url = new URL(request.url);
    const order = parseOrder(url.searchParams.get("order"));
    if (order === null) return createErrorResponse(400, "VALIDATION_ERROR", "order must be asc or desc");

    const genreParam = url.searchParams.get("genre");
    const genre = normalizeGenre(genreParam);
    if (genreParam && !genre) return createErrorResponse(400, "VALIDATION_ERROR", "genre must be tops, bottoms or others");

    const limit = parseLimit(url.searchParams.get("limit"));
    if (limit === null) return createErrorResponse(400, "VALIDATION_ERROR", "limit must be 1..50");

    const cursor = parseCursor(url.searchParams.get("cursor"));
    if (cursor === null) return createErrorResponse(400, "INVALID_CURSOR", "cursor is invalid");

    const items = buildListItems(order, genre);
    if (cursor > items.length) return createErrorResponse(400, "INVALID_CURSOR", "cursor is out of range");

    const pagedItems = items.slice(cursor, cursor + limit);
    const nextOffset = cursor + pagedItems.length;
    const nextCursor = nextOffset < items.length ? encodeCursor(nextOffset) : null;

    return HttpResponse.json<ClothingListResponseDto>({ items: pagedItems, nextCursor });
  }),

  http.get("*/wardrobes/:wardrobeId/clothing/:clothingId", async ({ params, request }) => {
    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) return scenarioResponse;

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) return createNotFoundResponse("wardrobe");

    const clothingId = String(params.clothingId ?? "");
    const clothing = clothingStore.find((item) => item.clothingId === clothingId);
    if (!clothing) return createNotFoundResponse("clothing");

    return HttpResponse.json<ClothingDetailResponseDto>(clothing);
  }),

  http.post("*/wardrobes/:wardrobeId/clothing", async ({ params, request }) => {
    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) return scenarioResponse;

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) return createNotFoundResponse("wardrobe");

    const body = await parseBody<unknown>(request);
    const payload = parseCreateRequest(body);
    if (!payload) return createErrorResponse(400, "VALIDATION_ERROR", "request body is invalid");

    clothingStore.push({
      clothingId: createMockClothingId(),
      name: payload.name,
      genre: payload.genre,
      imageKey: payload.imageKey ?? null,
      status: "ACTIVE",
      wearCount: 0,
      lastWornAt: 0,
    });

    return new HttpResponse(null, { status: 201 });
  }),

  http.patch("*/wardrobes/:wardrobeId/clothing/:clothingId", async ({ params, request }) => {
    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) return scenarioResponse;

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) return createNotFoundResponse("wardrobe");

    const clothingId = String(params.clothingId ?? "");
    const target = clothingStore.find((item) => item.clothingId === clothingId);
    if (!target) return createNotFoundResponse("clothing");

    const body = await parseBody<unknown>(request);
    const payload = parseUpdateRequest(body);
    if (!payload) return createErrorResponse(400, "VALIDATION_ERROR", "request body is invalid");

    if (payload.name !== undefined) target.name = payload.name;
    if (payload.genre !== undefined) target.genre = payload.genre;
    if (payload.imageKey !== undefined) target.imageKey = payload.imageKey;

    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("*/wardrobes/:wardrobeId/clothing/:clothingId", async ({ params, request }) => {
    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) return scenarioResponse;

    const wardrobeId = String(params.wardrobeId ?? "");
    if (!isSupportedWardrobeId(wardrobeId)) return createNotFoundResponse("wardrobe");

    const clothingId = String(params.clothingId ?? "");
    const target = clothingStore.find((item) => item.clothingId === clothingId);
    if (!target) return createNotFoundResponse("clothing");

    target.status = "DELETED";
    return new HttpResponse(null, { status: 204 });
  }),
];
