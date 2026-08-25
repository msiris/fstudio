// 앱 아이콘 생성. 외부 의존성 없이 PNG를 직접 인코딩한다.
// 디자인 토큰의 bg(#0B0A14)와 accent(#7C4DFF)를 그대로 쓴다.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const BG = [0x0b, 0x0a, 0x14];
const ACCENT = [0x7c, 0x4d, 0xff];
const WHITE = [0xff, 0xff, 0xff];

const CRC_TABLE = (() => {
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
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter: none
    pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** 4각 별(astroid). |dx/r|^k + |dy/r|^k <= 1, k<1 이면 오목한 반짝임 모양이 된다. */
function insideStar(x, y, cx, cy, r, k = 0.6) {
  const dx = Math.abs(x - cx) / r;
  const dy = Math.abs(y - cy) / r;
  if (dx > 1 || dy > 1) return false;
  return Math.pow(dx, k) + Math.pow(dy, k) <= 1;
}

/** shapes: 뒤에 오는 것이 위에 그려진다. 픽셀당 3x3 슈퍼샘플링으로 계단을 없앤다. */
function render(size, shapes) {
  const px = Buffer.alloc(size * size * 3);
  const SS = 3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = BG[0], g = BG[1], b = BG[2];
      for (const shape of shapes) {
        let hits = 0;
        for (let sy = 0; sy < SS; sy++) {
          for (let sx = 0; sx < SS; sx++) {
            const px2 = x + (sx + 0.5) / SS;
            const py2 = y + (sy + 0.5) / SS;
            if (insideStar(px2, py2, shape.cx, shape.cy, shape.r, shape.k)) hits++;
          }
        }
        if (hits === 0) continue;
        const a = hits / (SS * SS);
        r = Math.round(r * (1 - a) + shape.color[0] * a);
        g = Math.round(g * (1 - a) + shape.color[1] * a);
        b = Math.round(b * (1 - a) + shape.color[2] * a);
      }
      const i = (y * size + x) * 3;
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
  }
  return encodePng(size, px);
}

/**
 * @param scale 마스커블 아이콘은 원형으로 잘려나가므로 내용을 안전 영역 안으로 줄인다.
 */
function icon(size, scale = 1) {
  const c = size / 2;
  return render(size, [
    { cx: c - size * 0.05, cy: c + size * 0.04, r: size * 0.34 * scale, k: 0.6, color: ACCENT },
    { cx: c + size * 0.22, cy: c - size * 0.22, r: size * 0.15 * scale, k: 0.6, color: WHITE },
  ]);
}

mkdirSync('public', { recursive: true });
writeFileSync('public/icon-192.png', icon(192));
writeFileSync('public/icon-512.png', icon(512));
writeFileSync('public/icon-maskable-512.png', icon(512, 0.72));
writeFileSync('public/apple-touch-icon.png', icon(180));
writeFileSync('public/favicon-32.png', icon(32));
console.log('아이콘 생성 완료');
