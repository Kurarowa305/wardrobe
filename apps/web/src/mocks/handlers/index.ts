import { clothingHandlers } from "./clothing";
import { healthHandler } from "./health";
import { imagePresignHandlers } from "./image";
import { templateHandlers } from "./template";

export const handlers = [healthHandler];
handlers.push(...clothingHandlers);
handlers.push(...imagePresignHandlers);
handlers.push(...templateHandlers);
