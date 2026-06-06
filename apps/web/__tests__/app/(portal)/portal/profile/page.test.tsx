import { jest } from "@jest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ProfileClient from "@/app/(portal)/portal/profile/ProfileClient";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const initialData = {
  userId: "user-1",
  email: "test@example.com",
  fullName: "Test User",
  phone: "+1234567890",
  title: "Engineer",
};

const API_URL = "http://localhost:4000";

describe("PortalProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders profile form with user data", async () => {
    render(<ProfileClient initialData={initialData} apiUrl={API_URL} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("+1234567890")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Engineer")).toBeInTheDocument();
    });
  });

  it("renders email as read-only", async () => {
    render(<ProfileClient initialData={initialData} apiUrl={API_URL} />);

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue("test@example.com") as HTMLInputElement;
      expect(emailInput).toHaveAttribute("disabled");
    });
  });

  it("renders save button", async () => {
    render(<ProfileClient initialData={initialData} apiUrl={API_URL} />);
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("handles null initialData gracefully", async () => {
    render(<ProfileClient initialData={null} apiUrl={API_URL} />);
    expect(screen.queryByDisplayValue("Test User")).not.toBeInTheDocument();
  });
});
