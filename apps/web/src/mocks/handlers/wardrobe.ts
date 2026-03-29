import { HttpResponse, http } from "msw";

import { DEMO_IDS } from "@/constants/routes";

import { applyMockScenario } from "./scenario";

const WARDROBE_ID_PREFIX = "wd_mock_";

type WardrobeRecord = {
  wardrobeId: string;
  name: string;
};

let sequence = 1;
const wardrobeStore = new Map<string, WardrobeRecord>();

wardrobeStore.set(DEMO_IDS.wardrobe, {
  wardrobeId: DEMO_IDS.wardrobe,
  name: "Demo Wardrobe",
});

function createErrorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function nextWardrobeId() {
  const id = `${WARDROBE_ID_PREFIX}${String(sequence).padStart(4, "0")}`;
  sequence += 1;
  return id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCreateWardrobeBody(body: unknown): { name: string } | null {
  if (!isRecord(body) || typeof body.name !== "string") {
    return null;
  }

  const name = body.name.trim();
  if (name.length === 0 || name.length > 40) {
    return null;
  }

  return { name };
}

export const wardrobeHandlers = [
  http.post("*/wardrobes", async ({ request }) => {
    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) {
      return scenarioResponse;
    }

    const body = await request.json().catch(() => null);
    const parsed = parseCreateWardrobeBody(body);
    if (!parsed) {
      return createErrorResponse(400, "VALIDATION_ERROR", "name is required");
    }

    const wardrobeId = nextWardrobeId();
    wardrobeStore.set(wardrobeId, {
      wardrobeId,
      name: parsed.name,
    });

    return HttpResponse.json(
      {
        wardrobeId,
      },
      {
        status: 201,
      },
    );
  }),
  http.get("*/wardrobes/:wardrobeId", async ({ params, request }) => {
    const scenarioResponse = await applyMockScenario(request);
    if (scenarioResponse) {
      return scenarioResponse;
    }

    const wardrobeId = String(params.wardrobeId ?? "");
    const found = wardrobeStore.get(wardrobeId);
    if (!found) {
      return createErrorResponse(404, "NOT_FOUND", "wardrobe is not found");
    }

    return HttpResponse.json({
      name: found.name,
    });
  }),
];
