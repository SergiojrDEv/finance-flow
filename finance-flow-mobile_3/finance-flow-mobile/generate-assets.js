// Gera assets PNG com ícone Finance Flow (fundo navy + "F" dourado)
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const assetsDir = path.join(__dirname, "assets");
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// Navy #0d1e35 = rgb(13, 30, 53)
const NAVY = [13, 30, 53];
// Gold #f4b740 = rgb(244, 183, 64)
const GOLD = [244, 183, 64];
// White
const WHITE = [255, 255, 255];

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

// Cria PNG com pixel map 2D (pixels[y][x] = [r,g,b])
function makePNGFromPixels(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixels[y][x] || NAVY;
      row[1 + x * 3] = r;
      row[1 + x * 3 + 1] = g;
      row[1 + x * 3 + 2] = b;
    }
    rawRows.push(row);
  }
  const raw = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(raw, { level: 1 });

  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// Cria grade de pixels (width x height) preenchida com uma cor
function makeGrid(width, height, fill) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) row.push([...fill]);
    rows.push(row);
  }
  return rows;
}

// Preenche um retângulo em pixels[y][x]
function fillRect(pixels, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++)
      if (pixels[y] && pixels[y][x]) pixels[y][x] = [...color];
}

// Desenha círculo preenchido
function fillCircle(pixels, cx, cy, radius, color) {
  for (let y = cy - radius; y <= cy + radius; y++)
    for (let x = cx - radius; x <= cx + radius; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2)
        if (pixels[y] && pixels[y][x]) pixels[y][x] = [...color];
}

// ── ÍCONE PRINCIPAL (1024×1024): fundo navy, quadrado gold com "F" navy ──
function makeIconPNG(size) {
  const pixels = makeGrid(size, size, NAVY);

  // Quadrado gold central (rounded feel com padding)
  const pad = Math.round(size * 0.13);
  const sq = size - pad * 2;

  // Quadrado gold com bordas arredondadas (aproximadas por 5 retângulos + 4 círculos)
  const rr = Math.round(sq * 0.18); // raio do arredondamento
  const x0 = pad, y0 = pad, x1 = pad + sq, y1 = pad + sq;

  // Interior
  fillRect(pixels, x0 + rr, y0, x1 - rr, y1, GOLD);       // centro vertical
  fillRect(pixels, x0, y0 + rr, x1, y1 - rr, GOLD);       // centro horizontal
  // Cantos
  fillCircle(pixels, x0 + rr, y0 + rr, rr, GOLD);
  fillCircle(pixels, x1 - rr, y0 + rr, rr, GOLD);
  fillCircle(pixels, x0 + rr, y1 - rr, rr, GOLD);
  fillCircle(pixels, x1 - rr, y1 - rr, rr, GOLD);

  // Letra "F" em navy dentro do quadrado gold
  const fw = Math.round(sq * 0.45); // largura da letra
  const fh = Math.round(sq * 0.58); // altura total
  const fx = Math.round(pad + sq * 0.27); // posição x
  const fy = Math.round(pad + sq * 0.21); // posição y
  const thick = Math.round(sq * 0.09); // espessura das barras

  // Barra vertical do F
  fillRect(pixels, fx, fy, fx + thick, fy + fh, NAVY);
  // Barra superior do F
  fillRect(pixels, fx, fy, fx + fw, fy + thick, NAVY);
  // Barra do meio do F (70% da largura)
  const midY = fy + Math.round(fh * 0.46);
  fillRect(pixels, fx, midY, fx + Math.round(fw * 0.78), midY + thick, NAVY);

  return makePNGFromPixels(size, size, pixels);
}

// ── ÍCONE ADAPTATIVO (1024×1024): fundo navy, só o "F" gold centralizado ──
function makeAdaptiveIconPNG(size) {
  const pixels = makeGrid(size, size, NAVY);

  // "F" dourado centralizado (maior, para adaptive icon)
  const fw = Math.round(size * 0.38);
  const fh = Math.round(size * 0.50);
  const thick = Math.round(size * 0.085);
  const fx = Math.round(size * 0.30);
  const fy = Math.round(size * 0.25);

  fillRect(pixels, fx, fy, fx + thick, fy + fh, GOLD);
  fillRect(pixels, fx, fy, fx + fw, fy + thick, GOLD);
  const midY = fy + Math.round(fh * 0.46);
  fillRect(pixels, fx, midY, fx + Math.round(fw * 0.78), midY + thick, GOLD);

  return makePNGFromPixels(size, size, pixels);
}

// ── NOTIFICATION ICON (96×96): "F" navy em fundo gold ──
function makeNotifIconPNG(size) {
  const pixels = makeGrid(size, size, GOLD);
  const fw = Math.round(size * 0.42);
  const fh = Math.round(size * 0.54);
  const thick = Math.round(size * 0.1);
  const fx = Math.round(size * 0.27);
  const fy = Math.round(size * 0.23);

  fillRect(pixels, fx, fy, fx + thick, fy + fh, NAVY);
  fillRect(pixels, fx, fy, fx + fw, fy + thick, NAVY);
  const midY = fy + Math.round(fh * 0.46);
  fillRect(pixels, fx, midY, fx + Math.round(fw * 0.78), midY + thick, NAVY);

  return makePNGFromPixels(size, size, pixels);
}

// ── FAVICON (48×48): só o "F" gold em navy ──
function makeFaviconPNG(size) {
  const pixels = makeGrid(size, size, NAVY);
  const fw = Math.round(size * 0.50);
  const fh = Math.round(size * 0.58);
  const thick = Math.round(size * 0.12);
  const fx = Math.round(size * 0.23);
  const fy = Math.round(size * 0.21);

  fillRect(pixels, fx, fy, fx + thick, fy + fh, GOLD);
  fillRect(pixels, fx, fy, fx + fw, fy + thick, GOLD);
  const midY = fy + Math.round(fh * 0.46);
  fillRect(pixels, fx, midY, fx + Math.round(fw * 0.78), midY + thick, GOLD);

  return makePNGFromPixels(size, size, pixels);
}

// ── SPLASH (1284×2778): navy puro com "F" gold centralizado ──
function makeSplashPNG(w, h) {
  const pixels = makeGrid(w, h, NAVY);
  const size = Math.round(w * 0.28);
  const fw = Math.round(size * 0.50);
  const fh = Math.round(size * 0.60);
  const thick = Math.round(size * 0.11);
  const fx = Math.round(w / 2 - fw * 0.45);
  const fy = Math.round(h / 2 - fh * 0.5);

  fillRect(pixels, fx, fy, fx + thick, fy + fh, GOLD);
  fillRect(pixels, fx, fy, fx + fw, fy + thick, GOLD);
  const midY = fy + Math.round(fh * 0.46);
  fillRect(pixels, fx, midY, fx + Math.round(fw * 0.78), midY + thick, GOLD);

  return makePNGFromPixels(w, h, pixels);
}

// Gerar arquivos
const tasks = [
  { name: "icon.png",              fn: () => makeIconPNG(1024) },
  { name: "adaptive-icon.png",     fn: () => makeAdaptiveIconPNG(1024) },
  { name: "notification-icon.png", fn: () => makeNotifIconPNG(96) },
  { name: "favicon.png",           fn: () => makeFaviconPNG(48) },
  { name: "splash.png",            fn: () => makeSplashPNG(1284, 2778) },
];

for (const task of tasks) {
  process.stdout.write(`  gerando ${task.name}...`);
  const buf = task.fn();
  fs.writeFileSync(path.join(assetsDir, task.name), buf);
  console.log(` ✓ (${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log("\n✅ Assets com ícone Finance Flow gerados em ./assets/");
