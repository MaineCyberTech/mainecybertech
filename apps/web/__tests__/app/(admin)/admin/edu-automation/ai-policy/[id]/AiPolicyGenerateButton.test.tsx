import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockGenerate = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    eduAutomation: { aiPolicy: { generate: mockGenerate } },
  }),
}));

import AiPolicyGenerateButton from "@/app/(admin)/admin/edu-automation/ai-policy/[id]/AiPolicyGenerateButton";

describe("AiPolicyGenerateButton", () => {
  beforeEach(() => jest.clearAllMocks());

  it("generates a policy draft", async () => {
    mockGenerate.mockResolvedValue({ id: "ap1" });
    render(<AiPolicyGenerateButton id="ap1" />);

    fireEvent.click(screen.getByRole("button", { name: /generate draft/i }));

    await waitFor(() => expect(mockGenerate).toHaveBeenCalledWith("ap1"));
    expect(await screen.findByText(/draft generated/i)).toBeInTheDocument();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows an error when generation fails", async () => {
    mockGenerate.mockRejectedValue(new Error("boom"));
    render(<AiPolicyGenerateButton id="ap1" />);

    fireEvent.click(screen.getByRole("button", { name: /generate draft/i }));
    expect(await screen.findByText(/failed to generate/i)).toBeInTheDocument();
  });
});
