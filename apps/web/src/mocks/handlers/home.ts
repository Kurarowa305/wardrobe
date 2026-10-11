import { http, HttpResponse } from "msw";
import { getMockWardrobeRegion } from "./region";
import { wardrobeStore } from "./wardrobe";
import { applyMockScenario } from "./scenario";
import { getMockTemplates } from "./template";
import { getMockClothingItems } from "./clothing";
import { jstDate, nextJstMidnight } from "@/features/home/controller";
import type {
  HomeContext,
  RecommendationMode,
  WeatherResponseDto,
  TemplateRecommendationsDto,
} from "@/api/schemas/home";
const error = (status: number, reason: string) =>
  HttpResponse.json(
    {
      error: {
        code:
          status === 400
            ? "VALIDATION_ERROR"
            : status === 409
              ? "CONFLICT"
              : "NOT_FOUND",
        message: reason,
        details: { reason },
      },
    },
    { status },
  );
function contextFor(
  request: Request,
  wardrobeId: string,
  allowMode = false,
): HomeContext | Response {
  if (!wardrobeStore.has(wardrobeId)) return error(404, "WARDROBE_NOT_FOUND");
  const query = new URL(request.url).searchParams;
  const allowed = allowMode
    ? ["date", "regionRevision", "mode"]
    : ["date", "regionRevision"];
  if (
    [...query.keys()].some(
      (key) => !allowed.includes(key) || query.getAll(key).length !== 1,
    )
  )
    return error(400, "INVALID_QUERY");
  const date = query.get("date") ?? "",
    revision = query.get("regionRevision") ?? "";
  const parsedDate = Date.parse(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsedDate) ||
    new Date(parsedDate).toISOString().slice(0, 10) !== date ||
    !/^(0|[1-9]\d*)$/.test(revision) ||
    !Number.isSafeInteger(Number(revision))
  )
    return error(400, "INVALID_QUERY");
  if (query.get("date") !== jstDate()) return error(409, "TARGET_DATE_CHANGED");
  const regionRevision = getMockWardrobeRegion(wardrobeId).revision;
  if (Number(query.get("regionRevision")) !== regionRevision)
    return error(409, "REGION_CHANGED");
  return { wardrobeId, regionRevision, targetDate: jstDate() };
}
const forecasts = new Map<string, WeatherResponseDto>();
function weather(context: HomeContext): WeatherResponseDto {
  if (!getMockWardrobeRegion(context.wardrobeId).region)
    return { ...context, status: "region_required", region: null };
  const key = JSON.stringify(context);
  const cached = forecasts.get(key);
  if (cached?.status === "available") return { ...cached, delivery: "cache" };
  const response: WeatherResponseDto = {
    ...context,
    status: "available",
    provider: "open-meteo",
    modelPolicy: "best_match",
    timezone: "Asia/Tokyo",
    temperatureUnit: "celsius",
    fetchedAt: new Date().toISOString(),
    expiresAt: new Date(nextJstMidnight()).toISOString(),
    delivery: "fresh",
    daily: {
      temperatureMax: 22,
      temperatureMin: 15,
      apparentTemperatureMax: 20,
      weatherCode: 3,
    },
    derivation: { source: "apparent_temperature", dressingIndex: 2 },
  };
  forecasts.set(key, response);
  return response;
}
export const homeHandlers = [
  http.get("*/wardrobes/:wardrobeId/weather", async ({ request, params }) => {
    const scenario = await applyMockScenario(request);
    if (scenario) return scenario;
    const context = contextFor(request, String(params.wardrobeId));
    if (context instanceof Response) return context;
    return HttpResponse.json(weather(context));
  }),
  http.get(
    "*/wardrobes/:wardrobeId/recommendations/templates",
    async ({ request, params }) => {
      const scenario = await applyMockScenario(request);
      if (scenario) return scenario;
      const context = contextFor(request, String(params.wardrobeId), true);
      if (context instanceof Response) return context;
      const mode = (new URL(request.url).searchParams.get("mode") ??
        "auto") as RecommendationMode;
      if (!["auto", "spring", "summer", "autumn", "winter"].includes(mode))
        return HttpResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid mode" } },
          { status: 400 },
        );
      const regionRequired =
        mode === "auto" && !getMockWardrobeRegion(context.wardrobeId).region;
      const seasons =
        mode === "auto"
          ? ["season:spring", "season:autumn"]
          : [`season:${mode}`];
      const clothingById = new Map(getMockClothingItems().map(item => [item.clothingId, item]));
      const items = regionRequired
        ? []
        : getMockTemplates()
            .flatMap(template => {
              const clothingItems = template.clothingItems.map(item => clothingById.get(item.clothingId));
              return clothingItems.every((item): item is NonNullable<typeof item> => item !== undefined && item.status === "ACTIVE")
                ? [{ ...template, clothingItems }]
                : [];
            })
            .filter(
              (item) =>
                item.status === "ACTIVE" &&
                item.clothingItems.length > 0 &&
                (item.tagIds.includes("season:all") ||
                  item.tagIds.some((tag) => seasons.includes(tag))) &&
                item.clothingItems.every(
                  (clothing) => clothing.status === "ACTIVE",
                ),
            )
            .sort(
              (a, b) =>
                Math.max(...a.clothingItems.map((item) => item.lastWornAt)) -
                  Math.max(...b.clothingItems.map((item) => item.lastWornAt)) ||
                a.createdAt - b.createdAt ||
                (a.templateId < b.templateId
                  ? -1
                  : a.templateId > b.templateId
                    ? 1
                    : 0),
            )
            .slice(0, 3)
            .map((item) => ({
              templateId: item.templateId,
              name: item.name,
              tagIds: item.tagIds,
              revision: item.revision,
              clothingItems: item.clothingItems.map(
                ({ clothingId, imageKey, status }) => ({
                  clothingId,
                  imageKey,
                  status,
                }),
              ),
            }));
      const response: TemplateRecommendationsDto = {
        ...context,
        mode,
        status: regionRequired
          ? "region_required"
          : items.length
            ? "ready"
            : "empty",
        basis: regionRequired
          ? "none"
          : mode === "auto"
            ? "apparent_temperature"
            : "manual",
        items,
      };
      return HttpResponse.json(response);
    },
  ),
];
