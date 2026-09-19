import { jest } from "@jest/globals";

// Set required env vars before any module imports
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key";

// Mock @sentry/node before any test imports trigger its module resolution
// This prevents the opentelemetry "AlwaysOn" import error from bundled deps
jest.mock("@sentry/node", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  withScope: jest.fn(),
  startSpan: jest.fn(),
  getCurrentHub: jest.fn(),
  Hub: jest.fn(),
  Scope: jest.fn(),
}));

// Mock @supabase/supabase-js to prevent Node 20 WebSocket errors
jest.mock("@supabase/supabase-js", () => {
  const mockClient = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
      })),
    },
  };
  return {
    createClient: jest.fn(() => mockClient),
  };
});
