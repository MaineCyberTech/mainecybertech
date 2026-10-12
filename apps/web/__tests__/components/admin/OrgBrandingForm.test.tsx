import { render } from "@testing-library/react";
import OrgBrandingForm from "@/components/admin/OrgBrandingForm";

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    organizations: {
      update: jest.fn(),
      uploadLogo: jest.fn(),
    },
  }),
}));

/**
 * FILE-P3-002: the client accept list must match the server's image allowlist
 * (JPEG/PNG/WebP/GIF). SVG is rejected by the API and must not be advertised.
 */
describe("OrgBrandingForm logo accept list (FILE-P3-002)", () => {
  it("accepts exactly the server-allowed image types", () => {
    const { container } = render(<OrgBrandingForm organizationId="org-1" />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    expect(input?.getAttribute("accept")).toBe("image/png,image/jpeg,image/webp,image/gif");
    expect(input?.getAttribute("accept")).not.toContain("svg");
  });

  it("documents the supported formats without mentioning SVG", () => {
    const { container } = render(<OrgBrandingForm organizationId="org-1" />);
    expect(container.textContent).toContain("PNG, JPG, WebP, or GIF. 5MB max.");
    expect(container.textContent).not.toContain("SVG");
  });
});
