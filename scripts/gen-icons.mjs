// Genera los íconos PNG de la PWA sin dependencias externas.
// Fondo verde salvia (maskable, a sangre) + un check blanco centrado.
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const SAGE = [122, 150, 112]; // #7a9670
const WHITE = [255, 255, 255];

// ── CRC32 ────────────────────────────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filtro "none"
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── Geometría ────────────────────────────────────────────────────────────────
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function makeIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const stroke = size * 0.09;
  // puntos del check (relativos)
  const p1 = [0.28 * size, 0.53 * size];
  const p2 = [0.44 * size, 0.69 * size];
  const p3 = [0.74 * size, 0.34 * size];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // fondo salvia a sangre (maskable)
      let [r, g, b] = SAGE;
      let a = 255;
      // check blanco con antialiasing suave
      const d = Math.min(
        distToSeg(x + 0.5, y + 0.5, ...p1, ...p2),
        distToSeg(x + 0.5, y + 0.5, ...p2, ...p3)
      );
      const edge = stroke / 2;
      if (d < edge + 1) {
        const aa = Math.max(0, Math.min(1, edge + 0.5 - d));
        r = Math.round(r * (1 - aa) + WHITE[0] * aa);
        g = Math.round(g * (1 - aa) + WHITE[1] * aa);
        b = Math.round(b * (1 - aa) + WHITE[2] * aa);
      }
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
    }
  }
  return encodePNG(size, size, rgba);
}

const outDir = path.resolve('public');
const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];
for (const [name, size] of targets) {
  fs.writeFileSync(path.join(outDir, name), makeIcon(size));
  console.log('escrito:', name, `(${size}x${size})`);
}
