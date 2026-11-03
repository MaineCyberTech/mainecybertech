import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockListPreferences = jest.fn();
const mockUpdatePreferences = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    notifications: {
      listPreferences: mockListPreferences,
      updatePreferences: mockUpdatePreferences,
    },
  }),
}));

import NotificationPreferencesClient from "@/app/(portal)/portal/notifications/preferences/NotificationPreferencesClient";

describe("NotificationPreferencesClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListPreferences.mockResolvedValue({ preferences: [], modules: [], channels: [] });
  });

  it("saves preferences and shows the success banner", async () => {
    mockUpdatePreferences.mockResolvedValue({ updated: 10 });
    render(<NotificationPreferencesClient />);

    fireEvent.click(await screen.findByRole("button", { name: /save preferences/i }));

    await waitFor(() => expect(mockUpdatePreferences).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/preferences saved successfully/i)).toBeInTheDocument();
  });

  it("surfaces a save failure instead of swallowing it", async () => {
    mockUpdatePreferences.mockRejectedValue(new Error("organizationId is required"));
    render(<NotificationPreferencesClient />);

    fireEvent.click(await screen.findByRole("button", { name: /save preferences/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/organizationId is required/i);
    expect(screen.queryByText(/preferences saved successfully/i)).not.toBeInTheDocument();
  });

  it("surfaces a load failure with a retry instead of rendering all-on defaults", async () => {
    mockListPreferences.mockRejectedValueOnce(new Error("preferences unavailable"));
    render(<NotificationPreferencesClient />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("preferences unavailable");
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();

    mockListPreferences.mockResolvedValueOnce({ preferences: [], modules: [], channels: [] });
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByRole("button", { name: /save preferences/i })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("describes the save-button model in the help copy", async () => {
    render(<NotificationPreferencesClient />);

    expect(
      await screen.findByText(/changes take effect when you click save preferences/i),
    ).toBeInTheDocument();
  });

  it("surfaces and clears the global email opt-out (NOTIF-P2-013)", async () => {
    mockListPreferences.mockResolvedValue({
      preferences: [{ id: "all-1", module_key: "all", channel: "email", enabled: false }],
      modules: ["tickets", "projects", "documents", "billing", "system"],
      globalModule: "all",
      channels: ["email", "in_app", "push"],
    });
    mockUpdatePreferences.mockResolvedValue({ updated: 16 });

    render(<NotificationPreferencesClient />);

    const globalSwitch = await screen.findByRole("switch", {
      name: /email notifications for all modules/i,
    });
    expect(globalSwitch).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/email is paused for every module/i)).toBeInTheDocument();

    fireEvent.click(globalSwitch);
    fireEvent.click(screen.getByRole("button", { name: /save preferences/i }));

    await waitFor(() => expect(mockUpdatePreferences).toHaveBeenCalledTimes(1));
    const payload = mockUpdatePreferences.mock.calls[0][0] as {
      preferences: Array<{ moduleKey: string; channel: string; enabled: boolean }>;
    };
    expect(payload.preferences).toContainEqual({
      moduleKey: "all",
      channel: "email",
      enabled: true,
    });
  });
});
