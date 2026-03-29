import { clothingHandlers } from "./clothing";
import { healthHandler } from "./health";
import { historyHandlers } from "./history";
import { imagePresignHandlers } from "./image";
import { templateHandlers } from "./template";
import { wardrobeHandlers } from "./wardrobe";

export const handlers = [healthHandler];
handlers.push(...wardrobeHandlers);
handlers.push(...clothingHandlers);
handlers.push(...imagePresignHandlers);
handlers.push(...templateHandlers);
handlers.push(...historyHandlers);
