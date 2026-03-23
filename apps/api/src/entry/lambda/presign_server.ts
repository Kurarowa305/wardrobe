import { createLambdaHandler } from "./adapter.js";

export const presignLambdaEntry = "presign";

export const handler = createLambdaHandler({ domain: "presign" });
