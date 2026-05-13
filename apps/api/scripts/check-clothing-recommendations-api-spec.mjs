import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

process.env.AWS_REGION ??= "ap-northeast-1";
process.env.DDB_ENDPOINT ??= "http://127.0.0.1:8000";
process.env.TABLE_NAME ??= "wardrobe-local";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/clothing/usecases/clothingUsecase.ts");
const handlerModulePath = path.join(root, "src/domains/clothing/handlers/getClothingRecommendationsHandler.ts");
const routerModulePath = path.join(root, "src/entry/local/router.ts");
const adapterPath = path.join(root, "src/entry/lambda/adapter.ts");
const terraformApigwPath = path.join(root, "../../infra/terraform/app/apigw_http_api.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const usecaseModule = await import(usecaseModulePath);
const handlerModule = await import(handlerModulePath);
const routerModule = await import(routerModulePath);

const adapterSource = readFileSync(adapterPath, "utf8");
const terraformApigw = readFileSync(terraformApigwPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

assert.equal(usecaseModule.resolveClothingRecommendationSeason(Date.UTC(2026, 1, 28, 14, 59)), "winter");
assert.equal(usecaseModule.resolveClothingRecommendationSeason(Date.UTC(2026, 1, 28, 15, 0)), "spring");
assert.equal(usecaseModule.resolveClothingRecommendationSeason(Date.UTC(2026, 4, 31, 15, 0)), "summer");
assert.equal(usecaseModule.resolveClothingRecommendationSeason(Date.UTC(2026, 7, 31, 15, 0)), "autumn");
assert.equal(usecaseModule.resolveClothingRecommendationSeason(Date.UTC(2026, 10, 30, 15, 0)), "winter");

const lastKey = {
  PK: "W#wd_001#CLOTH",
  SK: "CLOTH#cl_top_summer_001",
  statusListPk: "W#wd_001#CLOTH#ACTIVE",
  lastWornAtSk: "LASTWORN#0#cl_top_summer_001",
};
const listCalls = [];
const repo = {
  async list(input) {
    listCalls.push(input);
    if (listCalls.length === 1) {
      return {
        Items: [
          {
            wardrobeId: "wd_001",
            clothingId: "cl_top_summer_001",
            name: "夏トップス1",
            genre: "tops",
            imageKey: null,
            tagIds: ["season:summer"],
            status: "ACTIVE",
            wearCount: 0,
            lastWornAt: 0,
            createdAt: 1,
            deletedAt: null,
          },
          {
            wardrobeId: "wd_001",
            clothingId: "cl_bottom_winter_001",
            name: "冬ボトムス",
            genre: "bottoms",
            imageKey: null,
            tagIds: ["season:winter"],
            status: "ACTIVE",
            wearCount: 1,
            lastWornAt: 1,
            createdAt: 2,
            deletedAt: null,
          },
          {
            wardrobeId: "wd_001",
            clothingId: "cl_other_all_001",
            name: "その他",
            genre: "others",
            imageKey: null,
            tagIds: ["season:all"],
            status: "ACTIVE",
            wearCount: 1,
            lastWornAt: 2,
            createdAt: 3,
            deletedAt: null,
          },
        ],
        LastEvaluatedKey: lastKey,
      };
    }

    return {
      Items: [
        {
          wardrobeId: "wd_001",
          clothingId: "cl_bottom_all_001",
          name: "通年ボトムス",
          genre: "bottoms",
          imageKey: "clothing/bottom-all.png",
          tagIds: ["season:all"],
          status: "ACTIVE",
          wearCount: 2,
          lastWornAt: 3,
          createdAt: 4,
          deletedAt: null,
        },
        {
          wardrobeId: "wd_001",
          clothingId: "cl_top_all_001",
          name: "通年トップス",
          genre: "tops",
          imageKey: null,
          tagIds: ["season:all"],
          status: "ACTIVE",
          wearCount: 3,
          lastWornAt: 4,
          createdAt: 5,
          deletedAt: null,
        },
        {
          wardrobeId: "wd_001",
          clothingId: "cl_bottom_summer_001",
          name: "夏ボトムス",
          genre: "bottoms",
          imageKey: null,
          tagIds: ["season:summer"],
          status: "ACTIVE",
          wearCount: 4,
          lastWornAt: 5,
          createdAt: 6,
          deletedAt: null,
        },
        {
          wardrobeId: "wd_001",
          clothingId: "cl_top_summer_002",
          name: "夏トップス2",
          genre: "tops",
          imageKey: null,
          tagIds: ["season:summer"],
          status: "ACTIVE",
          wearCount: 5,
          lastWornAt: 6,
          createdAt: 7,
          deletedAt: null,
        },
      ],
      LastEvaluatedKey: null,
    };
  },
};

const usecase = usecaseModule.createClothingUsecase({
  repo,
  now: () => Date.UTC(2026, 6, 1, 0, 0),
});
const result = await usecase.getRecommendations({ wardrobeId: "wd_001" });

assert.equal(result.season, "summer");
assert.deepEqual(result.seasonTagIds, ["season:summer", "season:all"]);
assert.deepEqual(result.items.tops.map((item) => item.clothingId), ["cl_top_summer_001", "cl_top_all_001"]);
assert.deepEqual(result.items.bottoms.map((item) => item.clothingId), ["cl_bottom_all_001", "cl_bottom_summer_001"]);
assert.equal(listCalls.length, 2);
assert.equal(listCalls[0].indexName, "StatusListByLastWornAt");
assert.equal(listCalls[0].status, "ACTIVE");
assert.equal(listCalls[0].limit, 50);
assert.equal(listCalls[0].scanIndexForward, true);
assert.deepEqual(listCalls[1].exclusiveStartKey, lastKey);

const handlerResponse = await handlerModule.getClothingRecommendationsHandler({
  path: { wardrobeId: "wd_001" },
  requestId: "req_recommendations",
  dependencies: {
    repo: {
      async list() {
        return {
          Items: [
            {
              wardrobeId: "wd_001",
              clothingId: "cl_top_spring_001",
              name: "春トップス",
              genre: "tops",
              imageKey: null,
              tagIds: ["season:spring"],
              status: "ACTIVE",
              wearCount: 1,
              lastWornAt: 0,
              createdAt: 1,
              deletedAt: null,
            },
          ],
          LastEvaluatedKey: null,
        };
      },
    },
    now: () => Date.UTC(2026, 3, 1, 0, 0),
  },
});
assert.equal(handlerResponse.statusCode, 200);
assert.equal(JSON.parse(handlerResponse.body).items.tops[0].clothingId, "cl_top_spring_001");

assert.deepEqual(
  routerModule.resolveLocalRoute("GET", "/wardrobes/wd_001/recommendations/clothing"),
  {
    method: "GET",
    pattern: "/wardrobes/:wardrobeId/recommendations/clothing",
    domain: "clothing",
    params: { wardrobeId: "wd_001" },
  },
);
assert.ok(adapterSource.includes("getClothingRecommendationsHandler"));
assert.ok(adapterSource.includes("/recommendations/clothing"));
assert.ok(terraformApigw.includes('"ANY /wardrobes/{wardrobeId}/recommendations/clothing"'));
assert.ok(packageJson.includes('"test:clothing-recommendations-api": "node --import tsx/esm scripts/check-clothing-recommendations-api-spec.mjs"'));
assert.ok(ciSource.includes("pnpm --filter api test:clothing-recommendations-api"));

console.log("clothing recommendations API spec passed");
