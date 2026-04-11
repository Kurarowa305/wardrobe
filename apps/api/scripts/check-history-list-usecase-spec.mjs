import { createHistoryUsecase } from "../src/domains/history/usecases/historyUsecase.ts";
import { encodeCursor } from "../src/core/cursor/index.ts";

const listCalls = [];
const resolveManyCalls = [];

const repo = {
  async list(input) {
    listCalls.push(input);
    return {
      Items: [
        {
          PK: "W#wd_001#HIST",
          SK: "HIST#hs_002",
          historyDateSk: "DATE#20260102#hs_002",
          wardrobeId: "wd_001",
          historyId: "hs_002",
          date: "20260102",
          templateId: "tp_001",
          clothingIds: ["cl_002", "cl_001"],
          createdAt: 1700000000000,
        },
      ],
      LastEvaluatedKey: {
        PK: "W#wd_001#HIST",
        SK: "HIST#hs_002",
        historyDateSk: "DATE#20260102#hs_002",
      },
    };
  },
};

const historyDetailsResolver = {
  async resolveMany(input) {
    resolveManyCalls.push(input);
    return [
      {
        historyId: "hs_002",
        date: "20260102",
        templateName: "通勤セット",
        clothingItems: [
          {
            clothingId: "cl_002",
            name: "白シャツ",
            genre: "tops",
            imageKey: "img/2.png",
            status: "ACTIVE",
            wearCount: 5,
            lastWornAt: 1700000000000,
          },
          {
            clothingId: "cl_001",
            name: "黒デニム",
            genre: "bottoms",
            imageKey: null,
            status: "DELETED",
            wearCount: 3,
            lastWornAt: 1690000000000,
          },
        ],
      },
    ];
  },
};

const usecase = createHistoryUsecase({ repo, historyDetailsResolver });
const cursor = encodeCursor({
  resource: "history-list",
  order: "asc",
  filters: {
    from: "20260101",
    to: "20260131",
  },
  position: {
    PK: "W#wd_001#HIST",
    SK: "HIST#hs_001",
    historyDateSk: "DATE#20260101#hs_001",
  },
});

const result = await usecase.list({
  wardrobeId: "wd_001",
  params: {
    from: "20260101",
    to: "20260131",
    order: "asc",
    limit: 10,
    cursor,
  },
});

let invalidCursorCode = null;
try {
  await usecase.list({
    wardrobeId: "wd_001",
    params: {
      order: "desc",
      cursor,
    },
    requestId: "req_history_cursor",
  });
} catch (error) {
  invalidCursorCode = error?.code ?? null;
}

const checks = [
  {
    name: "list usecase decodes cursor and forwards query params to history repo",
    ok:
      listCalls.length >= 1
      && listCalls[0]?.wardrobeId === "wd_001"
      && listCalls[0]?.from === "20260101"
      && listCalls[0]?.to === "20260131"
      && listCalls[0]?.order === "asc"
      && listCalls[0]?.limit === 10
      && listCalls[0]?.exclusiveStartKey?.historyDateSk === "DATE#20260101#hs_001",
    detail: listCalls,
  },
  {
    name: "list usecase resolves template name and returns clothingItems without wear stats",
    ok:
      result.items.length === 1
      && result.items[0]?.name === "通勤セット"
      && result.items[0]?.clothingItems.length === 2
      && !Object.hasOwn(result.items[0]?.clothingItems[0] ?? {}, "wearCount")
      && result.items[0]?.clothingItems[1]?.status === "DELETED",
    detail: result,
  },
  {
    name: "list usecase encodes next cursor and delegates history list to details resolver",
    ok:
      typeof result.nextCursor === "string"
      && resolveManyCalls.length === 1
      && resolveManyCalls[0]?.wardrobeId === "wd_001"
      && resolveManyCalls[0]?.histories.length === 1,
    detail: { result, resolveManyCalls },
  },
  {
    name: "list usecase rejects mismatched cursor conditions as INVALID_CURSOR",
    ok: invalidCursorCode === "INVALID_CURSOR",
    detail: invalidCursorCode,
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T05 history list usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T05 history list usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
