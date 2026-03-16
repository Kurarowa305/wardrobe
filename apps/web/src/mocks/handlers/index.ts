import { clothingHandlers } from "./clothing";
import { healthHandler } from "./health";

export const handlers = [healthHandler];
handlers.push(...clothingHandlers);
