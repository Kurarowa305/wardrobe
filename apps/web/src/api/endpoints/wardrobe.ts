import { apiClient } from "@/api/client";
import { AppError } from "@/lib/error/normalize";
import type {
  CreateWardrobeRequestDto,
  CreateWardrobeResponseDto,
  WardrobeDetailResponseDto,
} from "@/api/schemas/wardrobe";
import { isWardrobeId } from "@/api/schemas/wardrobe";

const WARDROBE_COLLECTION_PATH = "/wardrobes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCreateWardrobeResponseDto(value: unknown): CreateWardrobeResponseDto {
  if (isRecord(value) && isWardrobeId(value.wardrobeId)) {
    return { wardrobeId: value.wardrobeId };
  }

  throw new AppError({
    code: "INVALID_RESPONSE",
    message: "ワードローブ作成APIのレスポンス形式が不正です。",
    details: {
      expected: '{ "wardrobeId": "wd_..." }',
    },
  });
}

function parseWardrobeDetailResponseDto(value: unknown): WardrobeDetailResponseDto {
  if (isRecord(value) && typeof value.name === "string") {
    return { name: value.name };
  }

  throw new AppError({
    code: "INVALID_RESPONSE",
    message: "ワードローブ取得APIのレスポンス形式が不正です。",
    details: {
      expected: '{ "name": "My Wardrobe" }',
    },
  });
}

function buildWardrobeDetailPath(wardrobeId: string) {
  return `${WARDROBE_COLLECTION_PATH}/${wardrobeId}`;
}

export function createWardrobe(
  body: CreateWardrobeRequestDto,
): Promise<CreateWardrobeResponseDto> {
  return apiClient.post<unknown, CreateWardrobeRequestDto>(
    WARDROBE_COLLECTION_PATH,
    {
      body,
    },
  ).then((response) => parseCreateWardrobeResponseDto(response));
}

export function getWardrobe(wardrobeId: string): Promise<WardrobeDetailResponseDto> {
  return apiClient
    .get<unknown>(buildWardrobeDetailPath(wardrobeId))
    .then((response) => parseWardrobeDetailResponseDto(response));
}
