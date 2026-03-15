import { delay, HttpResponse } from "msw";

const DELAY_QUERY_PARAM = "delay";
const FORCE_ERROR_QUERY_PARAM = "forceError";

type ForcedErrorStatus = 404 | 500;

function parseDelayMs(value: string | null) {
  if (value === null || value.length === 0) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function parseForcedErrorStatus(value: string | null): ForcedErrorStatus | null {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "" || normalized === "1" || normalized === "true" || normalized === "500" || normalized === "internal") {
    return 500;
  }

  if (normalized === "404" || normalized === "notfound" || normalized === "not_found") {
    return 404;
  }

  return null;
}

function createForcedErrorBody(status: ForcedErrorStatus) {
  if (status === 404) {
    return {
      error: {
        code: "NOT_FOUND",
        message: "MSW forced 404 response",
      },
    };
  }

  return {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "MSW forced 500 response",
    },
  };
}

export async function applyMockScenario(request: Request) {
  const url = new URL(request.url);
  const delayMs = parseDelayMs(url.searchParams.get(DELAY_QUERY_PARAM));

  if (delayMs > 0) {
    await delay(delayMs);
  }

  const forcedStatus = parseForcedErrorStatus(url.searchParams.get(FORCE_ERROR_QUERY_PARAM));
  if (forcedStatus === null) {
    return null;
  }

  return HttpResponse.json(createForcedErrorBody(forcedStatus), {
    status: forcedStatus,
  });
}
