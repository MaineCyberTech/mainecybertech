/**
 * Shared test utilities — adapted from Chat Platform's mock builder pattern.
 * Provides chainable mock constructors for Supabase queries and common admin test mocks.
 */

/**
 * Chainable mock builder for Supabase-style queries.
 * Usage: mockBuilder.filter(...).maybeSingle(...).then(resolve(value))
 */
export function createMockBuilder<T = any>() {
  const chain: Record<string, jest.Mock> = {
    filter: jest.fn(),
    maybeSingle: jest.fn(),
    rpc: jest.fn(),
    upsert: jest.fn(),
    single: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
  };

  const builder = {
    filter: (...args: any[]) => {
      chain.filter(...args);
      return builder;
    },
    maybeSingle: () => {
      chain.maybeSingle();
      return builder;
    },
    single: () => {
      chain.single();
      return builder;
    },
    order: (...args: any[]) => {
      chain.order(...args);
      return builder;
    },
    limit: (...args: any[]) => {
      chain.limit(...args);
      return builder;
    },
    select: (...args: any[]) => {
      chain.select(...args);
      return builder;
    },
    rpc: (...args: any[]) => {
      chain.rpc(...args);
      return builder;
    },
    upsert: (...args: any[]) => {
      chain.upsert(...args);
      return builder;
    },
    then: (resolve: (value: T) => T) =>
      Promise.resolve(resolve({} as T)),
  };

  return builder;
}

/**
 * Default admin page test mocks.
 * Call in beforeEach to set up standard admin page test environment.
 */
export function setupAdminPageMocks() {
  return {
    requireAdminAccess: jest.fn().mockResolvedValue(undefined),
    apiClient: {
      organizations: { list: jest.fn(), get: jest.fn() },
      tickets: { list: jest.fn(), get: jest.fn() },
      documents: { list: jest.fn(), get: jest.fn() },
      projects: { list: jest.fn(), get: jest.fn() },
      memberships: { list: jest.fn() },
      audit: { list: jest.fn() },
      users: { list: jest.fn(), get: jest.fn() },
      webhooks: { list: jest.fn() },
      roles: { list: jest.fn(), get: jest.fn() },
      billing: {
        summary: jest.fn(),
        listInvoices: jest.fn(),
        listSubscriptions: jest.fn(),
        listPayments: jest.fn(),
      },
    },
  };
}