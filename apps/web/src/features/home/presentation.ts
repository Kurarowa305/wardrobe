import { HOME_STRINGS } from "./strings";
export function temperatureLabel(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 10) / 10}℃`;
}
export function weatherCondition(code: number | null) {
  if (code === 0) return "clear";
  if (code === 1 || code === 2)
    return "partlyCloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48)
    return "fog";
  if (
    code !== null &&
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
  )
    return "rain";
  if (code !== null && [71, 73, 75, 77, 85, 86].includes(code))
    return "snow";
  if (code !== null && [95, 96, 99].includes(code))
    return "thunder";
  return "unknown";
}

export function weatherLabel(code: number | null) {
  return HOME_STRINGS.labels.weatherConditions[weatherCondition(code)];
}
