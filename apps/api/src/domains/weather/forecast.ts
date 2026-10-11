export type Daily = {
  apparentTemperatureMax: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  weatherCode: number | null;
};
export type Derivation = {
  source: "apparent_temperature" | "temperature_max_fallback" | "unavailable";
  dressingIndex: 1 | 2 | 3 | null;
};
export type Forecast = { daily: Daily; derivation: Derivation };
export type WeatherReason =
  | "fetch_failed"
  | "forecast_missing"
  | "invalid_response"
  | "cooldown"
  | "rate_limited"
  | "budget_exhausted"
  | "fetch_in_progress";
export class ForecastError extends Error {
  constructor(public readonly reason: WeatherReason) {
    super(reason);
  }
}
const codes = new Set([
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77,
  80, 81, 82, 85, 86, 95, 96, 99,
]);
const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export function parseForecast(input: unknown, targetDate: string): Forecast {
  const value = record(input),
    daily = record(value.daily),
    units = record(value.daily_units);
  const dates = daily.time;
  if (
    value.timezone !== "Asia/Tokyo" ||
    value.utc_offset_seconds !== 32400 ||
    units.time !== "iso8601" ||
    !Array.isArray(dates) ||
    dates.length !== 1 ||
    typeof dates[0] !== "string"
  )
    throw new ForecastError("invalid_response");
  if (dates[0] !== targetDate) throw new ForecastError("forecast_missing");
  const read = (key: string, unit: string): number | null => {
    const data = daily[key];
    if (data === undefined) return null;
    if (!Array.isArray(data) || data.length !== dates.length)
      throw new ForecastError("invalid_response");
    return units[key] === unit &&
      typeof data[0] === "number" &&
      Number.isFinite(data[0])
      ? data[0]
      : null;
  };
  const apparentTemperatureMax = read("apparent_temperature_max", "°C");
  const temperatureMax = read("temperature_2m_max", "°C");
  const temperatureMin = read("temperature_2m_min", "°C");
  const code = read("weather_code", "wmo code");
  return {
    daily: {
      apparentTemperatureMax,
      temperatureMax,
      temperatureMin,
      weatherCode: code !== null && codes.has(code) ? code : null,
    },
    derivation:
      apparentTemperatureMax !== null
        ? {
            source: "apparent_temperature",
            dressingIndex:
              apparentTemperatureMax < 15
                ? 1
                : apparentTemperatureMax < 25
                  ? 2
                  : 3,
          }
        : {
            source:
              temperatureMax !== null
                ? "temperature_max_fallback"
                : "unavailable",
            dressingIndex: null,
          },
  };
}
export const jstDate = (now: number): string =>
  new Date(now + 9 * 3600000).toISOString().slice(0, 10);
export const expiry = (date: string): number =>
  Date.parse(`${date}T00:00:00+09:00`) + 86400000;
export type WeatherRegion = {
  regionId: string;
  latitude: number;
  longitude: number;
};
export const forecastKey = (region: WeatherRegion, date: string): string =>
  `open-meteo:forecast:v1:best_match:${region.regionId}:${region.latitude}:${region.longitude}:Asia/Tokyo:celsius:${date}`;
export function forecastUrl(region: WeatherRegion, date: string): URL {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(region.latitude),
    longitude: String(region.longitude),
    models: "best_match",
    daily:
      "apparent_temperature_max,temperature_2m_max,temperature_2m_min,weather_code",
    timezone: "Asia/Tokyo",
    temperature_unit: "celsius",
    timeformat: "iso8601",
    start_date: date,
    end_date: date,
  }).toString();
  return url;
}
