import { looksLikeMarkup, sniffFileType, validateUploadContent } from "../lib/upload-validation";
import { AppError } from "../types";

/**
 * FILE-P2-005: unit coverage for the shared upload content sniffer. The route
 * suites only exercised markup-at-the-head rejection; these tests pin the
 * container families (Office, archives, text/JSON), the full-buffer markup
 * scan, and the extension/declared-MIME polyglot checks.
 */

const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n");
const jpegBytes = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("jfif")]);
const pngBytes = Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), Buffer.alloc(8)]);
const gifBytes = Buffer.concat([Buffer.from("GIF89a"), Buffer.alloc(8)]);
const webpBytes = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.alloc(4),
  Buffer.from("WEBP"),
  Buffer.alloc(8),
]);
const zipBytes = Buffer.concat([
  Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]),
  Buffer.from("payload"),
]);
const ooxmlBytes = Buffer.concat([
  Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]),
  Buffer.from("[Content_Types].xml"),
  Buffer.alloc(4),
]);
const ole2Bytes = Buffer.concat([Buffer.from("d0cf11e0a1b11ae1", "hex"), Buffer.alloc(32)]);
const gzipBytes = Buffer.concat([Buffer.from([0x1f, 0x8b, 0x08, 0x00]), Buffer.alloc(8)]);
const sevenZipBytes = Buffer.concat([Buffer.from("377abcaf271c", "hex"), Buffer.alloc(8)]);
const rarBytes = Buffer.concat([Buffer.from("Rar!\x1a\x07\x00"), Buffer.alloc(8)]);
const tarBytes = (() => {
  const buffer = Buffer.alloc(512);
  buffer.write("file.txt", 0, "ascii");
  buffer.write("ustar", 257, "ascii");
  return buffer;
})();
const rtfBytes = Buffer.from("{\\rtf1\\ansi hello}");
const jsonBytes = Buffer.from('{"hello":"world"}');
const textBytes = Buffer.from("hello world\n");
const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function accepts(buffer: Buffer, mime: string, name?: string): void {
  expect(() => validateUploadContent(buffer, mime, name)).not.toThrow();
}

function rejection(buffer: Buffer, mime: string, name?: string): AppError {
  try {
    validateUploadContent(buffer, mime, name);
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("VALIDATION");
    return error as AppError;
  }
  throw new Error("expected validateUploadContent to reject the upload");
}

describe("looksLikeMarkup", () => {
  it("rejects leading markup and script tags", () => {
    expect(looksLikeMarkup(Buffer.from("<html><body>hi</body></html>"))).toBe(true);
    expect(looksLikeMarkup(Buffer.from("<!DOCTYPE html>"))).toBe(true);
    expect(looksLikeMarkup(Buffer.from("<?xml version=\"1.0\"?><svg/>"))).toBe(true);
    expect(looksLikeMarkup(Buffer.from("text before <script>alert(1)</script>"))).toBe(true);
  });

  it("finds markup padded past the old 512-byte head check", () => {
    const padded = Buffer.concat([
      Buffer.alloc(4096, 0x41),
      Buffer.from("<html><script>alert(1)</script>"),
    ]);
    expect(looksLikeMarkup(padded)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(looksLikeMarkup(Buffer.from("<SCRIPT>alert(1)</SCRIPT>"))).toBe(true);
    expect(looksLikeMarkup(Buffer.from("  <HTML>"))).toBe(true);
  });

  it("does not flag binary containers", () => {
    expect(looksLikeMarkup(pngBytes)).toBe(false);
    expect(looksLikeMarkup(ooxmlBytes)).toBe(false);
    expect(looksLikeMarkup(pdfBytes)).toBe(false);
  });
});

describe("sniffFileType", () => {
  it("detects the allowed image families", () => {
    expect(sniffFileType(jpegBytes)).toBe("jpeg");
    expect(sniffFileType(pngBytes)).toBe("png");
    expect(sniffFileType(gifBytes)).toBe("gif");
    expect(sniffFileType(webpBytes)).toBe("webp");
  });

  it("detects PDF and legacy Office (OLE2)", () => {
    expect(sniffFileType(pdfBytes)).toBe("pdf");
    expect(sniffFileType(ole2Bytes)).toBe("ole2");
  });

  it("distinguishes OOXML packages from plain zips", () => {
    expect(sniffFileType(ooxmlBytes)).toBe("ooxml");
    expect(sniffFileType(zipBytes)).toBe("zip");
  });

  it("detects archive families", () => {
    expect(sniffFileType(gzipBytes)).toBe("gzip");
    expect(sniffFileType(sevenZipBytes)).toBe("7z");
    expect(sniffFileType(rarBytes)).toBe("rar");
    expect(sniffFileType(tarBytes)).toBe("tar");
  });

  it("detects RTF, JSON and plain text", () => {
    expect(sniffFileType(rtfBytes)).toBe("rtf");
    expect(sniffFileType(jsonBytes)).toBe("json");
    expect(sniffFileType(textBytes)).toBe("text");
  });

  it("returns null for unknown binary content", () => {
    expect(sniffFileType(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]))).toBe(null);
  });
});

describe("validateUploadContent — declared-type agreement", () => {
  it("accepts images that match their declared type", () => {
    accepts(jpegBytes, "image/jpeg", "photo.jpg");
    accepts(pngBytes, "image/png", "photo.png");
    accepts(gifBytes, "image/gif", "photo.gif");
    accepts(webpBytes, "image/webp", "photo.webp");
  });

  it("rejects mismatched image bytes and non-images declared as images", () => {
    rejection(pngBytes, "image/jpeg", "photo.jpg");
    rejection(jpegBytes, "image/png", "photo.png");
    rejection(textBytes, "image/png", "photo.png");
  });

  it("accepts a valid PDF and rejects non-PDF content", () => {
    accepts(pdfBytes, "application/pdf", "invoice.pdf");
    rejection(Buffer.from("this is not a pdf"), "application/pdf", "invoice.pdf");
  });

  it("accepts OOXML for modern Office and OLE2 for legacy Office", () => {
    accepts(ooxmlBytes, docxMime, "contract.docx");
    accepts(ole2Bytes, "application/msword", "contract.doc");
    accepts(ole2Bytes, "application/vnd.ms-excel", "sheet.xls");
    accepts(ole2Bytes, "application/vnd.ms-powerpoint", "deck.ppt");
  });

  it("rejects a plain zip declared as an OOXML document", () => {
    rejection(zipBytes, docxMime, "contract.docx");
    rejection(textBytes, "application/msword", "contract.doc");
  });

  it("accepts archive containers for their declared types", () => {
    accepts(zipBytes, "application/zip", "archive.zip");
    accepts(ooxmlBytes, "application/zip", "archive.zip");
    accepts(gzipBytes, "application/gzip", "archive.gz");
    accepts(sevenZipBytes, "application/x-7z-compressed", "archive.7z");
    accepts(rarBytes, "application/vnd.rar", "archive.rar");
    accepts(tarBytes, "application/x-tar", "archive.tar");
  });

  it("accepts RTF, text and JSON content for their declared types", () => {
    accepts(rtfBytes, "application/rtf", "note.rtf");
    accepts(textBytes, "text/plain", "note.txt");
    accepts(textBytes, "text/csv", "rows.csv");
    accepts(jsonBytes, "application/json", "data.json");
    // JSON is text: a .json body declared as text/plain is not a mismatch.
    accepts(jsonBytes, "text/plain", "data.json");
  });

  it("rejects non-JSON text declared as application/json", () => {
    rejection(textBytes, "application/json", "data.json");
  });

  it("rejects markup for every declared type, padded or not", () => {
    const padded = Buffer.concat([Buffer.alloc(2048, 0x20), Buffer.from("<svg onload=alert(1)>")]);
    rejection(Buffer.from("<html><script>alert(1)</script></html>"), "text/plain", "evil.txt");
    rejection(padded, "text/plain", "evil.txt");
    rejection(padded, "application/zip", "evil.zip");
  });

  it("allows empty files (nothing to sniff or execute)", () => {
    accepts(Buffer.alloc(0), "text/plain", "empty.txt");
  });
});

describe("validateUploadContent — polyglot extension mismatches", () => {
  it("rejects content whose extension disagrees with the detected type", () => {
    // Declared MIME is plausible for the bytes, but the name says otherwise.
    rejection(pdfBytes, "application/pdf", "invoice.png");
    rejection(zipBytes, "application/zip", "archive.pdf");
    rejection(textBytes, "text/plain", "payload.pdf");
    rejection(ooxmlBytes, docxMime, "contract.pdf");
  });

  it("accepts matching extensions and ignores unknown ones", () => {
    accepts(pdfBytes, "application/pdf", "invoice.pdf");
    accepts(pngBytes, "image/png", "photo.png");
    accepts(textBytes, "text/plain", "notes.unknown");
    accepts(textBytes, "text/plain", "no-extension");
  });

  it("treats .zip and .docx as compatible with both zip and OOXML content", () => {
    accepts(ooxmlBytes, docxMime, "contract.docx");
    accepts(zipBytes, "application/zip", "archive.zip");
    accepts(ooxmlBytes, "application/zip", "archive.zip");
  });
});
