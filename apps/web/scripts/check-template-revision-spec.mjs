import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { setupServer } from "msw/node";
const require = createRequire(import.meta.url);
const { templateHandlers } = require("../src/mocks/handlers/template.ts");
const {
  getTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../src/api/endpoints/template.ts");
const {
  TEMPLATE_FIXTURE_WARDROBE_ID,
} = require("../src/mocks/fixtures/template.ts");
const server = setupServer(...templateHandlers);
server.listen({ onUnhandledRequest: "error" });
try {
  const initial = await getTemplate(
    TEMPLATE_FIXTURE_WARDROBE_ID,
    "tp_01HZZBBB",
  );
  assert.equal(initial.revision, 0);
  await updateTemplate(TEMPLATE_FIXTURE_WARDROBE_ID, "tp_01HZZBBB", {
    name: "revision edit",
  });
  assert.equal(
    (await getTemplate(TEMPLATE_FIXTURE_WARDROBE_ID, "tp_01HZZBBB")).revision,
    1,
  );
  await updateTemplate(TEMPLATE_FIXTURE_WARDROBE_ID, "tp_01HZZBBB", {
    name: "revision edit",
  });
  assert.equal(
    (await getTemplate(TEMPLATE_FIXTURE_WARDROBE_ID, "tp_01HZZBBB")).revision,
    1,
  );
  await deleteTemplate(TEMPLATE_FIXTURE_WARDROBE_ID, "tp_01HZZBBB");
  assert.equal(
    (await getTemplate(TEMPLATE_FIXTURE_WARDROBE_ID, "tp_01HZZBBB")).revision,
    2,
  );
  console.log(
    "Web template detail/edit/no-op/delete revisions through MSW HTTP OK",
  );
} finally {
  server.close();
}
