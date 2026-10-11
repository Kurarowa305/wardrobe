import { apiClient } from "@/api/client";
import type {
  HomeContext,
  RecommendationMode,
  TemplateRecommendationsDto,
  WeatherResponseDto,
} from "@/api/schemas/home";

export function getWeather(context: HomeContext, signal?: AbortSignal) {
  return apiClient.get<WeatherResponseDto>(
    `/wardrobes/${encodeURIComponent(context.wardrobeId)}/weather`,
    {
      query: {
        date: context.targetDate,
        regionRevision: context.regionRevision,
      },
      signal,
    },
  );
}
export function getTemplateRecommendations(
  context: HomeContext,
  mode: RecommendationMode,
  signal?: AbortSignal,
) {
  return apiClient.get<TemplateRecommendationsDto>(
    `/wardrobes/${encodeURIComponent(context.wardrobeId)}/recommendations/templates`,
    {
      query: {
        mode,
        date: context.targetDate,
        regionRevision: context.regionRevision,
      },
      signal,
    },
  );
}
