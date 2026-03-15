import { HttpResponse, http } from "msw";

import { applyMockScenario } from "./scenario";

export const healthHandler = http.get("*/health", async ({ request }) => {
  const scenarioResponse = await applyMockScenario(request);
  if (scenarioResponse) {
    return scenarioResponse;
  }

  return HttpResponse.json({
    status: "ok",
  });
});
