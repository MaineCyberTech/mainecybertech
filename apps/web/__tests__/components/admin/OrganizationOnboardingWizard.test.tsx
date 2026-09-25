import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockRolesList = jest.fn();
const mockOnboard = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: () => ({
    roles: { list: mockRolesList },
    organizations: { onboard: mockOnboard },
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("OrganizationOnboardingWizard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRolesList.mockResolvedValue([
      { id: "r1", key: "client_admin", name: "Client Admin" },
      { id: "r2", key: "client_user", name: "Client User" },
    ]);
    mockOnboard.mockResolvedValue({ organization: { id: "new-org" } });
  });

  it("walks through the steps and onboards", async () => {
    const Wizard = (await import("@/components/admin/OrganizationOnboardingWizard")).default;
    render(<Wizard />);

    expect(screen.getByLabelText(/Organization name/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Organization name/i), {
      target: { value: "Acme Manufacturing" },
    });
    fireEvent.change(screen.getByLabelText(/Primary domain/i), {
      target: { value: "acme.example" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    const email = await screen.findByLabelText(/Admin email/i);
    fireEvent.change(email, { target: { value: "admin@client.example" } });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await screen.findByText("admin@client.example");

    fireEvent.click(screen.getByRole("button", { name: /Create organization/i }));

    await waitFor(() =>
      expect(mockOnboard).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Acme Manufacturing",
          slug: "acme-manufacturing",
          primaryDomain: "acme.example",
          adminEmail: "admin@client.example",
          adminRoleKey: "client_admin",
        }),
      ),
    );

    expect(await screen.findByText(/Organization onboarded/i)).toBeInTheDocument();
    expect(screen.getByText("View organization").closest("a")).toHaveAttribute(
      "href",
      "/admin/organizations/new-org",
    );
  });

  it("validates required fields before advancing", async () => {
    const Wizard = (await import("@/components/admin/OrganizationOnboardingWizard")).default;
    render(<Wizard />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText(/Organization name is required/i)).toBeInTheDocument();
    expect(mockOnboard).not.toHaveBeenCalled();
  });
});
