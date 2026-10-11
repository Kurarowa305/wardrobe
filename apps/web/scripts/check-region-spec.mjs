import assert from "node:assert/strict";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import regionModule from "../src/mocks/handlers/region.ts";
const { regionHandlers } = regionModule;
import wardrobeModule from "../src/mocks/handlers/wardrobe.ts";
const { wardrobeHandlers } = wardrobeModule;
import endpointModule from "../src/api/endpoints/region.ts";
const { searchRegions, getWardrobeRegion, saveWardrobeRegion } = endpointModule;
const server = setupServer(...regionHandlers, ...wardrobeHandlers);
server.listen({ onUnhandledRequest: "error" });
try {
  const created = await fetch("http://localhost/wardrobes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "test" }),
  }).then((r) => r.json());
  const search = await searchRegions("ｼﾝｼﾞｭｸ");
  assert.equal(search.items[0].regionId, "abr:lg:131041");
  assert.deepEqual(await getWardrobeRegion(created.wardrobeId), {
    revision: 0,
    region: null,
  });
  const body = {
    regionId: search.items[0].regionId,
    datasetVersion: search.datasetVersion,
    expectedRevision: 0,
  };
  const saved = await saveWardrobeRegion(created.wardrobeId, body);
  assert.equal(saved.revision, 1);
  assert.deepEqual(await getWardrobeRegion(created.wardrobeId), saved);
  await assert.rejects(
    saveWardrobeRegion(created.wardrobeId, body),
    (e) => e.status === 409,
  );
  assert.deepEqual(
    await saveWardrobeRegion(created.wardrobeId, {
      regionId: null,
      expectedRevision: 1,
    }),
    { revision: 2, region: null },
  );
  await assert.rejects(searchRegions(""));
  await assert.rejects(getWardrobeRegion("missing"), (e) => e.status === 404);
  server.use(
    http.get("*/regions", () =>
      HttpResponse.json({
        datasetVersion: "x",
        items: [{ regionId: "bad", label: "broken" }],
        hasMore: false,
      }),
    ),
  );
  await assert.rejects(
    searchRegions("新宿"),
    (e) => e.code === "INVALID_RESPONSE",
  );
  server.use(
    http.get("*/wardrobes/:wardrobeId/region", () =>
      HttpResponse.json({ revision: -1, region: null }),
    ),
  );
  await assert.rejects(
    getWardrobeRegion(created.wardrobeId),
    (e) => e.code === "INVALID_RESPONSE",
  );
  console.log("Web region endpoints, PUT, DTO, normalization and MSW CAS OK");
} finally {
  server.close();
}
