import { jest } from "@jest/globals";
import express from "express";

export type MockResult = {
  data: unknown;
  error: unknown;
  count?: number;
};

export function createMockBuilder(result: MockResult) {
  const chain = () => builder;

  const builder = {
    select: jest.fn(chain),
    insert: jest.fn(chain),
    update: jest.fn(chain),
    delete: jest.fn(chain),
    order: jest.fn(chain),
    eq: jest.fn(chain),
    in: jest.fn(chain),
    range: jest.fn(chain),
    single: jest.fn(chain),
    neq: jest.fn(chain),
    gte: jest.fn(chain),
    lte: jest.fn(chain),
    filter: jest.fn(chain),
    maybeSingle: jest.fn(chain),
    rpc: jest.fn(chain),
    upsert: jest.fn(chain),
    then(onfulfilled?: (v: MockResult) => unknown, onrejected?: (v: unknown) => unknown) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

export function createTestApp() {
  const app = express();
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  }));
  return app;
}
