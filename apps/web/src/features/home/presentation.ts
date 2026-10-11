export function temperatureLabel(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 10) / 10}℃`;
}
export function weatherLabel(code: number | null) {
  if (code === 0) return "晴れ";
  if (code === 1 || code === 2) return "晴れ時々曇り";
  if (code === 3) return "曇り";
  if (code === 45 || code === 48) return "霧";
  if (
    code !== null &&
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
  )
    return "雨";
  if (code !== null && [71, 73, 75, 77, 85, 86].includes(code)) return "雪";
  if (code !== null && [95, 96, 99].includes(code)) return "雷雨";
  return "天気不明";
}
