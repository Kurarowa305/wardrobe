import { clothingHandlers } from "./clothing";
import { healthHandler } from "./health";
import { imagePresignHandlers } from "./image";

export const handlers = [healthHandler];
handlers.push(...clothingHandlers);
handlers.push(...imagePresignHandlers);
