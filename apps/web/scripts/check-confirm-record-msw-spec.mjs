import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { load } from "./home-test-loader.mjs";
process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost";
const require = createRequire(import.meta.url),
  { setupServer } = require("msw/node");
const { historyHandlers } = load("mocks/handlers/history"),
  { templateHandlers } = load("mocks/handlers/template"),
  { clothingHandlers } = load("mocks/handlers/clothing"),
  { homeHandlers } = load("mocks/handlers/home");
const { DEMO_IDS } = load("constants/routes");
const { jstDate } = load("features/home/controller");
const { getTemplateRecommendations } = load("api/endpoints/home");
const { createHistory, deleteHistory } = load("api/endpoints/history");
const wardrobeId = DEMO_IDS.wardrobe,
  base = `http://localhost/wardrobes/${wardrobeId}`;
const server = setupServer(
  ...historyHandlers,
  ...templateHandlers,
  ...clothingHandlers,
  ...homeHandlers,
);
server.listen({ onUnhandledRequest: "error" });
try {
  // Make only these three intentionally related templates eligible via public HTTP operations.
  let more = true;
  while (more) {
    const page = await (await fetch(`${base}/templates?limit=30`)).json();
    more = page.items.length > 0;
    for (const item of page.items)
      assert.equal(
        (
          await fetch(`${base}/templates/${item.templateId}`, {
            method: "DELETE",
          })
        ).status,
        204,
      );
  }
  for (const [name, id] of [
    ["A", "cl_top_002"],
    ["B", "cl_top_002"],
    ["C", "cl_top_001"],
  ])
    assert.equal(
      (
        await fetch(`${base}/templates`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name,
            clothingIds: [id],
            tagIds: ["season:summer"],
          }),
        })
      ).status,
      201,
    );
  const context = { wardrobeId, regionRevision: 0, targetDate: jstDate() };
  const before = await getTemplateRecommendations(context, "summer");
  assert.deepEqual(
    before.items.map((item) => item.name),
    ["A", "B", "C"],
  );
  const item = before.items[0],
    key = "550e8400-e29b-41d4-a716-446655440000",
    body = {
      date: "20301231",
      templateId: item.templateId,
      expectedTemplateRevision: item.revision,
    };
  const saved = await createHistory(wardrobeId, body, key);
  assert.ok(saved.historyId);
  assert.equal(
    (await createHistory(wardrobeId, body, key)).historyId,
    saved.historyId,
  );
  const after = await getTemplateRecommendations(context, "summer");
  assert.deepEqual(
    after.items.map((item) => item.name),
    ["C", "A", "B"],
  );
  assert.equal(
    after.items.find((item) => item.name === "B").revision,
    before.items.find((item) => item.name === "B").revision,
  );
  await deleteHistory(wardrobeId, saved.historyId);
  assert.deepEqual(
    (await getTemplateRecommendations(context, "summer")).items.map(
      (item) => item.name,
    ),
    ["A", "B", "C"],
  );
  await assert.rejects(
    createHistory(wardrobeId, body, key),
    (error) =>
      error.status === 409 &&
      error.details.reason === "HISTORY_ALREADY_DELETED",
  );
  console.log(
    "confirmation HTTP/MSW: same-key replay, shared-clothing rank update, deletion restoration/tombstone passed",
  );
} finally {
  server.close();
}
