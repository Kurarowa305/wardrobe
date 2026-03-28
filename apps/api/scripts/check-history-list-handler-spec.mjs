import { listHistoryHandler } from "../src/domains/history/handlers/listHistoryHandler.ts";

const usecaseCalls = [];

const success = await listHistoryHandler({
  path: { wardrobeId: "wd_001" },
  query: {
    from: "20260101",
    to: "20260131",
    order: "asc",
    limit: "2",
  },
  dependencies: {
    repo: {
      async list() {
        return { Items: [], LastEvaluatedKey: null };
      },
    },
    historyDetailsResolver: {
      async resolveMany(input) {
        usecaseCalls.push(input);
        return [];
      },
    },
  },
});

let rangeErrorCode = null;
try {
  await listHistoryHandler({
    path: { wardrobeId: "wd_001" },
    query: { from: "20260131", to: "20260101" },
  });
} catch (error) {
  rangeErrorCode = error?.code ?? null;
}

let formatErrorCode = null;
try {
  await listHistoryHandler({
    path: { wardrobeId: "wd_001" },
    query: { from: "2026-01-01" },
  });
} catch (error) {
  formatErrorCode = error?.code ?? null;
}

const payload = JSON.parse(success.body);

const checks = [
  {
    name: "list history handler validates request and returns 200 response",
    ok:
      success.statusCode === 200
      && payload.items
      && Array.isArray(payload.items)
      && payload.nextCursor === null,
    detail: success,
  },
  {
    name: "list history handler converts limit query into number and forwards path/query values",
    ok: usecaseCalls.length === 1 && usecaseCalls[0]?.wardrobeId === "wd_001",
    detail: usecaseCalls,
  },
  {
    name: "list history handler rejects from > to range",
    ok: rangeErrorCode === "VALIDATION_ERROR",
    detail: rangeErrorCode,
  },
  {
    name: "list history handler rejects non-yyyymmdd format",
    ok: formatErrorCode === "VALIDATION_ERROR",
    detail: formatErrorCode,
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T05 history list handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T05 history list handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
