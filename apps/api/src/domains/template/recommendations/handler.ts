import { z } from "zod";
import { createAppError } from "../../../core/errors/index.js";
import { createSuccessResponse } from "../../../core/response/index.js";
import { WeatherBudget } from "../../weather/budget.js";
import {
  createRecommendationService,
  type RecommendationDependencies,
} from "./service.js";
const pathSchema = z.object({ wardrobeId: z.string().min(1) }).strict();
const querySchema = z
  .object({
    mode: z
      .enum(["auto", "spring", "summer", "autumn", "winter"])
      .default("auto"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((value) => {
        const time = Date.parse(`${value}T00:00:00Z`);
        return (
          Number.isFinite(time) &&
          new Date(time).toISOString().slice(0, 10) === value
        );
      }),
    regionRevision: z
      .string()
      .regex(/^(0|[1-9]\d*)$/)
      .transform(Number)
      .refine(Number.isSafeInteger),
  })
  .strict();
export async function getTemplateRecommendationsHandler(input: {
  path?: unknown;
  query?: unknown;
  requestId?: string | undefined;
  startedAt?: number | undefined;
  dependencies?: RecommendationDependencies;
}) {
  const now = input.dependencies?.now ?? Date.now;
  const budget = new WeatherBudget(now, input.startedAt ?? now());
  const path = pathSchema.safeParse(input.path),
    query = querySchema.safeParse(input.query);
  if (!path.success || !query.success)
    throw createAppError("VALIDATION_ERROR", { requestId: input.requestId });
  return createSuccessResponse(
    await createRecommendationService(input.dependencies).get(
      { ...path.data, ...query.data },
      budget,
    ),
  );
}
