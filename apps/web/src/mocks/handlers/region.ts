import { http, HttpResponse } from "msw";
import {
  normalizeRegionSearch,
  type WardrobeRegionResponseDto,
} from "@/api/schemas/region";
import { wardrobeStore } from "./wardrobe";
import { applyMockScenario } from "./scenario";
const datasetVersion = "abr-mock-20261011";
const candidates = [
  {
    regionId: "abr:lg:131041",
    label: "東京都 新宿区",
    aliases: ["新宿", "新宿区", "しんじゅく", "しんじゅくく"],
  },
  {
    regionId: "abr:lg:132063",
    label: "東京都 府中市",
    aliases: ["府中", "府中市", "ふちゅう"],
  },
  {
    regionId: "abr:lg:342084",
    label: "広島県 府中市",
    aliases: ["府中", "府中市", "ふちゅう"],
  },
];
const states = new Map<string, WardrobeRegionResponseDto>();
export const getMockWardrobeRegion = (
  wardrobeId: string,
): WardrobeRegionResponseDto =>
  states.get(wardrobeId) ?? { revision: 0, region: null };
const error = (status: number, reason: string) =>
  HttpResponse.json(
    {
      error: {
        code:
          status === 409
            ? "CONFLICT"
            : status === 404
              ? "NOT_FOUND"
              : status === 415
                ? "UNSUPPORTED_MEDIA_TYPE"
                : "VALIDATION_ERROR",
        message: reason,
        details: { reason },
      },
    },
    { status },
  );
export const regionHandlers = [
  http.get("*/regions", async ({ request }) => {
    const scenario = await applyMockScenario(request);
    if (scenario) return scenario;
    const query = new URL(request.url).searchParams;
    if (
      [...query.keys()].some((key) => key !== "q") ||
      query.getAll("q").length !== 1
    )
      return error(400, "INVALID_QUERY");
    const q = normalizeRegionSearch(query.get("q") ?? "");
    if (!q || [...q].length > 64) return error(400, "INVALID_QUERY");
    const items = candidates
      .filter(
        (item) =>
          item.aliases.some((alias) =>
            normalizeRegionSearch(alias).includes(q),
          ) || normalizeRegionSearch(item.label).includes(q),
      )
      .map(({ regionId, label }) => ({ regionId, label }));
    return HttpResponse.json({ datasetVersion, items, hasMore: false });
  }),
  http.get("*/wardrobes/:wardrobeId/region", async ({ params, request }) => {
    const scenario = await applyMockScenario(request);
    if (scenario) return scenario;
    const id = String(params.wardrobeId);
    if (!wardrobeStore.has(id)) return error(404, "WARDROBE_NOT_FOUND");
    return HttpResponse.json(states.get(id) ?? { revision: 0, region: null });
  }),
  http.put("*/wardrobes/:wardrobeId/region", async ({ params, request }) => {
    const scenario = await applyMockScenario(request);
    if (scenario) return scenario;
    if (
      !/^application\/json(?:\s*;|\s*$)/iu.test(
        request.headers.get("content-type") ?? "",
      )
    )
      return error(415, "CONTENT_TYPE");
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body))
      return error(400, "INVALID_BODY");
    const b = body as Record<string, unknown>;
    const keys =
      b.regionId === null
        ? ["regionId", "expectedRevision"]
        : ["regionId", "datasetVersion", "expectedRevision"];
    if (
      Object.keys(b).some((key) => !keys.includes(key)) ||
      !Number.isSafeInteger(b.expectedRevision) ||
      Number(b.expectedRevision) < 0 ||
      Number(b.expectedRevision) >= Number.MAX_SAFE_INTEGER
    )
      return error(400, "INVALID_BODY");
    if (
      b.regionId !== null &&
      (typeof b.regionId !== "string" ||
        !/^abr:lg:\d{6}$/.test(b.regionId) ||
        typeof b.datasetVersion !== "string" ||
        !b.datasetVersion)
    )
      return error(400, "INVALID_BODY");
    const id = String(params.wardrobeId);
    if (!wardrobeStore.has(id)) return error(404, "WARDROBE_NOT_FOUND");
    if (b.regionId !== null && b.datasetVersion !== datasetVersion)
      return error(409, "REGION_DATASET_CHANGED");
    const candidate =
      b.regionId === null
        ? null
        : candidates.find((item) => item.regionId === b.regionId);
    if (candidate === undefined) return error(400, "UNKNOWN_REGION");
    const current = states.get(id) ?? { revision: 0, region: null };
    if (current.revision !== b.expectedRevision)
      return error(409, "REGION_CHANGED");
    const state = {
      revision: current.revision + 1,
      region: candidate
        ? {
            regionId: candidate.regionId,
            label: candidate.label,
            datasetVersion,
          }
        : null,
    };
    states.set(id, state);
    return HttpResponse.json(state);
  }),
];
