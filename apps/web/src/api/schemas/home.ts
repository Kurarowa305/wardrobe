import type { TemplateListItemDto } from "./template";

export type RecommendationMode =
  "auto" | "spring" | "summer" | "autumn" | "winter";
export type HomeContext = {
  wardrobeId: string;
  regionRevision: number;
  targetDate: string;
};
export type WeatherFailure =
  | "fetch_failed"
  | "forecast_missing"
  | "invalid_response"
  | "cooldown"
  | "rate_limited"
  | "budget_exhausted"
  | "fetch_in_progress";
export type WeatherResponseDto = HomeContext &
  (
    | { status: "region_required"; region: null }
    | {
        status: "unavailable";
        reason: WeatherFailure;
        retryAfter: string | null;
      }
    | {
        status: "available";
        provider: "open-meteo";
        modelPolicy: "best_match";
        timezone: "Asia/Tokyo";
        temperatureUnit: "celsius";
        fetchedAt: string;
        expiresAt: string;
        delivery: "fresh" | "cache";
        daily: {
          apparentTemperatureMax: number | null;
          temperatureMax: number | null;
          temperatureMin: number | null;
          weatherCode: number | null;
        };
        derivation: {
          source:
            "apparent_temperature" | "temperature_max_fallback" | "unavailable";
          dressingIndex: 1 | 2 | 3 | null;
        };
      }
  );
export type RecommendedTemplate = TemplateListItemDto & { revision: number };
export type TemplateRecommendationsDto = HomeContext & {
  mode: RecommendationMode;
  status: "ready" | "empty" | "region_required" | "weather_required";
  basis:
    "manual" | "apparent_temperature" | "temperature_max_fallback" | "none";
  items: RecommendedTemplate[];
  reason?: WeatherFailure;
  retryAfter?: string | null;
};
