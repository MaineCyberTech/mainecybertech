import "dotenv/config";
import { createApp } from "./app";
import { getEnv } from "./config/env";
import { logger } from "./lib/logger";

const env = getEnv();
const app = createApp();

app.listen(env.API_PORT, () => {
  logger.info(`API listening on http://localhost:${env.API_PORT}`);
});
