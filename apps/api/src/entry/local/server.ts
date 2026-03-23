import { env } from "../../config/env.js";
import { localRoutes } from "./router.js";

export const createLocalServerDescriptor = () => ({
  host: env.host,
  port: env.port,
  routes: localRoutes,
});
