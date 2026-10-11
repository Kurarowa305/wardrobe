import { weatherCondition } from "@/features/home/presentation";

const paths = {
  clear: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  partlyCloudy: "M8 2v2M2 8h2M3.5 3.5 5 5M13 3l-1 2 M5 11a4 4 0 1 1 7-4 M8 20h10a4 4 0 0 0 0-8 5 5 0 0 0-9-1 4.5 4.5 0 0 0-1 9",
  cloudy: "M6 19h12a4 4 0 0 0 0-8 6 6 0 0 0-11-2 5 5 0 0 0-1 10",
  fog: "M6 13h12a3 3 0 0 0 0-6 5 5 0 0 0-9-1 3.5 3.5 0 0 0-3 7 M3 17h18M5 21h14",
  rain: "M6 14h12a3 3 0 0 0 0-6 5 5 0 0 0-9-1 3.5 3.5 0 0 0-3 7 M7 17l-1 4m6-4-1 4m6-4-1 4",
  snow: "M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7 M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M17 19l-1-4 4-1M4 14l4 1-1 4M17 5l-1 4 4 1",
  thunder: "M6 14a3.5 3.5 0 0 1 3-7 5 5 0 0 1 9 1 3 3 0 0 1 0 6 M12 12l-4 6h5l-1 4 5-7h-5l1-3",
  unknown: "M9 9a3 3 0 1 1 4 2.8c-1 .4-1 1.2-1 2.2 M12 18h.01",
};

/** Decorative: the adjacent weather text provides the accessible description. */
export function WeatherIcon({ code }: { code: number | null }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path d={paths[weatherCondition(code)]} />
    </svg>
  );
}
