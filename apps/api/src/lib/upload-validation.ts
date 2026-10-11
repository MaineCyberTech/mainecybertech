import { AppError } from "../types";

/**
 * Shared upload content validation, used by the documents routes and the
 * public file-request upload. Declared MIME/extension is untrusted: markup is
 * rejected outright (stored-XSS vector) and every allowed family is byte-
 * sniffed against its container signature.
 *
 * FILE-P2-005: the previous version only sniffed `image/*`/PDF and only
 * looked at the first 512 bytes, so Office, archive, text/JSON content was
 * stored unverified and a leading-padding polyglot could push markup past the
 * head check. Now:
 *   - markup is scanned across the whole buffer (`<?xml` stays head-only: PDF
 *     XMP metadata legitimately embeds XML);
 *   - detected container families cover images, PDF, Office (OOXML + legacy
 *     OLE2), archives (zip/gzip/7z/rar/tar), RTF, JSON and plain text;
 *   - the detected type must agree with the declared MIME and, when known,
 *     with the filename extension (polyglot mismatch).
 * Mismatches are rejected with `VALIDATION` 400, consistent with the existing
 * image/PDF policy.
 */

export type SniffedFileType =
  | "jpeg"
  | "png"
  | "gif"
  | "webp"
  | "pdf"
  | "ooxml"
  | "ole2"
  | "zip"
  | "gzip"
  | "7z"
  | "rar"
  | "tar"
  | "rtf"
  | "json"
  | "text";

// Markers that only matter at the start of the file (a document that opens
// with one of these is markup regardless of its declared type).
const MARKUP_LEADING_MARKERS = ["<!doctype", "<html", "<svg", "<?xml"];
// Markers rejected anywhere in the buffer: leading padding used to evade the
// 512-byte head check (FILE-P2-005). `<?xml` is deliberately absent — PDFs and
// Office parts can legitimately embed XML metadata deeper in the file.
const MARKUP_ANYWHERE_MARKERS = ["<script", "<svg", "<html", "<!doctype"];

export function looksLikeMarkup(buffer: Buffer): boolean {
  if (buffer.length === 0) return false;
  // latin1 keeps a 1:1 byte mapping so binary content cannot truncate the
  // scan; lowercasing catches mixed-case tags.
  const text = buffer.toString("latin1").toLowerCase();
  const start = text.slice(0, 4096).replace(/^[\s\uFEFF]+/, "");
  if (MARKUP_LEADING_MARKERS.some((marker) => start.startsWith(marker))) return true;
  return MARKUP_ANYWHERE_MARKERS.some((marker) => text.includes(marker));
}

export function sniffImageType(buffer: Buffer): "jpeg" | "png" | "gif" | "webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (buffer.length >= 8 && buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") return "png";
  if (buffer.length >= 6) {
    const gif = buffer.toString("ascii", 0, 6).toLowerCase();
    if (gif === "gif87a" || gif === "gif89a") return "gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4).toLowerCase() === "riff" &&
    buffer.toString("ascii", 8, 12).toLowerCase() === "webp"
  ) {
    return "webp";
  }
  return null;
}

function hasZipSignature(buffer: Buffer): boolean {
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) return false;
  const third = buffer[2];
  const fourth = buffer[3];
  return (
    (third === 0x03 && fourth === 0x04) || // local file header
    (third === 0x05 && fourth === 0x06) || // empty archive
    (third === 0x07 && fourth === 0x08) // spanned archive
  );
}

/**
 * OOXML packages (docx/xlsx/pptx) are zip containers that must carry an
 * `[Content_Types].xml` part. Its name is stored uncompressed in the zip local
 * header, so a raw byte search distinguishes a real Office file from a plain
 * zip.
 */
function looksLikeOoxml(buffer: Buffer): boolean {
  return buffer.includes("[Content_Types].xml");
}

function looksLikeText(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, 8192);
  if (sample.length === 0) return false;
  if (sample.includes(0)) return false;
  let printable = 0;
  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 0x20 && byte !== 0x7f)) {
      printable += 1;
    }
  }
  return printable / sample.length >= 0.9;
}

/**
 * Cheap structural JSON check: text content whose first non-whitespace byte is
 * `{`/`[` and whose last is the matching close. Full `JSON.parse` is avoided on
 * purpose — uploads can be 25 MB and this is a polyglot/type gate, not a
 * schema validator.
 */
function looksLikeJson(buffer: Buffer): boolean {
  if (!looksLikeText(buffer)) return false;
  const head = buffer
    .subarray(0, 1024)
    .toString("utf8")
    .replace(/^\uFEFF/, "")
    .trimStart();
  if (head.length === 0) return false;
  const close = head[0] === "{" ? "}" : head[0] === "[" ? "]" : null;
  if (!close) return false;
  const tail = buffer
    .subarray(Math.max(0, buffer.length - 1024))
    .toString("utf8")
    .trimEnd();
  return tail.endsWith(close);
}

export function sniffFileType(buffer: Buffer): SniffedFileType | null {
  const image = sniffImageType(buffer);
  if (image) return image;
  if (buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "%pdf-") return "pdf";
  if (buffer.length >= 8 && buffer.toString("hex", 0, 8) === "d0cf11e0a1b11ae1") return "ole2";
  if (hasZipSignature(buffer)) return looksLikeOoxml(buffer) ? "ooxml" : "zip";
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) return "gzip";
  if (buffer.length >= 6 && buffer.toString("hex", 0, 6) === "377abcaf271c") return "7z";
  if (buffer.length >= 8 && buffer.toString("ascii", 0, 8) === "Rar!\x1a\x07\x01\x00") {
    return "rar";
  }
  if (buffer.length >= 7 && buffer.toString("ascii", 0, 7) === "Rar!\x1a\x07\x00") return "rar";
  if (buffer.length >= 262 && buffer.toString("ascii", 257, 262) === "ustar") return "tar";
  if (buffer.length >= 5 && buffer.toString("ascii", 0, 5).toLowerCase() === "{\\rtf") return "rtf";
  if (looksLikeJson(buffer)) return "json";
  if (looksLikeText(buffer)) return "text";
  return null;
}

const IMAGE_MIME_TYPES: Record<string, SniffedFileType> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const DECLARED_MIME_TYPES: Record<string, SniffedFileType[]> = {
  "application/pdf": ["pdf"],
  "application/msword": ["ole2"],
  "application/vnd.ms-excel": ["ole2"],
  "application/vnd.ms-powerpoint": ["ole2"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["ooxml"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["ooxml"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["ooxml"],
  "application/zip": ["zip", "ooxml"],
  "application/x-zip-compressed": ["zip", "ooxml"],
  "application/gzip": ["gzip"],
  "application/x-7z-compressed": ["7z"],
  "application/vnd.rar": ["rar"],
  "application/x-rar-compressed": ["rar"],
  "application/x-tar": ["tar"],
  "application/rtf": ["rtf"],
  "application/json": ["json"],
  "text/plain": ["text", "json"],
  "text/csv": ["text", "json"],
};

const EXTENSION_TYPES: Record<string, SniffedFileType[]> = {
  jpg: ["jpeg"],
  jpeg: ["jpeg"],
  png: ["png"],
  gif: ["gif"],
  webp: ["webp"],
  pdf: ["pdf"],
  doc: ["ole2"],
  xls: ["ole2"],
  ppt: ["ole2"],
  docx: ["ooxml"],
  xlsx: ["ooxml"],
  pptx: ["ooxml"],
  zip: ["zip", "ooxml"],
  gz: ["gzip"],
  tgz: ["gzip"],
  "7z": ["7z"],
  rar: ["rar"],
  tar: ["tar"],
  rtf: ["rtf"],
  json: ["json"],
  txt: ["text", "json"],
  csv: ["text", "json"],
};

function extensionOf(name: string | undefined): string | null {
  if (!name) return null;
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return null;
  return name.slice(dot + 1).toLowerCase();
}

export function validateUploadContent(
  buffer: Buffer,
  declaredMime: string,
  originalName?: string,
): void {
  // Markup/script content is rejected for every declared type — this is the
  // primary stored-XSS vector (an .svg/.html/.xml upload served inline).
  if (looksLikeMarkup(buffer)) {
    throw new AppError(
      "VALIDATION",
      "File content looks like HTML/SVG/script and is not allowed",
      400,
    );
  }

  // An empty file has no content to execute or distribute; nothing to sniff.
  if (buffer.length === 0) return;

  const sniffed = sniffFileType(buffer);

  let expectedByMime: SniffedFileType[] | undefined;
  if (declaredMime.startsWith("image/")) {
    const imageType = IMAGE_MIME_TYPES[declaredMime];
    expectedByMime = imageType ? [imageType] : [];
  } else {
    expectedByMime = DECLARED_MIME_TYPES[declaredMime];
  }

  // Unknown declared types (not in the allow-lists) fall through to the
  // extension check below; the upload routes gate MIME before this helper.
  if (expectedByMime) {
    if (!sniffed || !expectedByMime.includes(sniffed)) {
      const detected = sniffed ? `File content (${sniffed})` : "File content";
      throw new AppError(
        "VALIDATION",
        `${detected} does not match declared type ${declaredMime}`,
        400,
      );
    }
  }

  // Polyglot guard: a known extension that disagrees with the sniffed content
  // is rejected even when the declared MIME looks plausible.
  const extension = extensionOf(originalName);
  if (sniffed && extension) {
    const expectedByExtension = EXTENSION_TYPES[extension];
    if (expectedByExtension && !expectedByExtension.includes(sniffed)) {
      throw new AppError(
        "VALIDATION",
        `File extension .${extension} does not match file content (${sniffed})`,
        400,
      );
    }
  }
}
