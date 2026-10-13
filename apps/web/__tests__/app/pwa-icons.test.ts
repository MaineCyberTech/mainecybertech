import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

import manifest from "@/app/manifest";

// The generator is a dependency-free CommonJS script; importing it must not
// run it (the require.main guard) so tests can regenerate into a temp dir.
const { generateIcons } = require("../../scripts/generate-pwa-icons.js") as {
  generateIcons: (outDir: string) => string[];
};

const PUBLIC_DIR = join(__dirname, "..", "..", "public");
const PNG_SIGNATURE = "89504e470d0a1a0a";

/** Minimal PNG reader for the generator's output (8-bit RGBA, filter-0 rows). */
function readPng(file: string) {
  const data = readFileSync(file);
  expect(data.subarray(0, 8).toString("hex")).toBe(PNG_SIGNATURE);
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.subarray(offset + 4, offset + 8).toString("ascii");
    const body = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      expect([body[8], body[9]]).toEqual([8, 6]); // 8-bit, RGBA
    } else if (type === "IDAT") {
      idat.push(body);
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    expect(raw[rowStart]).toBe(0);
    raw.copy(pixels, y * stride, rowStart + 1, rowStart + 1 + stride);
  }
  return { width, height, pixels };
}

describe("PWA manifest and icon set (MOB-P3-001, MOB-P3-005)", () => {
  it("declares installable 192/512 PNG icons, a maskable icon and the SVG fallback", () => {
    const icons = manifest().icons ?? [];
    const bySrc = new Map(icons.map((icon) => [icon.src, icon] as const));

    expect(bySrc.get("/icons/icon-192.png")).toMatchObject({
      sizes: "192x192",
      type: "image/png",
    });
    expect(bySrc.get("/icons/icon-512.png")).toMatchObject({
      sizes: "512x512",
      type: "image/png",
    });
    expect(bySrc.get("/icons/icon-512-maskable.png")).toMatchObject({
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    });
    expect(bySrc.get("/favicon.svg")).toMatchObject({
      sizes: "any",
      type: "image/svg+xml",
    });

    for (const icon of icons) {
      const asset = join(PUBLIC_DIR, icon.src.replace(/^\//, ""));
      expect(existsSync(asset)).toBe(true);
    }
  });

  it("ships PNG assets at the declared dimensions", () => {
    const expected: Array<[string, number]> = [
      ["icons/icon-192.png", 192],
      ["icons/icon-512.png", 512],
      ["icons/icon-512-maskable.png", 512],
      ["apple-touch-icon.png", 180],
    ];
    for (const [rel, size] of expected) {
      const { width, height } = readPng(join(PUBLIC_DIR, rel));
      expect([width, height]).toEqual([size, size]);
    }
  });

  it("ships a real multi-size ICO instead of SVG bytes", () => {
    const data = readFileSync(join(PUBLIC_DIR, "favicon.ico"));
    expect(data.subarray(0, 4).toString("hex")).toBe("00000100"); // reserved 0, type 1
    expect(data.readUInt16LE(4)).toBe(3);
    const sizes = [];
    for (let i = 0; i < 3; i++) {
      const width = data[6 + 16 * i];
      expect(data[7 + 16 * i]).toBe(width);
      sizes.push(width);
    }
    expect(sizes).toEqual([16, 32, 48]);
  });

  it("keeps the committed assets reproducible from scripts/generate-pwa-icons.js", () => {
    const outDir = mkdtempSync(join(tmpdir(), "mct-pwa-icons-"));
    try {
      generateIcons(outDir);

      for (const rel of [
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-512-maskable.png",
        "apple-touch-icon.png",
      ]) {
        expect(readPng(join(outDir, rel))).toEqual(readPng(join(PUBLIC_DIR, rel)));
      }

      // The ICO and SVG are uncompressed, so they must match byte-for-byte.
      expect(readFileSync(join(outDir, "favicon.ico")).equals(readFileSync(join(PUBLIC_DIR, "favicon.ico")))).toBe(true);
      expect(readFileSync(join(outDir, "favicon.svg")).equals(readFileSync(join(PUBLIC_DIR, "favicon.svg")))).toBe(true);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
