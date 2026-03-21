const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatTimestampDateWithWeekday(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAY_LABELS[date.getDay()];

  return `${year}/${pad2(month)}/${pad2(day)} (${weekday})`;
}
