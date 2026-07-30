import * as http from "http";
import { logger } from "./logger";
import { getRegisteredTaskTypes } from "./task-registry";
import { isShuttingDown } from "./shutdown";
import { getMetrics, getMetricsContentType } from "./metrics";

export function startHealthServer(port: number = 3001): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          service: "worker",
          status: "healthy",
          uptime: process.uptime(),
          registeredTasks: getRegisteredTaskTypes(),
          shuttingDown: isShuttingDown(),
        }),
      );
    } else if (req.url === "/metrics") {
      getMetrics()
        .then((data) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", getMetricsContentType());
          res.end(data);
        })
        .catch((err) => {
          logger.error({ err }, "Failed to generate metrics");
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Failed to generate metrics" }));
        });
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(port, () => {
    logger.info({ port }, "Health check server started");
  });
  server.unref();
  return server;
}
