import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// jsdom overrides globalThis, removing Node.js built-in Request/Response/Headers
// Next.js server code (next/cache) depends on these, so restore from globalThis
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder as any;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder as any;
}
if (typeof global.Request === "undefined") {
  global.Request = globalThis.Request as any;
}
if (typeof global.Response === "undefined") {
  global.Response = globalThis.Response as any;
}

// Suppress console output in tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
