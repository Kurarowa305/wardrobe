const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatHistoryDate(date: string) {
  if (!/^\d{8}$/.test(date)) {
    return date;
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  const weekday = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];

  return `${date.slice(0, 4)}/${date.slice(4, 6)}/${date.slice(6, 8)} (${weekday})`;
}
