// Gera assets PNG placeholder para build de teste
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const assetsDir = path.join(__dirname, "assets");
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

function uint32BE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const crcBuf = Buffer.concat([typeBytes, data]);
  return Buffer.concat([uint32BE(data.length), typeBytes, data, uint32BE(crc32(crcBuf))]);
}

function makePNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Build scanlines: filter byte (0) + RGB per pixel
  const scanline = Buffer.alloc(1 + width * 3);
  scanline[0] = 0;
  for (let x = 0; x < width; x++) {
    scanline[1 + x * 3] = r;
    scanline[1 + x * 3 + 1] = g;
    scanline[1 + x * 3 + 2] = b;
  }
  const scanlines = Buffer.concat(Array.from({ length: height }, () => scanline));
  const compressed = zlib.deflateSync(scanlines, { level: 1 });

  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// Navy #0d1e35 = rgb(13, 30, 53)
const navy = [13, 30, 53];
// Gold #f4b740 = rgb(244, 183, 64)
const gold = [244, 183, 64];

const files = [
  { name: "icon.png",            w: 1024, h: 1024, color: navy },
  { name: "adaptive-icon.png",   w: 1024, h: 1024, color: navy },
  { name: "splash.png",          w: 1284, h: 2778, color: navy },
  { name: "favicon.png",         w: 48,   h: 48,   color: navy },
  { name: "notification-icon.png", w: 96, h: 96,   color: gold },
];

for (const f of files) {
  const [r, g, b] = f.color;
  const buf = makePNG(f.w, f.h, r, g, b);
  const dest = path.join(assetsDir, f.name);
  fs.writeFileSync(dest, buf);
  console.log(`✓ ${f.name} (${f.w}×${f.h})`);
}
console.log("\nAssets gerados em ./assets/");
