import { createLambdaHandler } from "./adapter.js";

export const templateLambdaEntry = "template";

export const handler = createLambdaHandler({ domain: "template" });
