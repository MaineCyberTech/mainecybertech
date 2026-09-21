import { AppError } from "../types";

/**
 * Shared upload content validation, used by the documents routes and the
 * public file-request upload. Declared MIME/extension is untrusted: markup is
 * rejected outright (stored-XSS vector) and image/PDF content is byte-sniffed.
 */
export function looksLikeMarkup(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 512).toString("utf8").toLowerCase();
  return (
    head.startsWith("<!doctype") ||
    head.startsWith("<html") ||
    head.includes("<script") ||
    head.includes("<svg") ||
    head.startsWith("<?xml")
  );
}

export function sniffImageType(buffer: Buffer): "jpeg" | "png" | "gif" | "webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (buffer.length >= 8 && buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") return "png";
  if (
    buffer.length >= 6 &&
    (buffer.toString("ascii", 0, 6) === "gif87a" || buffer.toString("ascii", 0, 6) === "gif89a")
  ) {
    return "gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "riff" &&
    buffer.toString("ascii", 8, 12) === "webp"
  ) {
    return "webp";
  }
  return null;
}

export function validateUploadContent(buffer: Buffer, declaredMime: string): void {
  // Markup/script content is rejected for every declared type — this is the
  // primary stored-XSS vector (an .svg/.html/.xml upload served inline).
  if (looksLikeMarkup(buffer)) {
    throw new AppError(
      "VALIDATION",
      "File content looks like HTML/SVG/script and is not allowed",
      400,
    );
  }

  if (declaredMime.startsWith("image/")) {
    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      throw new AppError(
        "VALIDATION",
        `File content does not match declared image type ${declaredMime}`,
        400,
      );
    }
    const expected: Record<string, string> = {
      "image/jpeg": "jpeg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    };
    if (expected[declaredMime] !== sniffed) {
      throw new AppError(
        "VALIDATION",
        `File content (${sniffed}) does not match declared type ${declaredMime}`,
        400,
      );
    }
    return;
  }

  if (declaredMime === "application/pdf") {
    if (!(buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "%pdf-")) {
      throw new AppError("VALIDATION", "File content is not a valid PDF", 400);
    }
  }
}
