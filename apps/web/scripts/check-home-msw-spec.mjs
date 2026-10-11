import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { load } from "./home-test-loader.mjs";
process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost";
const require = createRequire(import.meta.url);
const { setupServer } = require("msw/node");
const { http, HttpResponse } = require("msw");
const { clothingHandlers } = load("mocks/handlers/clothing");
const { templateHandlers } = load("mocks/handlers/template");
const { updateTemplate } = load("api/endpoints/template");
const { homeHandlers } = load("mocks/handlers/home");
const { regionHandlers } = load("mocks/handlers/region");
const { wardrobeHandlers } = load("mocks/handlers/wardrobe");
const { getWeather, getTemplateRecommendations } = load("api/endpoints/home");
const { searchRegions, saveWardrobeRegion } = load("api/endpoints/region");
const { jstDate } = load("features/home/controller");
const { DEMO_IDS } = load("constants/routes");
const context = {
  wardrobeId: DEMO_IDS.wardrobe,
  regionRevision: 0,
  targetDate: jstDate(),
};
const server = setupServer(
  ...homeHandlers,
  ...templateHandlers,
  ...clothingHandlers,
  ...regionHandlers,
  ...wardrobeHandlers,
);
server.listen({ onUnhandledRequest: "error" });
try {
  assert.equal((await getWeather(context)).status, "region_required");
  assert.equal(
    (await getTemplateRecommendations(context, "auto")).status,
    "region_required",
  );
  const manual = await getTemplateRecommendations(context, "summer");
  assert.equal(manual.mode, "summer");
  assert.equal(manual.basis, "manual");
  assert.equal(manual.status, "ready");
  assert(manual.items.length <= 3);
  const first = manual.items[0];
  await updateTemplate(context.wardrobeId, first.templateId, { name: "推薦版更新" });
  const updated = await getTemplateRecommendations(context, "summer");
  assert.equal(updated.items.find(item => item.templateId === first.templateId).revision, first.revision + 1);
  for (const suffix of ["&mode=winter", "&limit=3", "&date=2026-01-01"]) {
    const response = await fetch(`http://localhost/wardrobes/${context.wardrobeId}/recommendations/templates?mode=summer&date=${context.targetDate}&regionRevision=0${suffix}`);
    assert.equal(response.status, 400);
  }
  const clothingId = updated.items[0].clothingItems[0].clothingId;
  const patch = await fetch(`http://localhost/wardrobes/${context.wardrobeId}/clothing/${clothingId}`, {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ imageKey: "clothing/updated-preview.png" }),
  });
  assert.equal(patch.status, 204);
  const refreshed = await getTemplateRecommendations(context, "summer");
  assert.equal(refreshed.items.flatMap(item => item.clothingItems).find(item => item.clothingId === clothingId).imageKey, "clothing/updated-preview.png");
  const removed = await fetch(`http://localhost/wardrobes/${context.wardrobeId}/clothing/${clothingId}`, { method: "DELETE" });
  assert.equal(removed.status, 204);
  const afterDelete = await getTemplateRecommendations(context, "summer");
  assert.ok(afterDelete.items.every(item => item.clothingItems.every(clothing => clothing.clothingId !== clothingId)), "deleted clothing excludes every containing template");
  const result = await searchRegions("新宿");
  await saveWardrobeRegion(context.wardrobeId, {
    regionId: result.items[0].regionId,
    datasetVersion: result.datasetVersion,
    expectedRevision: 0,
  });
  await assert.rejects(
    getWeather(context),
    (error) =>
      error.status === 409 && error.details.reason === "REGION_CHANGED",
  );
  context.regionRevision = 1;
  const weather = await getWeather(context);
  assert.equal(weather.status, "available");
  assert.equal(weather.daily.temperatureMax, 22);
  assert.equal((await getWeather(context)).delivery, "cache");
  assert.equal(
    (await getTemplateRecommendations(context, "auto")).basis,
    "apparent_temperature",
  );
  await assert.rejects(
    getWeather({ ...context, targetDate: "2000-01-01" }),
    (error) =>
      error.status === 409 && error.details.reason === "TARGET_DATE_CHANGED",
  );
  let calls = 0;
  server.use(
    http.get("*/wardrobes/:wardrobeId/recommendations/templates", () => {
      calls++;
      return HttpResponse.json(
        { error: { code: "SERVICE_UNAVAILABLE", message: "DB failed" } },
        { status: 503 },
      );
    }),
  );
  await assert.rejects(
    getTemplateRecommendations(context, "summer"),
    (error) => error.status === 503,
  );
  assert.equal(calls, 1, "endpoint never retries");
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(getWeather(context, abort.signal));
  console.log(
    "PASS weather/recommendation endpoints + MSW: DTOs, separate manual path, max 3, region/date conflicts, daily cache, no retry, AbortSignal",
  );
} finally {
  server.close();
}
