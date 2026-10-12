import { render } from "@testing-library/react";
import DocumentPreview from "@/components/DocumentPreview";

/**
 * FILE-P3-008: untrusted files must never render from the storage origin
 * unsandboxed, and SVG (active content) must never be treated as an image.
 */
describe("DocumentPreview (FILE-P3-008)", () => {
  it("fully sandboxes the PDF preview iframe", () => {
    const { container } = render(
      <DocumentPreview
        url="https://signed.test/contract.pdf"
        mimeType="application/pdf"
        fileName="contract.pdf"
      />,
    );
    const frame = container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute("sandbox")).toBe("");
  });

  it("fully sandboxes the text/CSV/JSON preview iframe", () => {
    const { container } = render(
      <DocumentPreview url="https://signed.test/rows.csv" mimeType="text/csv" fileName="rows.csv" />,
    );
    const frame = container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute("sandbox")).toBe("");
  });

  it("never renders SVG as an inline image", () => {
    const { container, getByText } = render(
      <DocumentPreview
        url="https://signed.test/evil.svg"
        mimeType="image/svg+xml"
        fileName="evil.svg"
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(getByText("Preview not available for this file type.")).toBeInTheDocument();
  });

  it("still renders raster images inline", () => {
    const { container } = render(
      <DocumentPreview url="https://signed.test/photo.png" mimeType="image/png" fileName="photo.png" />,
    );
    expect(container.querySelector("img")).not.toBeNull();
  });
});
