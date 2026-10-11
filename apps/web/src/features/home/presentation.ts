import { HOME_STRINGS } from "./strings";
export function temperatureLabel(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 10) / 10}℃`;
}
export function weatherLabel(code: number | null) {
  if (code === 0) return HOME_STRINGS.labels.weatherConditions.clear;
  if (code === 1 || code === 2)
    return HOME_STRINGS.labels.weatherConditions.partlyCloudy;
  if (code === 3) return HOME_STRINGS.labels.weatherConditions.cloudy;
  if (code === 45 || code === 48)
    return HOME_STRINGS.labels.weatherConditions.fog;
  if (
    code !== null &&
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
  )
    return HOME_STRINGS.labels.weatherConditions.rain;
  if (code !== null && [71, 73, 75, 77, 85, 86].includes(code))
    return HOME_STRINGS.labels.weatherConditions.snow;
  if (code !== null && [95, 96, 99].includes(code))
    return HOME_STRINGS.labels.weatherConditions.thunder;
  return HOME_STRINGS.labels.weatherConditions.unknown;
}
