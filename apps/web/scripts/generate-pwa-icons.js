#!/usr/bin/env node
/**
 * Generate the PWA / favicon icon set from a single icon definition.
 *
 * Single source of truth: the ICON constant below. Running this script
 * rewrites the canonical SVG plus every raster output, so the manifest,
 * favicon, apple-touch icon and ICO can never drift apart:
 *
 *   node scripts/generate-pwa-icons.js
 *
 * Outputs (relative to apps/web/public):
 *   favicon.svg
 *   favicon.ico                        (16/32/48 BMP entries)
 *   apple-touch-icon.png               (180x180, full-bleed for iOS masking)
 *   icons/icon-192.png
 *   icons/icon-512.png
 *   icons/icon-512-maskable.png        (full-bleed safe-zone variant)
 *
 * Zero dependencies (Node's built-in zlib only) and supersampled 4x, so it
 * runs on a bare checkout and produces clean edges at every size.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ICON = {
  size: 32,
  cornerRadius: 6,
  bgFrom: [0x05, 0x96, 0x69],
  bgTo: [0x04, 0x78, 0x57],
  fg: [255, 255, 255],
  fgOpacity: 0.9,
  triangle: [
    [16, 8],
    [24, 24],
    [8, 24],
  ],
};

const SUPERSAMPLE = 4;
const PNG_SIZES = [192, 512];
const MASKABLE_SIZE = 512;
const APPLE_SIZE = 180;
const ICO_SIZES = [16, 32, 48];

function svgSource() {
  const hex = (c) =>
    `#${c
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")}`;
  const path = ICON.triangle.map(([x, y]) => `${x} ${y}`).join(" L");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON.size} ${ICON.size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${hex(ICON.bgFrom)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${hex(ICON.bgTo)};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${ICON.size}" height="${ICON.size}" rx="${ICON.cornerRadius}" fill="url(#grad)"/>
  <path d="M${path} Z" fill="white" opacity="${ICON.fgOpacity}"/>
</svg>`;
}

/**
 * Sample one sub-pixel in icon units. Coordinates are integers over the
 * denominator `size` (x = xNum / size) so the math is exact in both JS and
 * any other language port.
 */
function sample(xNum, yNum, size, maskable) {
  const total = ICON.size * size;
  if (xNum < 0 || yNum < 0 || xNum > total || yNum > total) {
    return null;
  }

  if (!maskable) {
    const r = ICON.cornerRadius * size;
    const rr = r * r;
    if (xNum < r && yNum < r) {
      if ((xNum - r) * (xNum - r) + (yNum - r) * (yNum - r) > rr) return null;
    } else if (xNum > total - r && yNum < r) {
      if (
        (xNum - (total - r)) * (xNum - (total - r)) + (yNum - r) * (yNum - r) >
        rr
      )
        return null;
    } else if (xNum < r && yNum > total - r) {
      if (
        (xNum - r) * (xNum - r) +
          (yNum - (total - r)) * (yNum - (total - r)) >
        rr
      )
        return null;
    } else if (xNum > total - r && yNum > total - r) {
      if (
        (xNum - (total - r)) * (xNum - (total - r)) +
          (yNum - (total - r)) * (yNum - (total - r)) >
        rr
      )
        return null;
    }
  }

  // Linear gradient from bgFrom (0,0) to bgTo (size,size): t = (x + y) / 2size.
  const den = 2 * ICON.size * size;
  const tNum = xNum + yNum;
  const colors = ICON.bgFrom.map((c0, i) =>
    Math.floor((c0 * den + (ICON.bgTo[i] - c0) * tNum + den / 2) / den),
  );

  const [a, b, c] = ICON.triangle;
  const cross = (px, py, qx, qy) => (qx - px) * (yNum - py) - (qy - py) * (xNum - px);
  const d1 = cross(a[0] * size, a[1] * size, b[0] * size, b[1] * size);
  const d2 = cross(b[0] * size, b[1] * size, c[0] * size, c[1] * size);
  const d3 = cross(c[0] * size, c[1] * size, a[0] * size, a[1] * size);
  const inTriangle =
    !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  if (inTriangle) {
    // fg at fgOpacity over the gradient background, rounded to integers.
    const alpha10 = Math.round(ICON.fgOpacity * 2550);
    return colors.map((c0) => Math.floor((alpha10 + c0 + 5) / 10));
  }
  return colors;
}

/** Render an RGBA buffer (top-down rows) for one icon size. */
function renderRgba(size, maskable = false) {
  const buf = Buffer.alloc(size * size * 4);
  let o = 0;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        const yNum = (8 * j + 2 * sy + 1) * 4;
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const xNum = (8 * i + 2 * sx + 1) * 4;
          const rgba = sample(xNum, yNum, size, maskable);
          if (rgba) {
            aSum += 255;
            rSum += rgba[0];
            gSum += rgba[1];
            bSum += rgba[2];
          }
        }
      }
      if (aSum === 0) {
        o += 4;
      } else {
        // Average colour over covered samples, alpha over all 16.
        buf[o++] = Math.floor((rSum * 510 + aSum) / (2 * aSum));
        buf[o++] = Math.floor((gSum * 510 + aSum) / (2 * aSum));
        buf[o++] = Math.floor((bSum * 510 + aSum) / (2 * aSum));
        buf[o++] = Math.floor((aSum + 8) / 16);
      }
    }
  }
  return buf;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([head, body, crc]);
}

function pngBytes(size, rgba) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter: none
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/** One BMP (DIB) entry for an ICO file: 32bpp BGRA + 1bpp AND mask. */
function icoBmpEntry(size, rgba) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0); // biSize
  header.writeInt32LE(size, 4); // biWidth
  header.writeInt32LE(size * 2, 8); // biHeight (XOR + AND)
  header.writeUInt16LE(1, 12); // biPlanes
  header.writeUInt16LE(32, 14); // biBitCount
  header.writeUInt32LE(size * size * 4, 20); // biSizeImage

  const xor = Buffer.alloc(size * size * 4);
  let o = 0;
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const p = (y * size + x) * 4;
      xor[o++] = rgba[p + 2];
      xor[o++] = rgba[p + 1];
      xor[o++] = rgba[p];
      xor[o++] = rgba[p + 3];
    }
  }

  const rowBytes = Math.ceil(size / 32) * 4;
  const andMask = Buffer.alloc(rowBytes * size);
  for (let y = 0; y < size; y++) {
    const row = (size - 1 - y) * rowBytes;
    for (let x = 0; x < size; x++) {
      if (rgba[(y * size + x) * 4 + 3] === 0) {
        andMask[row + (x >> 3)] |= 0x80 >> (x % 8);
      }
    }
  }
  return Buffer.concat([header, xor, andMask]);
}

function icoBytes(entries) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dirEntries = entries.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e[0] = size % 256;
    e[1] = size % 256;
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bit count
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([dir, ...dirEntries, ...entries.map((e) => e.data)]);
}

function writeFile(outDir, relPath, data) {
  const target = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  return target;
}

/** Write the full icon set under `outDir` (normally apps/web/public). */
function generateIcons(outDir) {
  const written = [];
  written.push(writeFile(outDir, "favicon.svg", Buffer.from(svgSource(), "utf8")));
  for (const size of PNG_SIZES) {
    written.push(
      writeFile(outDir, `icons/icon-${size}.png`, pngBytes(size, renderRgba(size))),
    );
  }
  written.push(
    writeFile(
      outDir,
      `icons/icon-${MASKABLE_SIZE}-maskable.png`,
      pngBytes(MASKABLE_SIZE, renderRgba(MASKABLE_SIZE, true)),
    ),
  );
  written.push(
    writeFile(
      outDir,
      "apple-touch-icon.png",
      pngBytes(APPLE_SIZE, renderRgba(APPLE_SIZE, true)),
    ),
  );
  const icoEntries = ICO_SIZES.map((size) => ({
    size,
    data: icoBmpEntry(size, renderRgba(size)),
  }));
  written.push(writeFile(outDir, "favicon.ico", icoBytes(icoEntries)));
  return written;
}

if (require.main === module) {
  const publicDir = path.join(__dirname, "..", "public");
  for (const file of generateIcons(publicDir)) {
    console.log(`wrote ${path.relative(publicDir, file)}`);
  }
}

module.exports = { ICON, generateIcons, renderRgba, svgSource, pngBytes, icoBytes };
