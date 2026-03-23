import { createLambdaHandler } from "./adapter.js";

export const historyLambdaEntry = "history";

export const handler = createLambdaHandler({ domain: "history" });
