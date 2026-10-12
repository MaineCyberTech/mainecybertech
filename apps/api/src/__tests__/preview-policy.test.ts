import { shouldServeInline, signedUrlDisposition } from "../lib/preview-policy";

/**
 * FILE-P3-008: only previewable types may be signed inline; everything else is
 * served with an attachment disposition.
 */
describe("preview-policy (FILE-P3-008)", () => {
  it("allows inline preview for the types the portal renders", () => {
    for (const [mime, name] of [
      ["image/png", "logo.png"],
      ["image/jpeg", "photo.jpg"],
      ["application/pdf", "contract.pdf"],
      ["text/plain", "notes.txt"],
      ["text/csv", "rows.csv"],
      ["application/json", "data.json"],
      ["video/mp4", "clip.mp4"],
      ["audio/mpeg", "sound.mp3"],
    ] as const) {
      expect(shouldServeInline(mime, name)).toBe(true);
      expect(signedUrlDisposition(mime, name)).toBeUndefined();
    }
  });

  it("forces an attachment for non-previewable and active types", () => {
    for (const [mime, name] of [
      [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "contract.docx",
      ],
      ["application/zip", "archive.zip"],
      ["application/octet-stream", "unknown.bin"],
      ["image/svg+xml", "evil.svg"],
      ["text/html", "evil.html"],
      ["text/xml", "evil.xml"],
      ["application/xml", "evil.xml"],
    ] as const) {
      expect(shouldServeInline(mime, name)).toBe(false);
      expect(signedUrlDisposition(mime, name)).toEqual({ download: true });
    }
  });

  it("falls back to the extension when the MIME type is missing", () => {
    expect(shouldServeInline(null, "photo.webp")).toBe(true);
    expect(shouldServeInline(null, "invoice.pdf")).toBe(true);
    expect(shouldServeInline(null, "evil.svg")).toBe(false);
    expect(shouldServeInline(undefined, "notes")).toBe(false);
  });

  it("ignores MIME parameters and casing", () => {
    expect(shouldServeInline("IMAGE/PNG; charset=binary", "x.png")).toBe(true);
    expect(shouldServeInline("Image/SVG+XML", "x.svg")).toBe(false);
  });
});
