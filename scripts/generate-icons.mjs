import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)" />
  <circle cx="256" cy="256" r="160" fill="#FBBF24" stroke="#F59E0B" stroke-width="12" />
  <path d="M180 230 Q210 190 240 230" fill="none" stroke="#1E293B" stroke-width="16" stroke-linecap="round" />
  <path d="M272 230 Q302 190 332 230" fill="none" stroke="#1E293B" stroke-width="16" stroke-linecap="round" />
  <path d="M210 280 Q256 340 302 280" fill="none" stroke="#1E293B" stroke-width="16" stroke-linecap="round" />
  <circle cx="190" cy="280" r="24" fill="#F87171" opacity="0.6" />
  <circle cx="322" cy="280" r="24" fill="#F87171" opacity="0.6" />
</svg>`;

function createPng(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    let c = 0xffffffff;
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    for (let i = 0; i < typeAndData.length; i++) {
      c ^= typeAndData[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    c = (c ^ 0xffffffff) >>> 0;
    buf.writeUInt32BE(c, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < width * 0.35) {
        rawData[pixelOffset] = 251;
        rawData[pixelOffset + 1] = 191;
        rawData[pixelOffset + 2] = 36;
        rawData[pixelOffset + 3] = 255;
      } else {
        rawData[pixelOffset] = 79;
        rawData[pixelOffset + 1] = 70;
        rawData[pixelOffset + 2] = 229;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(32, 32));
console.log('Icons generated successfully.');
