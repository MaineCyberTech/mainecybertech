import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockSummarize = jest.fn();
const mockReplyDraft = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    ai: {
      copilotSummarize: mockSummarize,
      copilotReplyDraft: mockReplyDraft,
    },
  }),
}));

import TicketCopilotPanel from "@/app/(admin)/admin/tickets/[ticketId]/TicketCopilotPanel";

describe("TicketCopilotPanel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the summary key points", async () => {
    mockSummarize.mockResolvedValue({
      ticketId: "t1",
      subject: "Printer down",
      status: "open",
      priority: "high",
      category: "Hardware",
      commentCount: 3,
      keyPoints: ["Printer offline", "User blocked"],
      suggestedNextAction: "Dispatch a technician",
    });

    render(<TicketCopilotPanel ticketId="t1" organizationId="org-1" />);
    fireEvent.click(screen.getByRole("button", { name: /summarize ticket/i }));

    expect(await screen.findByText("Printer offline")).toBeInTheDocument();
    expect(screen.getByText(/Dispatch a technician/)).toBeInTheDocument();
    expect(mockSummarize).toHaveBeenCalledWith("t1");
  });

  it("drafts a reply and inserts it into the comment box", async () => {
    mockReplyDraft.mockResolvedValue({
      draftReply: "Thanks for reaching out.",
      ticketSubject: "Printer down",
      tone: "friendly",
    });

    render(
      <div>
        <textarea id="ticket-add-comment" />
        <TicketCopilotPanel ticketId="t1" organizationId="org-1" />
      </div>,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "friendly" } });
    fireEvent.click(screen.getByRole("button", { name: /draft reply/i }));

    expect(await screen.findByText(/Thanks for reaching out/)).toBeInTheDocument();
    expect(mockReplyDraft).toHaveBeenCalledWith("t1", {
      organizationId: "org-1",
      tone: "friendly",
    });

    fireEvent.click(screen.getByRole("button", { name: /insert into comment box/i }));
    expect((document.getElementById("ticket-add-comment") as HTMLTextAreaElement).value).toBe(
      "Thanks for reaching out.",
    );
  });

  it("shows an error when summarization fails", async () => {
    mockSummarize.mockRejectedValue(new Error("boom"));
    render(<TicketCopilotPanel ticketId="t1" organizationId="org-1" />);
    fireEvent.click(screen.getByRole("button", { name: /summarize ticket/i }));

    await waitFor(() => expect(screen.getByText(/failed to summarize/i)).toBeInTheDocument());
  });
});
