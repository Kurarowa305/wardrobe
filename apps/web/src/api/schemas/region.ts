export type RegionCandidateDto = { regionId: string; label: string };
export type RegionSearchResponseDto = {
  datasetVersion: string;
  items: RegionCandidateDto[];
  hasMore: boolean;
};
export type WardrobeRegionResponseDto = {
  revision: number;
  region: (RegionCandidateDto & { datasetVersion: string }) | null;
};
export type SaveWardrobeRegionRequestDto =
  | { regionId: string; datasetVersion: string; expectedRevision: number }
  | { regionId: null; expectedRevision: number };
export function normalizeRegionSearch(value: string): string {
  return value
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/gu, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0x60),
    );
}
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const nonempty = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;
const candidate = (v: unknown): v is RegionCandidateDto =>
  record(v) &&
  typeof v.regionId === "string" &&
  /^abr:lg:\d{6}$/.test(v.regionId) &&
  nonempty(v.label);
export function isRegionSearchResponse(
  v: unknown,
): v is RegionSearchResponseDto {
  return (
    record(v) &&
    nonempty(v.datasetVersion) &&
    Array.isArray(v.items) &&
    v.items.length <= 10 &&
    v.items.every(candidate) &&
    typeof v.hasMore === "boolean"
  );
}
export function isWardrobeRegionResponse(
  v: unknown,
): v is WardrobeRegionResponseDto {
  return (
    record(v) &&
    Number.isSafeInteger(v.revision) &&
    Number(v.revision) >= 0 &&
    (v.region === null ||
      (record(v.region) &&
        nonempty(v.region.datasetVersion) &&
        candidate(v.region)))
  );
}
