import { createAppError } from "../../../core/errors/index.js";
import { datasetVersion, resolveRegion } from "../dictionary.js";
import {
  createRegionRepo,
  getRegionContext,
  type RegionRepo,
} from "../repo/regionRepo.js";
import { z } from "zod";
import { parseRequest } from "../../../core/validation/index.js";
import { createSuccessResponse } from "../../../core/response/index.js";
import { searchRegions } from "../dictionary.js";
export async function searchRegionsHandler(input: {
  query?: unknown;
  requestId?: string;
}) {
  const parsed = parseRequest(
    {
      query: z
        .object({
          q: z
            .string()
            .transform((value) => value.trim().normalize("NFKC"))
            .refine(
              (value) => [...value].length > 0 && [...value].length <= 64,
            ),
        })
        .strict(),
    },
    input,
    input.requestId,
  );
  return createSuccessResponse(searchRegions(parsed.query.q));
}

const pathSchema = z.object({ wardrobeId: z.string().trim().min(1) }).strict();
const revisionSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const bodySchema = z.union([
  z
    .object({
      regionId: z.string().regex(/^abr:lg:\d{6}$/u),
      datasetVersion: z.string().min(1),
      expectedRevision: revisionSchema,
    })
    .strict(),
  z.object({ regionId: z.null(), expectedRevision: revisionSchema }).strict(),
]);
type RegionInput = {
  path?: unknown;
  query?: unknown;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  requestId?: string;
  repo?: RegionRepo;
};
function dto(context: Awaited<ReturnType<typeof getRegionContext>>) {
  const { region, revision } = context;
  return {
    revision,
    region: region
      ? {
          regionId: region.regionId,
          label: region.label,
          datasetVersion: region.datasetVersion,
        }
      : null,
  };
}
export async function getWardrobeRegionHandler(input: RegionInput) {
  const parsed = parseRequest({ path: pathSchema }, input, input.requestId);
  return createSuccessResponse(
    dto(await getRegionContext(parsed.path.wardrobeId, input.repo)),
  );
}
export async function saveWardrobeRegionHandler(input: RegionInput) {
  const contentType = input.headers?.["content-type"];
  if (
    typeof contentType !== "string" ||
    !/^application\/json(?:\s*;|\s*$)/iu.test(contentType)
  )
    throw createAppError("UNSUPPORTED_MEDIA_TYPE");
  const parsed = parseRequest(
    { path: pathSchema, body: bodySchema },
    input,
    input.requestId,
  );
  const { regionId, expectedRevision } = parsed.body;
  if (expectedRevision === Number.MAX_SAFE_INTEGER)
    throw createAppError("VALIDATION_ERROR");
  const repo = input.repo ?? createRegionRepo();
  await getRegionContext(parsed.path.wardrobeId, repo);
  if (regionId !== null && parsed.body.datasetVersion !== datasetVersion)
    throw createAppError("CONFLICT", {
      details: { reason: "REGION_DATASET_CHANGED" },
    });
  const region = regionId === null ? null : resolveRegion(regionId);
  if (region === undefined)
    throw createAppError("VALIDATION_ERROR", {
      details: { reason: "UNKNOWN_REGION" },
    });
  try {
    await repo.save(parsed.path.wardrobeId, region, expectedRevision);
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      await getRegionContext(parsed.path.wardrobeId, repo);
      throw createAppError("CONFLICT", {
        details: { reason: "REGION_CHANGED" },
      });
    }
    throw error;
  }
  return createSuccessResponse(dto({ revision: expectedRevision + 1, region }));
}
