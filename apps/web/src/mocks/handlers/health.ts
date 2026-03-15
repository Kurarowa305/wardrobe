import { HttpResponse, http } from "msw";

export const healthHandler = http.get("*/health", () =>
  HttpResponse.json({
    status: "ok",
  }),
);
