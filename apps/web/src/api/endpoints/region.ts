import { apiClient } from "@/api/client";
import { AppError } from "@/lib/error/normalize";
import {
  isRegionSearchResponse,
  isWardrobeRegionResponse,
  normalizeRegionSearch,
  type RegionSearchResponseDto,
  type WardrobeRegionResponseDto,
  type SaveWardrobeRegionRequestDto,
} from "@/api/schemas/region";
const invalid = () =>
  new AppError({
    code: "INVALID_RESPONSE",
    message: "地域APIの応答形式が不正です。",
  });
export async function searchRegions(
  q: string,
  signal?: AbortSignal,
): Promise<RegionSearchResponseDto> {
  const query = normalizeRegionSearch(q);
  if ([...query].length === 0 || [...query].length > 64)
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "地域名を1〜64文字で入力してください。",
    });
  const value = await apiClient.get<unknown>("/regions", {
    query: { q: query },
    signal,
  });
  if (!isRegionSearchResponse(value)) throw invalid();
  return value;
}
export async function getWardrobeRegion(
  wardrobeId: string,
  signal?: AbortSignal,
): Promise<WardrobeRegionResponseDto> {
  const value = await apiClient.get<unknown>(
    `/wardrobes/${encodeURIComponent(wardrobeId)}/region`,
    { signal },
  );
  if (!isWardrobeRegionResponse(value)) throw invalid();
  return value;
}
export async function saveWardrobeRegion(
  wardrobeId: string,
  body: SaveWardrobeRegionRequestDto,
  signal?: AbortSignal,
): Promise<WardrobeRegionResponseDto> {
  const value = await apiClient.put<unknown>(
    `/wardrobes/${encodeURIComponent(wardrobeId)}/region`,
    { body, signal },
  );
  if (!isWardrobeRegionResponse(value)) throw invalid();
  return value;
}
