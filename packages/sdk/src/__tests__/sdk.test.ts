import { jest } from "@jest/globals";
import { MCTClient, ApiError, type ClientOptions, type RetryOptions } from "../index";
import type { ApiResponse } from "../types";

const BASE_URL = "https://api.test.com";

let mockFetch: jest.Mock<typeof fetch>;
let client: MCTClient;

function mockResponse<T>(data: T, ok = true): Promise<Response> {
  const body: ApiResponse<T> = { success: ok, data: ok ? data : undefined, error: ok ? undefined : { code: "ERROR", message: "Test error", status: 400 } };
  return Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(body),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? "OK" : "Bad Request",
    type: "basic" as ResponseType,
    url: "",
    clone: function () { return this; },
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(""),
  } as Response);
}

function createClient(opts?: Partial<ClientOptions>) {
  const options: ClientOptions = {
    baseUrl: BASE_URL,
    getToken: opts?.getToken,
  };
  return MCTClient.create(options);
}

describe("MCTClient", () => {
  beforeEach(() => {
    mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    client = createClient();
  });

  describe("constructor / create", () => {
    it("creates a client with all API properties", () => {
      expect(client.auth).toBeDefined();
      expect(client.organizations).toBeDefined();
      expect(client.memberships).toBeDefined();
      expect(client.tickets).toBeDefined();
      expect(client.projects).toBeDefined();
      expect(client.documents).toBeDefined();
      expect(client.dashboard).toBeDefined();
      expect(client.users).toBeDefined();
      expect(client.profiles).toBeDefined();
      expect(client.audit).toBeDefined();
      expect(client.roles).toBeDefined();
    });
  });

  describe("ApiClient auth token", () => {
    it("includes Bearer token when getToken returns a token", async () => {
      client = createClient({ getToken: () => Promise.resolve("test-token") });
      mockFetch.mockResolvedValue(mockResponse({ ok: true }));

      await client.roles.list();

      const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer test-token");
    });

    it("omits Authorization header when no token", async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: "1", key: "admin", name: "Admin" }]));

      await client.roles.list();

      const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });
  });

  describe("ApiError", () => {
    it("throws ApiError on non-ok response", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false));

      await expect(client.roles.list()).rejects.toThrow(ApiError);
      await expect(client.roles.list()).rejects.toMatchObject({
        code: "ERROR",
        message: "Test error",
        status: 400,
      });
    });

    it("throws ApiError on HTTP error with no json body", async () => {
      mockFetch.mockResolvedValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
        headers: new Headers(),
        redirected: false,
        statusText: "Internal Server Error",
        type: "basic" as ResponseType,
        url: "",
        clone: function () { return this; },
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(""),
      } as Response));

      await expect(client.roles.list()).rejects.toMatchObject({
        code: "UNKNOWN",
        message: "HTTP 500",
        status: 500,
      });
    });
  });

  describe("AuthApi", () => {
    it("signIn posts credentials", async () => {
      mockFetch.mockResolvedValue(mockResponse({ accessToken: "tok", user: { id: "1", email: "a@b.com" } }));

      const result = await client.auth.signIn("a@b.com", "pwd");

      expect(result.accessToken).toBe("tok");
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/auth/sign-in");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("signUp posts registration", async () => {
      mockFetch.mockResolvedValue(mockResponse({ user: { id: "1", email: "a@b.com" } }));

      await client.auth.signUp("a@b.com", "pwd", "Alice");

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.fullName).toBe("Alice");
    });

    it("signOut posts to sign-out", async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: true }));

      const result = await client.auth.signOut();

      expect(result.ok).toBe(true);
    });
  });

  describe("RolesApi", () => {
    it("list fetches all roles", async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: "1", key: "admin", name: "Admin" }]));

      const result = await client.roles.list();

      expect(result).toHaveLength(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/roles");
    });

    it("list with ids adds query param", async () => {
      mockFetch.mockResolvedValue(mockResponse([]));

      await client.roles.list({ ids: ["1", "2"] });

      expect(mockFetch.mock.calls[0][0]).toContain("ids=1%2C2");
    });

    it("get fetches a single role", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", key: "admin", name: "Admin" }));

      const result = await client.roles.get("1");

      expect(result.id).toBe("1");
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/roles/1");
    });
  });

  describe("OrganizationsApi", () => {
    const org = { id: "1", name: "Test", slug: "test", status: "active", primary_domain: null, support_plan: null, created_at: "", updated_at: "" };
    const domain = { id: "d1", organization_id: "1", domain: "ex.com", auto_approve: true, created_at: "" };

    it("list fetches organizations", async () => {
      mockFetch.mockResolvedValue(mockResponse([org]));

      const result = await client.organizations.list();

      expect(result).toHaveLength(1);
    });

    it("list with status and ids", async () => {
      mockFetch.mockResolvedValue(mockResponse([org]));

      await client.organizations.list({ status: "active", ids: ["1"] });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("status=active");
      expect(url).toContain("ids=1");
    });

    it("get fetches by id", async () => {
      mockFetch.mockResolvedValue(mockResponse(org));

      const result = await client.organizations.get("1");

      expect(result.id).toBe("1");
    });

    it("getDetail fetches compound org data", async () => {
      const detail = {
        organization: org,
        domains: [domain],
        memberships: [],
        profiles: [],
        roles: [],
      };
      mockFetch.mockResolvedValue(mockResponse(detail));

      const result = await client.organizations.getDetail("1");

      expect(result.organization).toBeDefined();
      expect(result.domains).toBeDefined();
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/organizations/1/detail");
    });

    it("create posts organization data", async () => {
      mockFetch.mockResolvedValue(mockResponse(org));

      await client.organizations.create({ name: "Test", slug: "test" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("update patches organization", async () => {
      mockFetch.mockResolvedValue(mockResponse(org));

      const result = await client.organizations.update("1", { name: "Updated" });

      expect(result.name).toBe("Test");
    });

    it("remove deletes organization", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));

      await client.organizations.remove("1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });

    it("listDomains fetches domains", async () => {
      mockFetch.mockResolvedValue(mockResponse([domain]));

      const result = await client.organizations.listDomains("1");

      expect(result).toHaveLength(1);
    });

    it("addDomain posts domain data", async () => {
      mockFetch.mockResolvedValue(mockResponse(domain));

      await client.organizations.addDomain("1", { domain: "ex.com" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("updateDomain patches domain", async () => {
      mockFetch.mockResolvedValue(mockResponse(domain));

      await client.organizations.updateDomain("1", "d1", { autoApprove: false });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("removeDomain deletes domain", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));

      await client.organizations.removeDomain("1", "d1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
  });

  describe("MembershipsApi", () => {
    const mem = { id: "1", organization_id: "1", user_id: "u1", role_id: "r1", status: "approved", is_billing_contact: false, is_security_contact: false, created_at: "" };

    it("list fetches memberships", async () => {
      mockFetch.mockResolvedValue(mockResponse([mem]));

      const result = await client.memberships.list();

      expect(result).toHaveLength(1);
    });

    it("list with filters adds query params", async () => {
      mockFetch.mockResolvedValue(mockResponse([mem]));

      await client.memberships.list({ organizationId: "1", status: "approved", userId: "u1" });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("organization_id=1");
      expect(url).toContain("status=approved");
      expect(url).toContain("user_id=u1");
    });

    it("mine fetches current user memberships", async () => {
      mockFetch.mockResolvedValue(mockResponse([mem]));

      const result = await client.memberships.mine();

      expect(result).toHaveLength(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/memberships/mine");
    });

    it("invite posts invitation", async () => {
      mockFetch.mockResolvedValue(mockResponse(mem));

      const result = await client.memberships.invite({ organizationId: "1", email: "a@b.com", roleId: "r1" });

      expect(result.id).toBe("1");
    });

    it("update patches membership", async () => {
      mockFetch.mockResolvedValue(mockResponse(mem));

      await client.memberships.update("1", { roleId: "r1", status: "approved" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("remove deletes membership", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));

      await client.memberships.remove("1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
  });

  describe("TicketsApi", () => {
    const ticket = { id: "1", organization_id: "1", title: "Test", description: null, status: "open", priority: "normal", category: null, source: "portal", created_at: "", updated_at: "" };

    it("list fetches paginated tickets", async () => {
      mockFetch.mockResolvedValue(mockResponse({ items: [ticket], total: 1, page: 1, limit: 25 }));

      const result = await client.tickets.list();

      expect(result.items).toHaveLength(1);
    });

    it("list with params", async () => {
      mockFetch.mockResolvedValue(mockResponse({ items: [], total: 0, page: 1, limit: 25 }));

      await client.tickets.list({ page: 2, limit: 10, organizationId: "1", status: "open" });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("page=2");
      expect(url).toContain("limit=10");
    });

    it("get fetches a ticket", async () => {
      mockFetch.mockResolvedValue(mockResponse(ticket));

      const result = await client.tickets.get("1");

      expect(result.id).toBe("1");
    });

    it("create posts a ticket", async () => {
      mockFetch.mockResolvedValue(mockResponse(ticket));

      const result = await client.tickets.create({ organizationId: "1", title: "New ticket" });

      expect(result.title).toBe("Test");
    });

    it("update patches a ticket", async () => {
      mockFetch.mockResolvedValue(mockResponse(ticket));

      await client.tickets.update("1", { title: "Updated" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("listComments fetches comments", async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: "c1", ticket_id: "1", organization_id: "1", author_id: "u1", body: "Hi", is_internal: false, created_at: "" }]));

      const result = await client.tickets.listComments("1");

      expect(result).toHaveLength(1);
    });

    it("addComment posts a comment", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "c1", ticket_id: "1", organization_id: "1", author_id: "u1", body: "Hi", is_internal: false, created_at: "" }));

      await client.tickets.addComment("1", { organizationId: "1", body: "Hi" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
  });

  describe("ProjectsApi", () => {
    const project = { id: "1", organization_id: "1", name: "P1", description: null, status: "active", priority: "normal", starts_at: null, due_at: null, created_at: "", updated_at: "" };
    const task = { id: "t1", project_id: "1", title: "Task", description: null, status: "todo", sort_order: 1, due_at: null, approval_required: false, owner_id: null, created_at: "" };

    it("list fetches paginated projects", async () => {
      mockFetch.mockResolvedValue(mockResponse({ items: [project], total: 1, page: 1, limit: 25 }));

      const result = await client.projects.list();

      expect(result.items).toHaveLength(1);
    });

    it("get fetches a project", async () => {
      mockFetch.mockResolvedValue(mockResponse(project));

      const result = await client.projects.get("1");

      expect(result.id).toBe("1");
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/projects/1");
    });

    it("getDetail fetches compound project data", async () => {
      const detail = {
        project: { ...project, project_tasks: [] },
        memberships: [],
        profiles: [],
        roles: [],
        tasks: [],
        comments: [],
        readStates: [],
      };
      mockFetch.mockResolvedValue(mockResponse(detail));

      const result = await client.projects.getDetail("1");

      expect(result.project).toBeDefined();
      expect(result.memberships).toBeDefined();
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/projects/1/detail");
    });

    it("create posts a project", async () => {
      mockFetch.mockResolvedValue(mockResponse(project));

      await client.projects.create({ organizationId: "1", name: "P1" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("update patches a project", async () => {
      mockFetch.mockResolvedValue(mockResponse(project));

      await client.projects.update("1", { name: "Updated" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("remove deletes a project", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));

      await client.projects.remove("1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });

    it("listTasks fetches tasks", async () => {
      mockFetch.mockResolvedValue(mockResponse([task]));

      const result = await client.projects.listTasks("1");

      expect(result).toHaveLength(1);
    });

    it("addTask posts a task", async () => {
      mockFetch.mockResolvedValue(mockResponse(task));

      const result = await client.projects.addTask("1", { title: "New" });

      expect(result.title).toBe("Task");
    });

    it("updateTask patches a task", async () => {
      mockFetch.mockResolvedValue(mockResponse(task));

      await client.projects.updateTask("1", "t1", { title: "Updated" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("removeTask deletes a task", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));

      await client.projects.removeTask("1", "t1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });

    it("addTaskComment posts a comment", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "c1", task_id: "t1", author_id: "u1", body: "Hi", is_internal: false, created_at: "" }));

      await client.projects.addTaskComment("1", "t1", { body: "Hi" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("updateTaskComment patches a comment", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "c1", task_id: "t1", author_id: "u1", body: "Hi", is_internal: false, created_at: "" }));

      await client.projects.updateTaskComment("1", "t1", "c1", { body: "Updated" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("removeTaskComment deletes a comment", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));

      await client.projects.removeTaskComment("1", "t1", "c1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });

    it("listTaskComments fetches task comments with filters", async () => {
      mockFetch.mockResolvedValue(mockResponse([]));

      await client.projects.listTaskComments("1", { organizationId: "o1", isInternal: false, taskIds: ["t1"] });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("organization_id=o1");
      expect(url).toContain("is_internal=false");
    });

    it("listReadStates fetches read states", async () => {
      mockFetch.mockResolvedValue(mockResponse([{ task_id: "t1", last_seen_at: "" }]));

      const result = await client.projects.listReadStates("1");

      expect(result).toHaveLength(1);
    });

    it("reorderTasks posts reorder data", async () => {
      mockFetch.mockResolvedValue(mockResponse({ reordered: 2 }));

      const result = await client.projects.reorderTasks("1", { order: ["t1", "t2"] });

      expect(result.reordered).toBe(2);
    });

    it("markTaskRead posts read marker", async () => {
      mockFetch.mockResolvedValue(mockResponse({ marked: true }));

      const result = await client.projects.markTaskRead("1", "t1", { organizationId: "o1" });

      expect(result.marked).toBe(true);
    });

    it("approveTask posts approval via RPC", async () => {
      mockFetch.mockResolvedValue(mockResponse({ approved: true }));

      const result = await client.projects.approveTask("1", "t1", { organizationId: "o1" });

      expect(result.approved).toBe(true);
    });

    it("addPortalTaskComment posts portal comment", async () => {
      mockFetch.mockResolvedValue(mockResponse({ added: true }));

      const result = await client.projects.addPortalTaskComment("1", "t1", { organizationId: "o1", body: "Nice" });

      expect(result.added).toBe(true);
    });

    it("listUpdates fetches updates", async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: "u1", project_id: "1", author_id: "u1", body: "Update", is_internal: false, is_pinned: false, created_at: "" }]));

      const result = await client.projects.listUpdates("1");

      expect(result).toHaveLength(1);
    });

    it("addUpdate posts an update", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "u1", project_id: "1", author_id: "u1", body: "Update", is_internal: false, is_pinned: false, created_at: "" }));

      await client.projects.addUpdate("1", { body: "Update" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("updateUpdate patches an update", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "u1", project_id: "1", author_id: "u1", body: "Update", is_internal: false, is_pinned: false, created_at: "" }));

      await client.projects.updateUpdate("1", "u1", { body: "Updated" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("removeUpdate deletes an update", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));

      await client.projects.removeUpdate("1", "u1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
  });

  describe("DocumentsApi", () => {
    const doc = { id: "1", organization_id: "1", name: "Doc", description: null, visibility: "public", folder_path: null, storage_bucket: null, storage_path: null, mime_type: null, file_name: null, file_size: null, uploaded_by: null, current_version: null, metadata: null, created_at: "", updated_at: "" };

    it("list fetches paginated documents", async () => {
      mockFetch.mockResolvedValue(mockResponse({ items: [doc], total: 1, page: 1, limit: 25 }));

      const result = await client.documents.list();

      expect(result.items).toHaveLength(1);
    });

    it("get fetches a document", async () => {
      mockFetch.mockResolvedValue(mockResponse(doc));

      const result = await client.documents.get("1");

      expect(result.id).toBe("1");
    });

    it("create posts a document", async () => {
      mockFetch.mockResolvedValue(mockResponse(doc));

      await client.documents.create({ organizationId: "1", name: "Doc" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("update patches a document", async () => {
      mockFetch.mockResolvedValue(mockResponse(doc));

      await client.documents.update("1", { name: "Updated" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("remove deletes a document", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));

      await client.documents.remove("1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });

    it("createSignedUrl posts to signed-url", async () => {
      mockFetch.mockResolvedValue(mockResponse({ signedUrl: "https://s3.test.com/doc" }));

      const result = await client.documents.createSignedUrl("1");

      expect(result.signedUrl).toBe("https://s3.test.com/doc");
    });

    it("upload posts FormData without Content-Type", async () => {
      mockFetch.mockResolvedValue(mockResponse(doc));
      const file = new Blob(["content"]);

      await client.documents.upload({ file, organizationId: "1", name: "Doc" });

      const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBeUndefined();
      expect(mockFetch.mock.calls[0][1]?.body).toBeInstanceOf(FormData);
    });

    it("bulkFolder posts to bulk/folder", async () => {
      mockFetch.mockResolvedValue(mockResponse({ updated: 2 }));

      const result = await client.documents.bulkFolder({ documentIds: ["1", "2"], folderPath: "/docs" });

      expect(result.updated).toBe(2);
    });

    it("bulkMetadata posts to bulk/metadata", async () => {
      mockFetch.mockResolvedValue(mockResponse({ updated: 1 }));

      await client.documents.bulkMetadata({ documentIds: ["1"], folderPath: "/docs" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("listVersions fetches document versions", async () => {
      const version = { id: "v1", document_id: "1", version_number: 1, storage_path: "/path", uploaded_by: "u1", checksum: null, created_at: "" };
      mockFetch.mockResolvedValue(mockResponse({ items: [version], total: 1, page: 1, limit: 20 }));

      const result = await client.documents.listVersions("1");

      expect(result.items).toHaveLength(1);
    });

    it("getVersion fetches a specific version", async () => {
      const version = { id: "v1", document_id: "1", version_number: 2, storage_path: "/path", uploaded_by: "u1", checksum: null, created_at: "" };
      mockFetch.mockResolvedValue(mockResponse(version));

      const result = await client.documents.getVersion("1", "v1");

      expect(result.version_number).toBe(2);
    });
  });

  describe("DashboardApi", () => {
    it("summary fetches dashboard counts", async () => {
      mockFetch.mockResolvedValue(mockResponse({ managedServices: 5, openTickets: 3, activeProjects: 2, totalDocuments: 10, pendingMemberships: 1 }));

      const result = await client.dashboard.summary();

      expect(result.managedServices).toBe(5);
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/dashboard/summary");
    });
  });

  describe("UsersApi", () => {
    it("list fetches all users", async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: "1", email: "a@b.com", full_name: "Alice", role_id: null, created_at: "" }]));

      const result = await client.users.list();

      expect(result).toHaveLength(1);
    });

    it("get fetches a user", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", email: "a@b.com", full_name: "Alice", role_id: null, created_at: "" }));

      const result = await client.users.get("1");

      expect(result.id).toBe("1");
    });

    it("getDetail fetches compound user data", async () => {
      const detail = {
        user: { id: "1", email: "a@b.com", full_name: "Alice", role_id: null, created_at: "" },
        profile: { id: "1", full_name: "Alice", email: "a@b.com" },
        memberships: [],
        organizations: [],
        roles: [],
        allRoles: [],
      };
      mockFetch.mockResolvedValue(mockResponse(detail));

      const result = await client.users.getDetail("1");

      expect(result.user).toBeDefined();
      expect(result.profile).toBeDefined();
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/users/1/detail");
    });

    it("me fetches current user", async () => {
      mockFetch.mockResolvedValue(mockResponse({ userId: "1", email: "a@b.com" }));

      const result = await client.users.me();

      expect(result.userId).toBe("1");
    });

    it("updateRole patches user role", async () => {
      mockFetch.mockResolvedValue(mockResponse({ updated: true }));

      const result = await client.users.updateRole("1", "r1");

      expect(result.updated).toBe(true);
      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });
  });

  describe("ProfilesApi", () => {
    const profile = { id: "1", full_name: "Alice", email: "a@b.com", phone: null, title: null, is_super_admin: false, default_organization_id: null, created_at: "" };

    it("list fetches all profiles", async () => {
      mockFetch.mockResolvedValue(mockResponse([profile]));

      const result = await client.profiles.list();

      expect(result).toHaveLength(1);
    });

    it("list with ids adds query param", async () => {
      mockFetch.mockResolvedValue(mockResponse([profile]));

      await client.profiles.list({ ids: ["1"] });

      expect(mockFetch.mock.calls[0][0]).toContain("ids=1");
    });

    it("get fetches a profile", async () => {
      mockFetch.mockResolvedValue(mockResponse(profile));

      const result = await client.profiles.get("1");

      expect(result.id).toBe("1");
    });

    it("update patches a profile", async () => {
      mockFetch.mockResolvedValue(mockResponse(profile));

      await client.profiles.update("1", { fullName: "Updated" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });
  });

  describe("AuditApi", () => {
    const log = { id: "1", organization_id: null, actor_user_id: null, actor_type: "user", action: "test", entity_type: "test", entity_id: null, metadata: null, created_at: "" };

    it("list fetches paginated audit logs", async () => {
      mockFetch.mockResolvedValue(mockResponse({ items: [log], total: 1, page: 1, limit: 25 }));

      const result = await client.audit.list();

      expect(result.items).toHaveLength(1);
    });

    it("list with all filters adds query params", async () => {
      mockFetch.mockResolvedValue(mockResponse({ items: [], total: 0, page: 1, limit: 25 }));

      await client.audit.list({ page: 2, limit: 10, actorUserId: "u1", organizationId: "o1", action: "create", entityType: "ticket" });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("page=2");
      expect(url).toContain("actor_user_id=u1");
      expect(url).toContain("organization_id=o1");
      expect(url).toContain("action=create");
      expect(url).toContain("entity_type=ticket");
    });
  });

  describe("RolesApi (integration - get)", () => {
    it("handles empty role list", async () => {
      mockFetch.mockResolvedValue(mockResponse([]));

      const result = await client.roles.list();

      expect(result).toEqual([]);
    });

    it("handles role not found", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false));

      await expect(client.roles.get("999")).rejects.toThrow(ApiError);
    });
  });

  describe("Retry logic", () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    it("retries on retryable status codes and succeeds on second attempt", async () => {
      const retryClient = MCTClient.create({
        baseUrl: BASE_URL,
        retries: { maxRetries: 2, initialDelayMs: 1, backoffFactor: 1, maxDelayMs: 10, retryableStatuses: [503] },
      });

      mockFetch
        .mockResolvedValueOnce(mockResponse(null, false).then(r => ({ ...r, ok: false, status: 503, json: () => Promise.resolve({ success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable", status: 503 } }) })))
        .mockResolvedValueOnce(mockResponse([{ id: "1", key: "admin", name: "Admin" }]));

      const result = await retryClient.roles.list();

      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws after exhausting retries on retryable status", async () => {
      const retryClient = MCTClient.create({
        baseUrl: BASE_URL,
        retries: { maxRetries: 1, initialDelayMs: 1, backoffFactor: 1, maxDelayMs: 10, retryableStatuses: [503] },
      });

      mockFetch.mockResolvedValue(
        Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({ success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable", status: 503 } }), headers: new Headers(), redirected: false, statusText: "Service Unavailable", type: "basic" as ResponseType, url: "", clone: function() { return this; }, body: null, bodyUsed: false, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), blob: () => Promise.resolve(new Blob()), formData: () => Promise.resolve(new FormData()), text: () => Promise.resolve("") } as Response)
      );

      await expect(retryClient.roles.list()).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        status: 503,
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("does not retry on non-retryable status codes", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false));

      await expect(client.roles.list()).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry on 4xx errors except 429", async () => {
      const retryClient = MCTClient.create({
        baseUrl: BASE_URL,
        retries: { maxRetries: 2, initialDelayMs: 1, backoffFactor: 1, maxDelayMs: 10, retryableStatuses: [429, 502, 503, 504] },
      });

      mockFetch.mockResolvedValue(
        Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({ success: false, error: { code: "BAD_REQUEST", message: "Bad request", status: 400 } }), headers: new Headers(), redirected: false, statusText: "Bad Request", type: "basic" as ResponseType, url: "", clone: function() { return this; }, body: null, bodyUsed: false, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), blob: () => Promise.resolve(new Blob()), formData: () => Promise.resolve(new FormData()), text: () => Promise.resolve("") } as Response)
      );

      await expect(retryClient.roles.list()).rejects.toMatchObject({ status: 400 });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("retries on network errors", async () => {
      const retryClient = MCTClient.create({
        baseUrl: BASE_URL,
        retries: { maxRetries: 1, initialDelayMs: 1, backoffFactor: 1, maxDelayMs: 10, retryableStatuses: [] },
      });

      mockFetch
        .mockRejectedValueOnce(new TypeError("fetch failed"))
        .mockResolvedValueOnce(mockResponse([{ id: "1", key: "admin", name: "Admin" }]));

      const result = await retryClient.roles.list();

      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws after exhausting retries on network errors", async () => {
      const retryClient = MCTClient.create({
        baseUrl: BASE_URL,
        retries: { maxRetries: 1, initialDelayMs: 1, backoffFactor: 1, maxDelayMs: 10, retryableStatuses: [] },
      });

      mockFetch.mockRejectedValue(new TypeError("fetch failed"));

      await expect(retryClient.roles.list()).rejects.toThrow("fetch failed");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("retries on AbortError (timeout) and succeeds on second attempt", async () => {
      const retryClient = MCTClient.create({
        baseUrl: BASE_URL,
        retries: { maxRetries: 1, initialDelayMs: 1, backoffFactor: 1, maxDelayMs: 10, retryableStatuses: [] },
      });

      mockFetch
        .mockRejectedValueOnce(new DOMException("The operation was aborted", "AbortError"))
        .mockResolvedValueOnce(mockResponse([{ id: "1", key: "admin", name: "Admin" }]));

      const result = await retryClient.roles.list();

      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("NotificationsApi", () => {
    const notif = { id: "n1", user_id: "u1", title: "Test", body: "Body", module: "tickets", action: "created", read: false, created_at: "" };

    it("list fetches notifications", async () => {
      mockFetch.mockResolvedValue(mockResponse({ items: [notif], total: 1, page: 1, limit: 20 }));

      const result = await client.notifications.list();

      expect(result.items).toHaveLength(1);
    });

    it("unreadCount fetches unread count", async () => {
      mockFetch.mockResolvedValue(mockResponse({ count: 3 }));

      const result = await client.notifications.unreadCount();

      expect(result.count).toBe(3);
    });

    it("markRead posts to mark notification read", async () => {
      mockFetch.mockResolvedValue(mockResponse(notif));

      await client.notifications.markRead("n1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("markAllRead posts to mark-all-read", async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: true }));

      await client.notifications.markAllRead();

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("create posts a notification", async () => {
      mockFetch.mockResolvedValue(mockResponse(notif));

      await client.notifications.create({ userId: "u1", title: "Test", body: "Body", module: "tickets", action: "created" });

      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("remove deletes a notification", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));

      await client.notifications.remove("n1");

      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
  });

  describe("BillingApi", () => {
    const invoice = { id: "inv1", organization_id: "o1", invoice_number: "INV-001", status: "paid", subtotal_cents: 10000, tax_cents: 0, total_cents: 10000, currency: "usd", created_at: "" };
    const subscription = { id: "sub1", organization_id: "o1", plan_name: "Premium", status: "active", amount_cents: 249900, currency: "usd", created_at: "" };

    it("summary fetches billing summary", async () => {
      mockFetch.mockResolvedValue(mockResponse({ activeSubscriptions: 1, overdueInvoices: 0, paidInvoices: 5, totalInvoices: 10, recentInvoices: [] }));
      const result = await client.billing.summary();
      expect(result.activeSubscriptions).toBe(1);
    });

    it("listInvoices fetches invoices", async () => {
      mockFetch.mockResolvedValue(mockResponse({ items: [invoice], total: 1, page: 1, limit: 20 }));
      const result = await client.billing.listInvoices();
      expect(result.items).toHaveLength(1);
    });

    it("getInvoice fetches single invoice", async () => {
      mockFetch.mockResolvedValue(mockResponse(invoice));
      const result = await client.billing.getInvoice("inv1");
      expect(result.invoice_number).toBe("INV-001");
    });

    it("listSubscriptions fetches subscriptions", async () => {
      mockFetch.mockResolvedValue(mockResponse([subscription]));
      const result = await client.billing.listSubscriptions();
      expect(result).toHaveLength(1);
    });

    it("syncFromStripe posts to billing/sync", async () => {
      mockFetch.mockResolvedValue(mockResponse({ synced: 2 }));
      const result = await client.billing.syncFromStripe();
      expect(result.synced).toBe(2);
    });
  });

  describe("WebhooksApi", () => {
    const webhook = { id: "wh1", organization_id: "o1", name: "Test", url: "https://example.com", events: ["ticket.created"], is_active: true, created_at: "" };

    it("list fetches webhook endpoints", async () => {
      mockFetch.mockResolvedValue(mockResponse([webhook]));
      const result = await client.webhooks.list();
      expect(result).toHaveLength(1);
    });

    it("get fetches single endpoint", async () => {
      mockFetch.mockResolvedValue(mockResponse(webhook));
      const result = await client.webhooks.get("wh1");
      expect(result.name).toBe("Test");
    });

    it("create posts a webhook endpoint", async () => {
      mockFetch.mockResolvedValue(mockResponse(webhook));
      await client.webhooks.create({ organizationId: "o1", name: "Test", url: "https://example.com", events: ["ticket.created"] });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });

    it("update patches a webhook endpoint", async () => {
      mockFetch.mockResolvedValue(mockResponse(webhook));
      await client.webhooks.update("wh1", { name: "Updated" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("remove deletes a webhook endpoint", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));
      await client.webhooks.remove("wh1");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });

    it("test posts to test endpoint", async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: true, status: 200, duration_ms: 50 }));
      const result = await client.webhooks.test("wh1");
      expect(result.ok).toBe(true);
    });
  });

  describe("accepts timeoutMs and retries configuration", () => {
    it("creates client with custom timeout and retries", () => {
      const configuredClient = MCTClient.create({
        baseUrl: BASE_URL,
        timeoutMs: 5000,
        retries: { maxRetries: 5, initialDelayMs: 100, backoffFactor: 3, maxDelayMs: 10000, retryableStatuses: [429, 503] },
      });

      expect(configuredClient).toBeDefined();
      expect(configuredClient.webhooks).toBeDefined();
    });
  });
});
