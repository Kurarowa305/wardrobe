import { createAppError, isAppError } from "../../../core/errors/index.js";
import { WeatherBudget } from "../../weather/budget.js";
import { jstDate } from "../../weather/forecast.js";
import { createWeatherService } from "../../weather/service.js";
import {
  createWeatherRepository,
  type WeatherRepository,
} from "../../weather/repository.js";
import {
  createRecommendationRepository,
  type RecommendationRepository,
  type RecommendationTemplate,
  type RecommendationClothing,
} from "./repository.js";
export type RecommendationMode =
  | "auto"
  | "spring"
  | "summer"
  | "autumn"
  | "winter";
export type RecommendationDependencies = {
  repository?: RecommendationRepository;
  weatherRepository?: Pick<WeatherRepository, "readContext">;
  now?: () => number;
  resolveForecast?: ReturnType<typeof createWeatherService>["resolveForecast"];
};
const unavailable = (reason: string) =>
  createAppError("SERVICE_UNAVAILABLE", { details: { reason } });
async function readCandidates(
  repository: RecommendationRepository,
  wardrobeId: string,
  seasons: string[],
  signal: AbortSignal,
) {
  const candidates: RecommendationTemplate[] = [];
  let cursor: Record<string, unknown> | undefined;
  const cursors = new Set<string>();
  do {
    signal.throwIfAborted();
    const page = await repository.readTemplates(wardrobeId, cursor, signal);
    for (const item of page.items)
      if (
        item.status === "ACTIVE" &&
        item.tagIds?.some(
          (tag) => tag === "season:all" || seasons.includes(tag),
        )
      )
        candidates.push(item);
    cursor = page.cursor;
    if (cursor) {
      const key = JSON.stringify(cursor);
      if (cursors.has(key)) throw unavailable("INVALID_PAGINATION");
      cursors.add(key);
    }
  } while (cursor);
  const ids = [...new Set(candidates.flatMap((item) => item.clothingIds))];
  const clothingMap = new Map<string, RecommendationClothing>();
  // One budget covers the whole paging and fan-out operation; concurrent I/O is not charged repeatedly.
  for (let offset = 0; offset < ids.length; offset += 320) {
    signal.throwIfAborted();
    const stop = new AbortController();
    const combined = AbortSignal.any([signal, stop.signal]);
    const requests = [];
    for (
      let start = offset;
      start < Math.min(offset + 320, ids.length);
      start += 80
    )
      requests.push(
        repository
          .readClothing(wardrobeId, ids.slice(start, start + 80), combined)
          .then((result) => {
            if (result.unprocessed) throw unavailable("UNPROCESSED_KEYS");
            return result;
          }),
      );
    try {
      for (const result of await Promise.all(requests))
        for (const item of result.items) clothingMap.set(item.clothingId, item);
    } catch (error) {
      stop.abort();
      await Promise.allSettled(requests);
      throw error;
    }
  }
  signal.throwIfAborted();
  return candidates
    .filter(
      (item) =>
        item.clothingIds.length > 0 &&
        item.clothingIds.every(
          (id) => clothingMap.get(id)?.status === "ACTIVE",
        ),
    )
    .map((item) => {
      const values = item.clothingIds.map(
        (id) => clothingMap.get(id)!.lastWornAt ?? 0,
      );
      if (
        !Number.isSafeInteger(item.revision ?? 0) ||
        (item.revision ?? 0) < 0 ||
        !Number.isFinite(item.createdAt) ||
        values.some(
          (value) =>
            typeof value !== "number" || !Number.isFinite(value) || value < 0,
        )
      )
        throw unavailable("INVALID_CANDIDATE");
      return { item, lastWornAt: Math.max(...values) };
    })
    .sort(
      (a, b) =>
        a.lastWornAt - b.lastWornAt ||
        a.item.createdAt - b.item.createdAt ||
        (a.item.templateId < b.item.templateId
          ? -1
          : a.item.templateId > b.item.templateId
            ? 1
            : 0),
    )
    .slice(0, 3)
    .map(({ item }) => ({
      templateId: item.templateId,
      name: item.name,
      tagIds: item.tagIds ?? [],
      revision: item.revision ?? 0,
      clothingItems: item.clothingIds.map((id) => ({
        clothingId: id,
        imageKey: clothingMap.get(id)!.imageKey ?? null,
        status: "ACTIVE" as const,
      })),
    }));
}
export function createRecommendationService(
  dependencies: RecommendationDependencies = {},
) {
  const now = dependencies.now ?? Date.now;
  return {
    async get(
      input: {
        wardrobeId: string;
        date: string;
        regionRevision: number;
        mode: RecommendationMode;
      },
      budget = new WeatherBudget(now),
    ) {
      const repository =
        dependencies.repository ?? createRecommendationRepository();
      const contexts =
        dependencies.weatherRepository ?? createWeatherRepository();
      const checkDate = () => {
        if (input.date !== jstDate(now()))
          throw createAppError("CONFLICT", {
            details: {
              reason: "TARGET_DATE_CHANGED",
              targetDate: jstDate(now()),
            },
          });
      };
      const context = async () => {
        const value = await budget.run("db", (signal) =>
          contexts.readContext(input.wardrobeId, signal),
        );
        if (!value) throw createAppError("NOT_FOUND");
        if (value.revision !== input.regionRevision)
          throw createAppError("CONFLICT", {
            details: { reason: "REGION_CHANGED" },
          });
        return value;
      };
      checkDate();
      const initial = await context();
      const base = {
        wardrobeId: input.wardrobeId,
        regionRevision: input.regionRevision,
        targetDate: input.date,
        mode: input.mode,
      };
      const finish = async <T>(result: T) => {
        checkDate();
        await context();
        checkDate();
        return { ...base, ...result };
      };
      let seasons = [`season:${input.mode}`],
        basis = "manual";
      if (input.mode === "auto") {
        if (!initial.region)
          return finish({
            status: "region_required",
            basis: "none",
            items: [],
          });
        const weather = await (
          dependencies.resolveForecast ?? createWeatherService().resolveForecast
        )(initial.region, input.date, budget);
        if (weather.status === "unavailable")
          return finish({
            status: "weather_required",
            basis: "none",
            items: [],
            reason: weather.reason,
            retryAfter: weather.retryAfter,
          });
        const temperature =
          weather.daily.apparentTemperatureMax ?? weather.daily.temperatureMax;
        if (temperature === null)
          return finish({
            status: "weather_required",
            basis: "none",
            items: [],
            reason: "forecast_missing",
            retryAfter: null,
          });
        basis =
          weather.daily.apparentTemperatureMax !== null
            ? "apparent_temperature"
            : "temperature_max_fallback";
        seasons =
          temperature < 15
            ? ["season:winter"]
            : temperature < 25
              ? ["season:spring", "season:autumn"]
              : ["season:summer"];
      }
      const items = await budget.run("db", async (signal) => {
        try {
          return await readCandidates(
            repository,
            input.wardrobeId,
            seasons,
            signal,
          );
        } catch (error) {
          if (isAppError(error)) throw error;
          throw unavailable("RECOMMENDATION_READ_FAILED");
        }
      });
      return finish({ status: items.length ? "ready" : "empty", basis, items });
    },
  };
}
