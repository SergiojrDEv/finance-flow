// Gera ícone Finance Flow com canvas real (fonte bem renderizada)
const { createCanvas } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "assets");
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

const NAVY = "#0d1e35";
const GOLD = "#f4b740";

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const rr = size * 0.2; // border radius

  // Fundo navy com bordas arredondadas
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.moveTo(rr, 0);
  ctx.lineTo(size - rr, 0);
  ctx.quadraticCurveTo(size, 0, size, rr);
  ctx.lineTo(size, size - rr);
  ctx.quadraticCurveTo(size, size, size - rr, size);
  ctx.lineTo(rr, size);
  ctx.quadraticCurveTo(0, size, 0, size - rr);
  ctx.lineTo(0, rr);
  ctx.quadraticCurveTo(0, 0, rr, 0);
  ctx.closePath();
  ctx.fill();

  // Quadrado gold interno (card)
  const pad = size * 0.13;
  const sq = size - pad * 2;
  const sqR = sq * 0.18;
  const x0 = pad, y0 = pad;

  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(x0 + sqR, y0);
  ctx.lineTo(x0 + sq - sqR, y0);
  ctx.quadraticCurveTo(x0 + sq, y0, x0 + sq, y0 + sqR);
  ctx.lineTo(x0 + sq, y0 + sq - sqR);
  ctx.quadraticCurveTo(x0 + sq, y0 + sq, x0 + sq - sqR, y0 + sq);
  ctx.lineTo(x0 + sqR, y0 + sq);
  ctx.quadraticCurveTo(x0, y0 + sq, x0, y0 + sq - sqR);
  ctx.lineTo(x0, y0 + sqR);
  ctx.quadraticCurveTo(x0, y0, x0 + sqR, y0);
  ctx.closePath();
  ctx.fill();

  // "F" em navy, centralizado no quadrado gold
  const fontSize = Math.round(sq * 0.62);
  ctx.fillStyle = NAVY;
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("F", size / 2, size / 2 + size * 0.02);

  return canvas.toBuffer("image/png");
}

function drawAdaptive(size) {
  // Adaptive icon: fundo navy, "F" gold centralizado (sem o quadrado)
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, size, size);

  const fontSize = Math.round(size * 0.55);
  ctx.fillStyle = GOLD;
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("F", size / 2, size / 2 + size * 0.02);

  return canvas.toBuffer("image/png");
}

function drawNotif(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, size, size);
  const fontSize = Math.round(size * 0.60);
  ctx.fillStyle = NAVY;
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("F", size / 2, size / 2 + size * 0.02);
  return canvas.toBuffer("image/png");
}

function drawFavicon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, size, size);
  const fontSize = Math.round(size * 0.65);
  ctx.fillStyle = GOLD;
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("F", size / 2, size / 2 + size * 0.02);
  return canvas.toBuffer("image/png");
}

const tasks = [
  { name: "icon.png",              fn: () => drawIcon(1024) },
  { name: "adaptive-icon.png",     fn: () => drawAdaptive(1024) },
  { name: "notification-icon.png", fn: () => drawNotif(96) },
  { name: "favicon.png",           fn: () => drawFavicon(48) },
];

for (const task of tasks) {
  process.stdout.write(`  gerando ${task.name}...`);
  const buf = task.fn();
  fs.writeFileSync(path.join(assetsDir, task.name), buf);
  console.log(` ✓ (${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log("\n✅ Ícones Finance Flow gerados com fonte real!");
