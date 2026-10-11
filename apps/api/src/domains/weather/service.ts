import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { createAppError, isAppError } from "../../core/errors/index.js";
import { WeatherBudget } from "./budget.js";
import {
  expiry,
  forecastKey,
  forecastUrl,
  ForecastError,
  jstDate,
  parseForecast,
  type WeatherReason,
  type WeatherRegion,
} from "./forecast.js";
import {
  createWeatherRepository,
  type StoredForecast,
  type WeatherRepository,
  type WeatherState,
} from "./repository.js";
import { reserveUsage } from "./usage.js";
export type WeatherResult =
  | ({
      status: "available";
      provider: "open-meteo";
      modelPolicy: "best_match";
      timezone: "Asia/Tokyo";
      temperatureUnit: "celsius";
      delivery: "fresh" | "cache";
    } & StoredForecast)
  | { status: "unavailable"; reason: WeatherReason; retryAfter: string | null };
export type WeatherResponse = {
  wardrobeId: string;
  regionRevision: number;
  targetDate: string;
} & (WeatherResult | { status: "region_required"; region: null });
const unavailable = (
  reason: WeatherReason,
  retryAfter: number | null = null,
): WeatherResult => ({
  status: "unavailable",
  reason,
  retryAfter: retryAfter === null ? null : new Date(retryAfter).toISOString(),
});
const available = (
  forecast: StoredForecast,
  delivery: "fresh" | "cache",
): WeatherResult => ({
  status: "available",
  provider: "open-meteo",
  modelPolicy: "best_match",
  timezone: "Asia/Tokyo",
  temperatureUnit: "celsius",
  delivery,
  ...forecast,
});
export type WeatherDependencies = {
  repository?: WeatherRepository;
  now?: () => number;
  fetch?: typeof fetch;
  warn?: (event: Record<string, unknown>) => void;
};
export function createWeatherService(dependencies: WeatherDependencies = {}) {
  const now = dependencies.now ?? Date.now,
    providerFetch = dependencies.fetch ?? fetch;
  let repo = dependencies.repository;
  const repository = () => repo ?? (repo = createWeatherRepository());
  const cached = (
    state: WeatherState | null,
    date: string,
  ): WeatherResult | null =>
    state?.forecast &&
    (state.expiresAt ?? 0) > now() &&
    state.expiresAt === expiry(date) &&
    Date.parse(state.forecast.expiresAt) === expiry(date)
      ? available(state.forecast, "cache")
      : null;
  const readState = (key: string, budget: WeatherBudget) =>
    budget.run("db", (signal) => repository().readState(key, signal));
  async function resolveForecast(
    region: WeatherRegion,
    date: string,
    budget: WeatherBudget,
  ): Promise<WeatherResult> {
    const key = forecastKey(region, date);
    const state = await readState(key, budget);
    const hit = cached(state, date);
    if (hit) return hit;
    if ((state?.cooldownUntil ?? 0) > now())
      return unavailable("cooldown", state!.cooldownUntil!);
    const owner = randomUUID(),
      leaseUntil = budget.deadline;
    if (budget.remaining() < 4500 || budget.externalLeft() < 4000)
      return unavailable("fetch_in_progress");
    const acquired = await budget.run("write", (signal) =>
      repository().acquire(key, owner, leaseUntil, now(), signal),
    );
    if (!acquired) {
      try {
        return await budget.run("external", async (signal) => {
          while (!signal.aborted) {
            const latest = await budget.run("db", (dbSignal) =>
              repository().readState(key, AbortSignal.any([signal, dbSignal])),
            );
            const result = cached(latest, date);
            if (result) return result;
            if ((latest?.cooldownUntil ?? 0) > now())
              return unavailable("cooldown", latest!.cooldownUntil!);
            await sleep(50, undefined, { signal });
          }
          return unavailable("fetch_in_progress");
        });
      } catch (error) {
        if (isAppError(error) && error.details?.reason === "DEADLINE_EXCEEDED")
          return unavailable("fetch_in_progress");
        throw error;
      }
    }
    // Lease lasts beyond the provider's entire 4s I/O plus persistence headroom.
    const release = () =>
      budget.run("write", (signal) =>
        repository().finish(key, owner, now(), { cooldownUntil: 0 }, signal),
      );
    const enoughTime = () =>
      leaseUntil - now() >= 4500 &&
      budget.remaining() >= 4500 &&
      budget.externalLeft() >= 4000;
    if (!enoughTime()) {
      await release();
      return unavailable("fetch_in_progress");
    }
    let reason: WeatherReason = "fetch_failed",
      retryAfter: number | null = null;
    let phase: "shared" | "external" = "shared";
    try {
      const previous = await budget.run("db", (signal) =>
        repository().readUsage(signal),
      );
      const reservedAt = now();
      const reservation = reserveUsage(previous, reservedAt);
      if ("reason" in reservation) {
        await release();
        return unavailable(reservation.reason, reservation.retryAfter);
      }
      if (!enoughTime()) {
        await release();
        return unavailable("fetch_in_progress");
      }
      if (
        !(await budget.run("write", (signal) =>
          repository().reserve(previous, reservation.usage, signal),
        ))
      ) {
        await release();
        return unavailable("budget_exhausted");
      }
      if (reservation.warning)
        (dependencies.warn ?? ((event) => console.warn(JSON.stringify(event))))(
          {
            event: "weather_provider_usage_80_percent",
            provider: "open-meteo",
          },
        );
      if (!enoughTime()) {
        await release();
        return unavailable("fetch_in_progress");
      }
      // A reservation belongs to its send-start bucket. Crossing any second boundary
      // consumes the reservation without sending, preventing delayed writes undercounting.
      if (Math.floor(now() / 1000) !== Math.floor(reservedAt / 1000)) {
        await release();
        return unavailable("fetch_in_progress");
      }
      phase = "external";
      const result = await budget.run("external", async (signal) => {
        const response = await providerFetch(forecastUrl(region, date), {
          signal,
          redirect: "error",
        });
        if (response.status === 429) {
          const header = response.headers.get("retry-after");
          const delay =
            header !== null && /^\d+(\.\d+)?$/.test(header.trim())
              ? Number(header) * 1000
              : NaN;
          const parsed = header === null ? NaN : Date.parse(header);
          const proposed = Number.isFinite(delay) ? now() + delay : parsed;
          retryAfter = Math.max(
            now() + 300000,
            Number.isFinite(new Date(proposed).getTime()) ? proposed : 0,
          );
          reason = "rate_limited";
          await response.body?.cancel();
          throw new ForecastError(reason);
        }
        if (!response.ok) {
          await response.body?.cancel();
          throw new ForecastError("fetch_failed");
        }
        let json: unknown;
        try {
          json = await response.json();
        } catch {
          throw new ForecastError("invalid_response");
        }
        return parseForecast(json, date);
      });
      phase = "shared";
      const forecast: StoredForecast = {
        ...result,
        fetchedAt: new Date(now()).toISOString(),
        expiresAt: new Date(expiry(date)).toISOString(),
      };
      const saved = await budget.run("write", (signal) =>
        repository().finish(
          key,
          owner,
          now(),
          { forecast, expiresAt: expiry(date), cooldownUntil: 0 },
          signal,
        ),
      );
      if (!saved) return unavailable("fetch_in_progress");
      return available(forecast, "fresh");
    } catch (error) {
      if (phase === "shared")
        throw createAppError("SERVICE_UNAVAILABLE", {
          details: { reason: "WEATHER_STORAGE_FAILED" },
          cause: error,
        });
      if (error instanceof ForecastError) reason = error.reason;
      // An unknown shared-state failure is never permission to contact the provider.
      if (reason === "rate_limited" && retryAfter !== null)
        await budget.run("write", (signal) =>
          repository().gate(retryAfter!, signal),
        );
      if (budget.remaining() > 0)
        await budget.run("write", (signal) =>
          repository().finish(
            key,
            owner,
            now(),
            { reason, cooldownUntil: now() + 300000 },
            signal,
          ),
        );
      return unavailable(reason, retryAfter);
    }
  }
  return {
    resolveForecast,
    async get(
      input: { wardrobeId: string; date: string; regionRevision: number },
      budget = new WeatherBudget(now),
    ): Promise<WeatherResponse> {
      const checkDate = () => {
        if (input.date !== jstDate(now()))
          throw createAppError("CONFLICT", {
            details: {
              reason: "TARGET_DATE_CHANGED",
              targetDate: jstDate(now()),
            },
          });
      };
      checkDate();
      const context = await budget.run("db", (signal) =>
        repository().readContext(input.wardrobeId, signal),
      );
      if (!context) throw createAppError("NOT_FOUND");
      if (context.revision !== input.regionRevision)
        throw createAppError("CONFLICT", {
          details: { reason: "REGION_CHANGED" },
        });
      const result = context.region
        ? await resolveForecast(context.region, input.date, budget)
        : { status: "region_required" as const, region: null };
      checkDate();
      const current = await budget.run("db", (signal) =>
        repository().readContext(input.wardrobeId, signal),
      );
      if (!current) throw createAppError("NOT_FOUND");
      if (current.revision !== input.regionRevision)
        throw createAppError("CONFLICT", {
          details: { reason: "REGION_CHANGED" },
        });
      checkDate();
      return {
        wardrobeId: input.wardrobeId,
        targetDate: input.date,
        regionRevision: context.revision,
        ...result,
      };
    },
  };
}
