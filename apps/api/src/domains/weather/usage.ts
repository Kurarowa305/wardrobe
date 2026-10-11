export type Buckets = Record<string, number>;
export type ProviderUsage = {
  revision: number;
  gateUntil: number;
  seconds: Buckets;
  minutes: Buckets;
  hours: Buckets;
  days: Buckets;
  utcDay: string;
  dayCount: number;
  utcMonth: string;
  monthCount: number;
};
export type Reservation =
  | { usage: ProviderUsage; warning: boolean }
  | { reason: "rate_limited" | "budget_exhausted"; retryAfter: number | null };
/** Include the oldest bucket touching each rolling window; never undercount at boundaries. */
export function reserveUsage(
  previous: ProviderUsage | null,
  now: number,
): Reservation {
  if (previous && previous.gateUntil > now)
    return { reason: "rate_limited", retryAfter: previous.gateUntil };
  const date = new Date(now).toISOString(),
    utcDay = date.slice(0, 10),
    utcMonth = date.slice(0, 7);
  const retain = (
    values: Buckets | undefined,
    width: number,
    count: number,
  ): Buckets =>
    Object.fromEntries(
      Object.entries(values ?? {}).filter(
        ([key]) => Number(key) >= Math.floor(now / width) - count + 1,
      ),
    );
  const seconds = retain(previous?.seconds, 1000, 61),
    minutes = retain(previous?.minutes, 60000, 61),
    hours = retain(previous?.hours, 3600000, 25),
    days = retain(previous?.days, 86400000, 32);
  const sum = (v: Buckets) => Object.values(v).reduce((a, b) => a + b, 0);
  const dayCount = previous?.utcDay === utcDay ? previous.dayCount : 0,
    monthCount = previous?.utcMonth === utcMonth ? previous.monthCount : 0;
  const counts = [
      sum(seconds),
      sum(minutes),
      sum(hours),
      sum(days),
      dayCount,
      monthCount,
    ],
    limits = [60, 600, 5000, 150000, 5000, 150000];
  if (counts.some((count, i) => count >= limits[i]!))
    return { reason: "budget_exhausted", retryAfter: null };
  for (const [buckets, width] of [
    [seconds, 1000],
    [minutes, 60000],
    [hours, 3600000],
    [days, 86400000],
  ] as const) {
    const key = String(Math.floor(now / width));
    buckets[key] = (buckets[key] ?? 0) + 1;
  }
  return {
    usage: {
      revision: (previous?.revision ?? 0) + 1,
      gateUntil: previous?.gateUntil ?? 0,
      seconds,
      minutes,
      hours,
      days,
      utcDay,
      dayCount: dayCount + 1,
      utcMonth,
      monthCount: monthCount + 1,
    },
    warning: counts.some((count, i) => count + 1 >= limits[i]! * 0.8),
  };
}
