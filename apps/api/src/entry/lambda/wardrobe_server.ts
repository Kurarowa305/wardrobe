import { createLambdaHandler } from "./adapter.js";

export const wardrobeLambdaEntry = "wardrobe";

export const handler = createLambdaHandler({ domain: "wardrobe" });
