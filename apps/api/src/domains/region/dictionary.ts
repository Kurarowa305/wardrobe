import { datasetVersion, municipalityRows } from "./data/municipalities.js";
export { datasetVersion };
export function normalizeRegionSearch(value: string): string {
  return value
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/gu, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0x60),
    );
}
const short = (value: string) =>
  value.length > 1 ? value.replace(/[都道府県市区町村]$/u, "") : value;
const dictionary = municipalityRows.map((row) => {
  const aliases = new Set<string>();
  for (const kana of [false, true]) {
    const [pref, county, city, ward] = kana
      ? ([
          row.pref_kana,
          row.county_kana,
          row.city_kana,
          row.ward_kana,
        ] as const)
      : ([row.pref, row.county, row.city, row.ward] as const);
    const names = ward ? [city + ward, ward] : [city];
    if (!kana)
      names.push(
        ...(ward
          ? [short(city) + ward, short(city) + short(ward)]
          : [short(city)]),
      );
    for (const name of names.filter(Boolean)) {
      for (const value of [
        name,
        pref + name,
        pref + county + name,
        ...(!kana ? [short(pref) + name] : []),
      ])
        aliases.add(normalizeRegionSearch(value));
    }
  }
  return {
    region: {
      regionId: `abr:lg:${row.lg_code}`,
      label: [row.pref, row.county, row.city, row.ward]
        .filter(Boolean)
        .join(" "),
      datasetVersion,
      source: "abr" as const,
      lgCode: row.lg_code,
      pref: row.pref,
      county: row.county,
      city: row.city,
      ward: row.ward,
      latitude: row.latitude,
      longitude: row.longitude,
      sourceSrid: "EPSG:6668" as const,
      coordinatePolicy: "jgd2011-as-wgs84-for-weather" as const,
      timezone: "Asia/Tokyo" as const,
    },
    aliases: [...aliases],
  };
});
export type StoredRegion = (typeof dictionary)[number]["region"];
export const resolveRegion = (regionId: string) =>
  dictionary.find((entry) => entry.region.regionId === regionId)?.region;
export function searchRegions(query: string) {
  const tokens = normalizeRegionSearch(query)
    .split(/[\s,、]+/u)
    .filter(Boolean);
  if (tokens.length === 0) return { datasetVersion, items: [], hasMore: false };
  const ranked = dictionary
    .flatMap(({ region, aliases }) => {
      const scores = tokens.map((token) =>
        Math.min(
          ...aliases
            .filter((alias) => alias.includes(token))
            .map((alias) =>
              alias === token ? 0 : alias.startsWith(token) ? 1 : 2,
            ),
        ),
      );
      return scores.every(Number.isFinite)
        ? [{ region, score: scores.reduce((sum, score) => sum + score, 0) }]
        : [];
    })
    .sort(
      (a, b) =>
        a.score - b.score || a.region.lgCode.localeCompare(b.region.lgCode),
    );
  return {
    datasetVersion,
    items: ranked.slice(0, 10).map(({ region }) => ({
      regionId: region.regionId,
      label: region.label,
    })),
    hasMore: ranked.length > 10,
  };
}
