import { createLambdaHandler } from "./adapter.js";

export const clothingLambdaEntry = "clothing";

export const handler = createLambdaHandler({ domain: "clothing" });
