import { jest } from "@jest/globals";
import * as http from "http";
import { startHealthServer } from "../health-server";

describe("worker health server", () => {
  let server: http.Server;
  let port: number;

  beforeAll(() => {
    port = 0; // let OS assign a free port
    server = startHealthServer(port);
  });

  afterAll(() => {
    server.close();
  });

  it("startHealthServer is a function", () => {
    expect(typeof startHealthServer).toBe("function");
  });

  it("returns JSON with status and uptime", async () => {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unexpected server address type");
    }
    const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${address.port}/health`, (res) => resolve(res));
      req.on("error", reject);
    });

    expect(res.statusCode).toBe(200);

    const body = await new Promise<string>((resolve, reject) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    });

    const json = JSON.parse(body);
    expect(json).toHaveProperty("status", "healthy");
    expect(json).toHaveProperty("uptime");
    expect(typeof json.uptime).toBe("number");
  });
});
